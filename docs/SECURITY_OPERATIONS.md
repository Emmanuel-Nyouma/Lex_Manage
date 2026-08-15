# LexManage security operations

This document describes the deployment work required by the security controls in
the `20260815000001`–`20260815000003` security migrations. Do not deploy them until the encryption
key is backed up in a password manager or managed secrets vault.

## Required production secrets

Generate an application encryption key once:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Store it as `DATA_ENCRYPTION_KEY` in Render. Never rotate or delete it without a
key-rotation migration: losing this value makes encrypted legal data unrecoverable.

Also configure:

- `S3_SERVER_SIDE_ENCRYPTION=AES256` (or `aws:kms` plus `S3_KMS_KEY_ID`);
- `AUDIT_RETENTION_DAYS=730` (allowed range: 90–3650);
- `PUBLIC_API_URL=https://<your-render-service>.onrender.com`;
- `MALWARE_SCAN_MODE=required`, `CLAMAV_HOST`, `CLAMAV_PORT=3310`;
- `N8N_WEBHOOK_SECRET` with at least 32 random characters when n8n is enabled.

On Render, ClamAV should be a private Docker service reachable from the API service.
Uploads deliberately return HTTP 503 when a required scanner is absent or unhealthy;
the API never stores an unscanned document in production.

## Safe database rollout

1. Back up the Neon database and verify that the backup can be restored.
2. Set `DATA_ENCRYPTION_KEY` in the shell that can reach Neon.
3. Apply the schema migration: `npx prisma migrate deploy`.
4. Encrypt existing rows and build their blind indexes:
   `npm run security:encrypt-existing`.
5. Deploy the API with the same `DATA_ENCRYPTION_KEY` in Render.
6. Verify login, global search, document download, chat history and audit pagination.

The backfill is idempotent: encrypted values carry an `enc:v1:` prefix and are not
encrypted twice. During a rolling migration, readers accept legacy plaintext rows.

## n8n verification

Every request includes:

- `Authorization: Bearer <N8N_WEBHOOK_SECRET>`;
- `X-LexManage-Timestamp` (Unix time in milliseconds);
- `X-LexManage-Signature: v1=<hex HMAC-SHA256>`;
- `X-LexManage-Request-Id`.

n8n must reject requests older than five minutes, recompute the HMAC over
`<timestamp>.<raw JSON body>`, and compare signatures in constant time. Keep the
webhook behind HTTPS and reject reused request IDs within the five-minute window.

## Session and browser security

JWT signing and verification are pinned to HS256. `sessionVersion` is checked for
HTTP and WebSocket authentication and incremented on logout and password changes,
which revokes access tokens, refresh tokens and sockets. WebSockets also revalidate
the account every minute and disconnect at JWT expiry.

State-changing API calls use explicit Bearer headers, so browsers do not attach the
access credential cross-site. Cookie-based refresh routes additionally enforce an
allowed `Origin`; this is the appropriate CSRF control for the current token model.

## Retention and storage

Audit queries use cursor pagination. A daily tenant-unscoped maintenance operation
deletes audit events older than `AUDIT_RETENTION_DAYS`, using the global creation-date
index. Legal document objects request server-side encryption and signed downloads
carry `Cache-Control: private, no-store` with a maximum lifetime of 15 minutes.

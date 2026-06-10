# Supabase S3 smoke test

Proves the 4 storage operations LexManage needs work against Supabase's
S3-compatible endpoint **before** refactoring `minio.service.ts`.

## 1. Get Supabase S3 credentials (card-free)
1. Create a free Supabase project (GitHub login, no card).
2. Storage → create a bucket, e.g. `lexmanage-documents`.
3. Project Settings → Storage → **S3 access keys** → generate an access key + secret.
4. Note the **endpoint** and **region** shown on that page.

## 2. Set env vars (PowerShell)
```powershell
$env:S3_ENDPOINT   = "https://<project-ref>.supabase.co/storage/v1/s3"
$env:S3_REGION     = "us-east-1"          # whatever the dashboard shows
$env:S3_ACCESS_KEY = "<your-access-key>"
$env:S3_SECRET_KEY = "<your-secret-key>"
$env:S3_BUCKET     = "lexmanage-documents"
```

## 3. Run
```powershell
npm install
npm test
```

A passing run prints `✅ All 4 operations passed`. If any step fails, the
error name + message tells us whether it's a Supabase limitation (so we pivot
to Storj/iDrive) or just a config issue.

---

## Pivot option A — Storj (S3 gateway, 25 GB free, card-free)

1. Create a free Storj account (no card). Console → **Buckets** → create a bucket.
2. Console → **Access** → create an **S3 credential** (Access Key / Secret Key).
3. Same `npm test`, only the connection vars change:

```powershell
$env:S3_ENDPOINT   = "https://gateway.storjshare.io"
$env:S3_REGION     = "us-1"                 # Storj ignores region; any value works
$env:S3_ACCESS_KEY = "<storj-access-key>"
$env:S3_SECRET_KEY = "<storj-secret-key>"
$env:S3_BUCKET     = "lexmanage-documents"
```

Notes: Storj is real S3 over a global gateway, so `forcePathStyle:true` (already
set in `smoke.mjs`) is fine. No `/storage/v1/s3` path quirk like Supabase.

---

## Pivot option B — iDrive e2 (S3, 10 GB free, card-free)

1. Create a free iDrive e2 account (no card). Console → create a bucket.
2. Console → **Access Keys** → create an Access Key / Secret Key.
3. Copy the **endpoint URL shown for your bucket's region** (it's region-specific,
   e.g. `https://x1y2.va.idrivee2-NN.com`). Same `npm test`, change these vars:

```powershell
$env:S3_ENDPOINT   = "https://<your-region-endpoint>.idrivee2-NN.com"
$env:S3_REGION     = "us-east-1"            # e2 accepts us-east-1 as a default
$env:S3_ACCESS_KEY = "<e2-access-key>"
$env:S3_SECRET_KEY = "<e2-secret-key>"
$env:S3_BUCKET     = "lexmanage-documents"
```

Notes: use the **exact** endpoint host from the e2 console for your bucket —
it varies per region/account. Path-style + the global `fetch` of the presigned
URL both work on e2.

---

Whichever passes, the `minio.service.ts` refactor is identical — single bucket +
tenant-prefix keys via the AWS S3 SDK — only the 5 env vars differ. Delete this
whole folder once we've decided.

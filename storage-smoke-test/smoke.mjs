// Supabase Storage (S3 protocol) smoke test
// Verifies the 4 operations LexManage actually uses against Supabase's
// S3-compatible endpoint, BEFORE refactoring minio.service.ts.
//
// Run:  see README in this folder.
//
// NOTE: Supabase's S3 endpoint is a URL WITH A PATH (/storage/v1/s3),
// which the `minio` npm client cannot target. So we use the AWS SDK v3
// with forcePathStyle:true — the same client the real refactor would use.

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const {
  S3_ENDPOINT,     // https://<project-ref>.supabase.co/storage/v1/s3
  S3_REGION,       // e.g. us-east-1 / eu-central-1 (shown in Supabase dashboard)
  S3_ACCESS_KEY,   // Project Settings -> Storage -> S3 access keys
  S3_SECRET_KEY,
  S3_BUCKET,       // must be pre-created in the Supabase dashboard
} = process.env;

function requireEnv(name, val) {
  if (!val) {
    console.error(`✗ Missing env var: ${name}`);
    process.exit(1);
  }
}
requireEnv('S3_ENDPOINT', S3_ENDPOINT);
requireEnv('S3_REGION', S3_REGION);
requireEnv('S3_ACCESS_KEY', S3_ACCESS_KEY);
requireEnv('S3_SECRET_KEY', S3_SECRET_KEY);
requireEnv('S3_BUCKET', S3_BUCKET);

const client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  forcePathStyle: true, // REQUIRED for Supabase S3
  credentials: { accessKeyId: S3_ACCESS_KEY, secretAccessKey: S3_SECRET_KEY },
});

// Mirror the app's real key scheme: single bucket + tenant prefix
const tenantId = 'smoke-tenant-0001';
const objectKey = `lex-${tenantId}/${Date.now()}-smoke-test.txt`;
const payload = Buffer.from('LexManage Supabase S3 smoke test — hello world ✅', 'utf-8');

const step = async (label, fn) => {
  try {
    const result = await fn();
    console.log(`✓ ${label}`);
    return result;
  } catch (e) {
    console.error(`✗ ${label}`);
    console.error(`   → ${e.name}: ${e.message}`);
    process.exit(1);
  }
};

console.log(`\nTesting Supabase S3 against bucket "${S3_BUCKET}", key "${objectKey}"\n`);

// 1. putObject  (documents.service upload path)
await step('putObject (upload)', () =>
  client.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: objectKey,
    Body: payload,
    ContentType: 'text/plain',
  })),
);

// 2. getObject -> Buffer  (used for n8n RAG ingestion)
await step('getObject (download to buffer + content match)', async () => {
  const res = await client.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: objectKey }));
  const got = Buffer.from(await res.Body.transformToByteArray());
  if (!got.equals(payload)) {
    throw new Error(`content mismatch: expected ${payload.length} bytes, got ${got.length}`);
  }
});

// 3. presigned GET url  (download-url endpoint) + actually fetch it
await step('presignedGetObject (signed URL works for 900s + is fetchable)', async () => {
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: objectKey }),
    { expiresIn: 900 },
  );
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`presigned fetch returned HTTP ${resp.status}`);
  const text = await resp.text();
  if (!text.includes('hello world')) throw new Error('presigned download body unexpected');
});

// 4. removeObject  (delete/archive path)
await step('removeObject (delete)', () =>
  client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: objectKey })),
);

console.log('\n✅ All 4 operations passed — Supabase S3 protocol is functional for LexManage.\n');

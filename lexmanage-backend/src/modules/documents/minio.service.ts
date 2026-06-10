import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

/**
 * S3-compatible object storage service.
 *
 * Despite the legacy `MinioService` name, this talks to ANY S3-compatible
 * backend through the AWS SDK: self-hosted MinIO (local/VPS), Supabase Storage,
 * Storj, iDrive e2, etc. — selected purely via the S3_* env vars.
 *
 * Multi-tenant isolation is done by KEY PREFIX inside a single shared bucket
 * (`{tenantId}/{objectName}`), NOT by bucket-per-tenant — because hosted S3
 * providers (e.g. Supabase) do not allow dynamic bucket creation.
 */
@Injectable()
export class MinioService {
  private readonly logger = new Logger(MinioService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private bucketReady = false;

  constructor() {
    this.bucket = process.env.S3_BUCKET || 'lexmanage-documents';
    this.client = new S3Client({
      // Full endpoint URL.
      //   - Supabase: https://<project-ref>.supabase.co/storage/v1/s3
      //   - Local/VPS MinIO: http://minio:9000
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'us-east-1',
      forcePathStyle: true, // required for MinIO / Supabase / most S3-compatibles
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || '',
      },
    });
  }

  /** Single shared bucket; tenant isolation via key prefix. */
  private keyFor(tenantId: string, objectName: string): string {
    return `${tenantId.toLowerCase()}/${objectName}`;
  }

  /**
   * Ensure the shared bucket exists. Providers that support CreateBucket
   * (MinIO, Storj, iDrive) auto-provision it on first run; managed providers
   * (Supabase) reject CreateBucket, but the bucket is pre-created in their
   * dashboard so HeadBucket succeeds and we never attempt to create it.
   */
  private async ensureBucket(): Promise<void> {
    if (this.bucketReady) return;
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Created storage bucket "${this.bucket}"`);
      } catch (e: any) {
        // Bucket likely already exists but HeadBucket isn't permitted (Supabase).
        this.logger.warn(`ensureBucket: proceeding without create (${e?.name || e})`);
      }
    }
    this.bucketReady = true;
  }

  async uploadFile(
    file: Express.Multer.File,
    tenantId: string,
    pathPrefix = '',
  ): Promise<{ objectName: string }> {
    await this.ensureBucket();
    const ext = file.originalname.split('.').pop();
    const objectName = `${pathPrefix}${uuidv4()}.${ext}`;

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: this.keyFor(tenantId, objectName),
          Body: file.buffer,
          ContentType: file.mimetype,
          ContentLength: file.size,
        }),
      );
      return { objectName };
    } catch (e) {
      this.logger.error(`Upload failed: ${(e as Error).message}`);
      throw new InternalServerErrorException('File upload to storage failed');
    }
  }

  async deleteFile(tenantId: string, objectName: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: this.keyFor(tenantId, objectName) }),
    );
  }

  /**
   * Short-lived signed download URL for sensitive legal documents.
   * Capped at 15 minutes — never longer.
   */
  async getPresignedUrl(tenantId: string, objectName: string, expiry = 900): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: this.keyFor(tenantId, objectName) }),
      { expiresIn: Math.min(expiry, 900) },
    );
  }

  /**
   * Longer-lived signed URL for non-sensitive assets (e.g. firm logos) that are
   * embedded directly in <img> tags. Capped at 7 days (SigV4 maximum).
   */
  async getAssetUrl(
    tenantId: string,
    objectName: string,
    expiry = 7 * 24 * 3600,
  ): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: this.keyFor(tenantId, objectName) }),
      { expiresIn: Math.min(expiry, 7 * 24 * 3600) },
    );
  }

  /** Download an object as a Buffer (used for n8n RAG ingestion). */
  async getFileBuffer(tenantId: string, objectName: string): Promise<Buffer> {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: this.keyFor(tenantId, objectName) }),
    );
    return Buffer.from(await (res.Body as any).transformToByteArray());
  }
}

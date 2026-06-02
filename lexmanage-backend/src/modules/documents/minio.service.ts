import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MinioService {
  private readonly client: Minio.Client;

  constructor() {
    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });
  }

  private getTenantBucket(tenantId: string): string {
    return `lex-${tenantId.toLowerCase()}`;
  }

  private async ensureTenantBucket(tenantId: string) {
    const bucket = this.getTenantBucket(tenantId);
    const exists = await this.client.bucketExists(bucket);
    if (!exists) {
      await this.client.makeBucket(bucket, 'us-east-1');
      // Enable versioning for document audit trail
      await this.client.setBucketVersioning(bucket, { Status: 'Enabled' });
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    tenantId: string,
    pathPrefix = '',
  ): Promise<{ fileUrl: string; objectName: string }> {
    await this.ensureTenantBucket(tenantId);
    const bucket = this.getTenantBucket(tenantId);
    const ext = file.originalname.split('.').pop();
    const objectName = `${pathPrefix}${uuidv4()}.${ext}`;
    
    try {
      await this.client.putObject(
        bucket,
        objectName,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype },
      );
      const fileUrl = `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucket}/${objectName}`;
      return { fileUrl, objectName };
    } catch (e) {
      throw new InternalServerErrorException('File upload to storage failed');
    }
  }

  async deleteFile(tenantId: string, objectName: string) {
    const bucket = this.getTenantBucket(tenantId);
    await this.client.removeObject(bucket, objectName);
  }

  async getPresignedUrl(tenantId: string, objectName: string, expiry = 900): Promise<string> {
    const bucket = this.getTenantBucket(tenantId);
    // 15 minutes maximum — never more for legal documents
    return this.client.presignedGetObject(bucket, objectName, Math.min(expiry, 900));
  }
}

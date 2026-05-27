import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MinioService {
  private readonly client: Minio.Client;
  private readonly bucket: string;

  constructor() {
    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });
    this.bucket = process.env.MINIO_BUCKET || 'lexmanage-documents';
    this.ensureBucket();
  }

  private async ensureBucket() {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket, 'us-east-1');
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    tenantId: string,
  ): Promise<{ fileUrl: string; objectName: string }> {
    const ext = file.originalname.split('.').pop();
    const objectName = `${tenantId}/${uuidv4()}.${ext}`;
    try {
      await this.client.putObject(
        this.bucket,
        objectName,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype },
      );
      const fileUrl = `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${this.bucket}/${objectName}`;
      return { fileUrl, objectName };
    } catch (e) {
      throw new InternalServerErrorException('File upload to storage failed');
    }
  }

  async deleteFile(objectName: string) {
    await this.client.removeObject(this.bucket, objectName);
  }

  async getPresignedUrl(objectName: string, expiry = 3600): Promise<string> {
    return this.client.presignedGetObject(this.bucket, objectName, expiry);
  }
}

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMock, signedUrlMock, clientOptions } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  signedUrlMock: vi.fn(),
  clientOptions: [] as Record<string, unknown>[],
}));

vi.mock('@aws-sdk/client-s3', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@aws-sdk/client-s3')>();
  return {
    ...actual,
    S3Client: class MockS3Client {
      constructor(options: Record<string, unknown>) {
        clientOptions.push(options);
      }
      send = sendMock;
    },
  };
});

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: signedUrlMock,
}));

import { MinioService } from './minio.service';

describe('MinioService readiness', () => {
  beforeEach(() => {
    sendMock.mockReset();
    signedUrlMock.mockReset().mockResolvedValue('https://signed.test/object');
    clientOptions.length = 0;
    process.env.S3_ENDPOINT = 'http://minio:9000';
    process.env.S3_ACCESS_KEY = 'test-access-key';
    process.env.S3_SECRET_KEY = 'test-secret-key';
    process.env.S3_BUCKET = 'lexmanage-documents';
    delete process.env.S3_SERVER_SIDE_ENCRYPTION;
    delete process.env.S3_KMS_KEY_ID;
  });

  it('creates a missing bucket during the first health check and caches readiness', async () => {
    sendMock
      .mockRejectedValueOnce({
        name: 'NotFound',
        $metadata: { httpStatusCode: 404 },
      })
      .mockResolvedValueOnce({});
    const service = new MinioService();

    await service.checkHealth();
    await service.checkHealth();

    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sendMock.mock.calls[0][0].constructor.name).toBe('HeadBucketCommand');
    expect(sendMock.mock.calls[1][0].constructor.name).toBe('CreateBucketCommand');
  });

  it('uses an existing bucket without attempting creation', async () => {
    sendMock.mockResolvedValueOnce({});
    const service = new MinioService();
    await service.checkHealth();
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][0].constructor.name).toBe('HeadBucketCommand');
  });

  it('uses safe constructor defaults when optional S3 settings are absent', () => {
    delete process.env.S3_BUCKET;
    delete process.env.S3_REGION;
    delete process.env.S3_ACCESS_KEY;
    delete process.env.S3_SECRET_KEY;
    new MinioService();
    expect(clientOptions.at(-1)).toEqual(expect.objectContaining({
      region: 'us-east-1',
      credentials: { accessKeyId: '', secretAccessKey: '' },
    }));
  });

  it('surfaces an unexpected bucket check failure', async () => {
    sendMock.mockRejectedValueOnce({ name: 'AccessDenied', $metadata: { httpStatusCode: 403 } });
    await expect(new MinioService().checkHealth()).rejects.toMatchObject({
      message: 'Object storage bucket check failed (AccessDenied)',
    });
  });

  it.each(['BucketAlreadyExists', 'BucketAlreadyOwnedByYou'])(
    'accepts the create race %s as ready',
    async (name) => {
      sendMock.mockRejectedValueOnce({ name: 'NoSuchBucket' }).mockRejectedValueOnce({ name });
      await expect(new MinioService().checkHealth()).resolves.toBeUndefined();
    },
  );

  it('returns a stable error if bucket creation fails', async () => {
    sendMock.mockRejectedValueOnce({ name: 'NotFound' }).mockRejectedValueOnce(new Error('offline'));
    await expect(new MinioService().checkHealth()).rejects.toMatchObject({
      message: 'Object storage bucket is not available',
    });
  });

  it('uses the HTTP status when storage errors have no name', async () => {
    sendMock.mockRejectedValueOnce({ $metadata: { httpStatusCode: 403 } });
    await expect(new MinioService().checkHealth()).rejects.toThrow(
      'Object storage bucket check failed (403)',
    );
  });

  it('uses an unknown label when a bucket check error has no metadata', async () => {
    sendMock.mockRejectedValueOnce({});
    await expect(new MinioService().checkHealth()).rejects.toThrow(
      'Object storage bucket check failed (unknown)',
    );
  });

  it('handles non-Error bucket creation failures without leaking them', async () => {
    sendMock.mockRejectedValueOnce({ name: 'NotFound' }).mockRejectedValueOnce('offline');
    await expect(new MinioService().checkHealth()).rejects.toThrow(
      'Object storage bucket is not available',
    );
  });

  it('uploads under a lowercase tenant prefix with optional KMS encryption', async () => {
    process.env.S3_SERVER_SIDE_ENCRYPTION = 'aws:kms';
    process.env.S3_KMS_KEY_ID = 'kms-key-1';
    sendMock.mockResolvedValue({});
    const service = new MinioService();
    const file = {
      originalname: 'evidence.PDF', mimetype: 'application/pdf', size: 3, buffer: Buffer.from('pdf'),
    } as Express.Multer.File;

    const result = await service.uploadFile(file, 'TENANT-A', 'cases/case-1/');

    expect(result.objectName).toMatch(/^cases\/case-1\/[0-9a-f-]+\.PDF$/);
    const command = sendMock.mock.calls[1][0] as any;
    expect(command.constructor.name).toBe('PutObjectCommand');
    expect(command.input).toEqual(expect.objectContaining({
      Bucket: 'lexmanage-documents',
      Key: `tenant-a/${result.objectName}`,
      Body: file.buffer,
      ContentType: 'application/pdf',
      ContentLength: 3,
      ServerSideEncryption: 'aws:kms',
      SSEKMSKeyId: 'kms-key-1',
    }));
  });

  it('uploads without encryption fields when none are configured', async () => {
    sendMock.mockResolvedValue({});
    const service = new MinioService();
    await service.uploadFile({
      originalname: 'note.txt', mimetype: 'text/plain', size: 4, buffer: Buffer.from('note'),
    } as Express.Multer.File, 'tenant-a');

    const input = (sendMock.mock.calls[1][0] as any).input;
    expect(input.ServerSideEncryption).toBeUndefined();
    expect(input.SSEKMSKeyId).toBeUndefined();
  });

  it('uploads with AES encryption without a KMS key', async () => {
    process.env.S3_SERVER_SIDE_ENCRYPTION = 'AES256';
    sendMock.mockResolvedValue({});
    await new MinioService().uploadFile({
      originalname: 'note.txt', mimetype: 'text/plain', size: 4, buffer: Buffer.from('note'),
    } as Express.Multer.File, 'tenant-a');
    const input = (sendMock.mock.calls[1][0] as any).input;
    expect(input.ServerSideEncryption).toBe('AES256');
    expect(input.SSEKMSKeyId).toBeUndefined();
  });

  it('converts an object upload failure into a safe storage error', async () => {
    sendMock.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('secret provider failure'));
    const service = new MinioService();
    await expect(service.uploadFile({
      originalname: 'note.txt', mimetype: 'text/plain', size: 4, buffer: Buffer.from('note'),
    } as Express.Multer.File, 'tenant-a')).rejects.toMatchObject({
      message: 'File upload to storage failed',
    });
  });

  it('deletes only the tenant-prefixed object', async () => {
    sendMock.mockResolvedValue({});
    await new MinioService().deleteFile('TENANT-A', 'object.pdf');
    expect((sendMock.mock.calls[0][0] as any).input).toEqual({
      Bucket: 'lexmanage-documents', Key: 'tenant-a/object.pdf',
    });
  });

  it('caps sensitive URLs at 15 minutes and assets at seven days', async () => {
    const service = new MinioService();
    await expect(service.getPresignedUrl('tenant-a', 'legal.pdf', 99999))
      .resolves.toBe('https://signed.test/object');
    await service.getAssetUrl('tenant-a', 'logo.png', 9999999);

    expect(signedUrlMock.mock.calls[0][2]).toEqual({ expiresIn: 900 });
    expect((signedUrlMock.mock.calls[0][1] as any).input).toEqual(expect.objectContaining({
      Key: 'tenant-a/legal.pdf', ResponseCacheControl: 'private, no-store, max-age=0',
    }));
    expect(signedUrlMock.mock.calls[1][2]).toEqual({ expiresIn: 7 * 24 * 3600 });
    expect((signedUrlMock.mock.calls[1][1] as any).input.Key).toBe('tenant-a/logo.png');
  });

  it('utilise les expirations par défaut des URL signées', async () => {
    const service = new MinioService();
    await service.getPresignedUrl('tenant-a', 'legal.pdf');
    await service.getAssetUrl('tenant-a', 'logo.png');
    expect(signedUrlMock.mock.calls[0][2]).toEqual({ expiresIn: 900 });
    expect(signedUrlMock.mock.calls[1][2]).toEqual({ expiresIn: 7 * 24 * 3600 });
  });

  it('downloads an object body as a Buffer', async () => {
    const transformToByteArray = vi.fn().mockResolvedValue(Uint8Array.from([1, 2, 3]));
    sendMock.mockResolvedValue({ Body: { transformToByteArray } });

    await expect(new MinioService().getFileBuffer('tenant-a', 'object.bin'))
      .resolves.toEqual(Buffer.from([1, 2, 3]));
    expect((sendMock.mock.calls[0][0] as any).input.Key).toBe('tenant-a/object.bin');
  });
});

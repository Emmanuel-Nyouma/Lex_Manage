import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock('@aws-sdk/client-s3', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@aws-sdk/client-s3')>();
  return {
    ...actual,
    S3Client: class MockS3Client {
      send = sendMock;
    },
  };
});

import { MinioService } from './minio.service';

describe('MinioService readiness', () => {
  beforeEach(() => {
    sendMock.mockReset();
    process.env.S3_ENDPOINT = 'http://minio:9000';
    process.env.S3_ACCESS_KEY = 'test-access-key';
    process.env.S3_SECRET_KEY = 'test-secret-key';
    process.env.S3_BUCKET = 'lexmanage-documents';
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
});

import { HttpException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCurrentUser } from './decorators/current-user.decorator';
import { ApiExceptionFilter } from './filters/api-exception.filter';
import { CreateClientSchema } from './schemas/client.schema';
import {
  CreateNotificationSchema,
  CreateScheduledSchema,
  CreateTemplateSchema,
} from './schemas/notification.schema';

const executionContext = (user?: Record<string, unknown>) => ({
  switchToHttp: () => ({ getRequest: () => ({ user }) }),
}) as any;

describe('common edge-case contracts', () => {
  it('extracts either the complete current user or one optional property', () => {
    const user = { id: 'user-1', tenantId: 'tenant-a' };
    expect(getCurrentUser(undefined, executionContext(user))).toBe(user);
    expect(getCurrentUser('tenantId', executionContext(user))).toBe('tenant-a');
    expect(getCurrentUser('missing', executionContext(undefined))).toBeUndefined();
  });

  it('normalizes empty optional relation identifiers on client input', () => {
    const parsed = CreateClientSchema.parse({
      name: 'Lex Client',
      email: '',
      type_client: 'physique',
      caseId: '',
      deadlineId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(parsed.caseId).toBeUndefined();
    expect(parsed.deadlineId).toBe('550e8400-e29b-41d4-a716-446655440000');

    const inverse = CreateClientSchema.parse({
      name: 'Lex Client',
      type_client: 'morale',
      caseId: '550e8400-e29b-41d4-a716-446655440000',
      deadlineId: '',
    });
    expect(inverse.caseId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(inverse.deadlineId).toBeUndefined();
  });

  it('enforces notification level constraints for direct, template and scheduled sends', () => {
    const direct = { level: 'NORMAL', motif: 'HEARING' } as const;
    expect(CreateNotificationSchema.safeParse(direct).success).toBe(false);
    expect(CreateNotificationSchema.safeParse({ ...direct, level: 'IMPORTANT' }).success).toBe(true);

    expect(CreateTemplateSchema.safeParse({
      name: 'Audience', level: 'IMPORTANT', motif: 'HEARING',
    }).success).toBe(true);

    const future = new Date(Date.now() + 60_000).toISOString();
    expect(CreateScheduledSchema.safeParse({
      level: 'URGENT', motif: 'CONFLICT_DETECTED', scheduledAt: future,
    }).success).toBe(true);
    expect(CreateScheduledSchema.safeParse({
      level: 'NORMAL', motif: 'OTHER', scheduledAt: new Date(0).toISOString(),
    }).success).toBe(false);
  });
});

describe('ApiExceptionFilter complete normalization', () => {
  const response = { setHeader: vi.fn(), status: vi.fn(), json: vi.fn() };
  const request = { get: vi.fn(), method: 'GET', originalUrl: '/edge' };
  const host = {
    switchToHttp: () => ({ getResponse: () => response, getRequest: () => request }),
  } as any;

  afterEach(() => vi.restoreAllMocks());

  const run = (error: unknown) => {
    response.status.mockReturnValue(response);
    new ApiExceptionFilter().catch(error, host);
    return response.json.mock.calls.at(-1)?.[0];
  };

  it.each([
    ['P2025', 404, 'RESOURCE_NOT_FOUND'],
    ['P2003', 400, 'INVALID_RELATION'],
  ])('maps Prisma %s safely', (code, status, expectedCode) => {
    const error = new Prisma.PrismaClientKnownRequestError('private database detail', {
      code,
      clientVersion: '5.0.0',
    });
    expect(run(error)).toEqual(expect.objectContaining({ statusCode: status, code: expectedCode }));
  });

  it('falls back to an internal error for unrecognized Prisma errors', () => {
    const error = new Prisma.PrismaClientKnownRequestError('private database detail', {
      code: 'P2999',
      clientVersion: '5.0.0',
    });
    expect(run(error)).toEqual(expect.objectContaining({ statusCode: 500, code: 'INTERNAL_ERROR' }));
  });

  it.each([
    [new HttpException('plain response', 401), 'UNAUTHORIZED', 'plain response', undefined],
    [new HttpException({ message: 'denied' }, 403), 'FORBIDDEN', 'denied', undefined],
    [new HttpException({ message: { email: 'invalid' } }, 400), 'VALIDATION_ERROR', 'Http Exception', { email: 'invalid' }],
    [new HttpException({ fields: { id: 'missing' }, code: 'DOMAIN_ERROR' }, 422), 'DOMAIN_ERROR', 'Http Exception', { id: 'missing' }],
    [new HttpException({}, 418), 'HTTP_418', 'Http Exception', undefined],
  ])('normalizes all supported HTTP response shapes', (error, code, message, fields) => {
    const body = run(error);
    expect(body).toEqual(expect.objectContaining({ code, message }));
    expect(body.fields).toEqual(fields);
  });

  it('creates a request id and handles non-Error failures without leaking details', () => {
    request.get.mockReturnValue(undefined);
    const body = run('raw failure');
    expect(body.requestId).toEqual(expect.any(String));
    expect(body.message).toBe('An unexpected error occurred. Please try again.');
  });
});

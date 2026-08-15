import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const requestId = request.get('x-request-id') || randomUUID();
    const normalized = this.normalize(exception);

    if (normalized.status >= 500) {
      this.logger.error(
        `[${requestId}] ${request.method} ${request.originalUrl}: ${normalized.message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.setHeader('x-request-id', requestId);
    response.status(normalized.status).json({
      statusCode: normalized.status,
      code: normalized.code,
      message: normalized.message,
      ...(normalized.fields ? { fields: normalized.fields } : {}),
      requestId,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    });
  }

  private normalize(exception: unknown): {
    status: number;
    code: string;
    message: string;
    fields?: unknown;
  } {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return {
          status: HttpStatus.CONFLICT,
          code: 'DUPLICATE_RESOURCE',
          message: 'A record with the same unique value already exists.',
          fields: exception.meta?.target,
        };
      }
      if (exception.code === 'P2025') {
        return {
          status: HttpStatus.NOT_FOUND,
          code: 'RESOURCE_NOT_FOUND',
          message: 'The requested resource was not found.',
        };
      }
      if (exception.code === 'P2003') {
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'INVALID_RELATION',
          message: 'A referenced record is invalid.',
        };
      }
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        return { status, code: this.codeForStatus(status), message: body };
      }
      const payload = body as Record<string, unknown>;
      const rawMessage = payload.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(' ')
        : typeof rawMessage === 'string'
          ? rawMessage
          : exception.message;
      const fields =
        rawMessage && typeof rawMessage === 'object' && !Array.isArray(rawMessage)
          ? rawMessage
          : payload.fields;
      return {
        status,
        code: typeof payload.code === 'string' ? payload.code : this.codeForStatus(status),
        message,
        ...(fields ? { fields } : {}),
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred. Please try again.',
    };
  }

  private codeForStatus(status: number) {
    const names: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      413: 'PAYLOAD_TOO_LARGE',
      415: 'UNSUPPORTED_MEDIA_TYPE',
      429: 'RATE_LIMITED',
      503: 'SERVICE_UNAVAILABLE',
    };
    return names[status] || `HTTP_${status}`;
  }
}

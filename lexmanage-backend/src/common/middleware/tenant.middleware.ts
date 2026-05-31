import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { tenantContext } from '../context/tenant.context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    let tenantId: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        if (token) {
          const payloadPart = token.split('.')[1];
          if (payloadPart) {
            const decodedPayload = Buffer.from(payloadPart, 'base64').toString('utf8');
            const payload = JSON.parse(decodedPayload);
            if (payload && payload.tenantId) {
              tenantId = payload.tenantId;
            }
          }
        }
      } catch (error) {
        // Silent catch: if token parsing fails, context will remain without tenantId,
        // and subsequent AuthGuard will handle authentication validation/failure.
      }
    }

    // Run the downstream request handling inside the AsyncLocalStorage context
    tenantContext.run(tenantId, () => {
      next();
    });
  }
}

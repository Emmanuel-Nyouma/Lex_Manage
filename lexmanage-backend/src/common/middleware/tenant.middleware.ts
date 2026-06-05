import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { tenantContext } from '../context/tenant.context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    let tenantId: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          // SECURITY FIX: Verify JWT signature using JwtService
          // This ensures the token is authentic and hasn't been tampered with
          // CVE-2015-9235 Fix: Explicitly pin the allowed algorithms
          const payload = await this.jwtService.verifyAsync(token, {
            secret: process.env.JWT_SECRET,
            algorithms: ['HS256'],
          });
          
          if (payload && payload.tenantId) {
            tenantId = payload.tenantId;
          }
        } catch (error) {
          // If verification fails (expired, invalid signature, etc.), 
          // we don't set tenantId. Downstream AuthGuard will handle rejection.
        }
      }
    }

    // Run the downstream request handling inside the AsyncLocalStorage context
    tenantContext.run(tenantId, () => {
      next();
    });
  }
}

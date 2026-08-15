import { NextFunction, Request, Response } from 'express';

const SAFE_HOST = /^(?:\[[0-9a-f:]+\]|[a-z0-9.-]+)(?::\d{1,5})?$/i;

export function enforceHttps(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV !== 'production' || req.secure) {
    return next();
  }

  // Container health probes intentionally use the private HTTP listener.
  if (/^\/health(?:\/|$)/.test(req.path)) {
    return next();
  }

  const configuredOrigin = process.env.PUBLIC_API_URL || process.env.RENDER_EXTERNAL_URL;
  if (configuredOrigin) {
    const target = new URL(req.originalUrl, configuredOrigin);
    if (target.protocol !== 'https:') {
      return res.status(500).json({ message: 'PUBLIC_API_URL must use HTTPS' });
    }
    return res.redirect(308, target.toString());
  }

  const host = req.get('host') || '';
  if (!SAFE_HOST.test(host)) {
    return res.status(400).json({ message: 'Invalid Host header' });
  }
  return res.redirect(308, `https://${host}${req.originalUrl}`);
}

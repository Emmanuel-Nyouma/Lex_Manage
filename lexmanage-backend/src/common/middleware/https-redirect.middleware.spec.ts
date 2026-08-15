import { enforceHttps } from './https-redirect.middleware';

describe('enforceHttps', () => {
  const previousEnv = process.env.NODE_ENV;
  const previousUrl = process.env.PUBLIC_API_URL;

  afterEach(() => {
    if (previousEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnv;
    if (previousUrl === undefined) delete process.env.PUBLIC_API_URL;
    else process.env.PUBLIC_API_URL = previousUrl;
  });

  it('redirige en 308 vers l’origine HTTPS configurée', () => {
    process.env.NODE_ENV = 'production';
    process.env.PUBLIC_API_URL = 'https://api.lexmanage.example';
    const req = {
      secure: false,
      path: '/api/v1/cases',
      originalUrl: '/api/v1/cases?limit=10',
      get: vi.fn(),
    } as any;
    const res = { redirect: vi.fn(), status: vi.fn(), json: vi.fn() } as any;
    res.status.mockReturnValue(res);
    const next = vi.fn();

    enforceHttps(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith(
      308,
      'https://api.lexmanage.example/api/v1/cases?limit=10',
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('laisse passer la sonde de santé privée', () => {
    process.env.NODE_ENV = 'production';
    const req = { secure: false, path: '/health/ready' } as any;
    const next = vi.fn();
    enforceHttps(req, {} as any, next);
    expect(next).toHaveBeenCalledOnce();
  });
});

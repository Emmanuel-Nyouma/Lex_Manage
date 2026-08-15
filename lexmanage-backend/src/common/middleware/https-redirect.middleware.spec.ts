import { enforceHttps } from './https-redirect.middleware';

describe('enforceHttps', () => {
  const previousEnv = process.env.NODE_ENV;
  const previousUrl = process.env.PUBLIC_API_URL;
  const previousRenderUrl = process.env.RENDER_EXTERNAL_URL;

  afterEach(() => {
    if (previousEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnv;
    if (previousUrl === undefined) delete process.env.PUBLIC_API_URL;
    else process.env.PUBLIC_API_URL = previousUrl;
    if (previousRenderUrl === undefined) delete process.env.RENDER_EXTERNAL_URL;
    else process.env.RENDER_EXTERNAL_URL = previousRenderUrl;
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

  it.each([
    ['development', false],
    ['production', true],
  ])('laisse passer en environnement %s avec secure=%s', (environment, secure) => {
    process.env.NODE_ENV = environment;
    const next = vi.fn();
    enforceHttps({ secure, path: '/api', originalUrl: '/api' } as any, {} as any, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('refuse une origine configurée en HTTP', () => {
    process.env.NODE_ENV = 'production';
    process.env.PUBLIC_API_URL = 'http://api.lexmanage.example';
    const response = { status: vi.fn(), json: vi.fn() };
    response.status.mockReturnValue(response);
    enforceHttps({ secure: false, path: '/api', originalUrl: '/api' } as any, response as any, vi.fn());
    expect(response.status).toHaveBeenCalledWith(500);
  });

  it('utilise un Host validé en dernier recours et refuse un Host injecté', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.PUBLIC_API_URL;
    delete process.env.RENDER_EXTERNAL_URL;
    const validResponse = { redirect: vi.fn() };
    enforceHttps({
      secure: false, path: '/api', originalUrl: '/api?q=1', get: vi.fn(() => 'api.lex.test:443'),
    } as any, validResponse as any, vi.fn());
    expect(validResponse.redirect).toHaveBeenCalledWith(308, 'https://api.lex.test:443/api?q=1');

    const invalidResponse = { status: vi.fn(), json: vi.fn() };
    invalidResponse.status.mockReturnValue(invalidResponse);
    enforceHttps({
      secure: false, path: '/api', originalUrl: '/api', get: vi.fn(() => 'evil.test/path'),
    } as any, invalidResponse as any, vi.fn());
    expect(invalidResponse.status).toHaveBeenCalledWith(400);
  });

  it('refuse aussi un Host manquant', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.PUBLIC_API_URL;
    delete process.env.RENDER_EXTERNAL_URL;
    const response = { status: vi.fn(), json: vi.fn() };
    response.status.mockReturnValue(response);
    enforceHttps({
      secure: false, path: '/api', originalUrl: '/api', get: vi.fn(() => undefined),
    } as any, response as any, vi.fn());
    expect(response.status).toHaveBeenCalledWith(400);
  });
});

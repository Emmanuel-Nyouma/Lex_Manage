import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const client = vi.fn();
  const requestUse = vi.fn();
  const responseUse = vi.fn();
  client.interceptors = { request: { use: requestUse }, response: { use: responseUse } };
  return {
    client, requestUse, responseUse,
    store: { accessToken: null, refreshAccessToken: vi.fn() },
  };
});

vi.mock('axios', () => ({ default: { create: vi.fn(() => mocks.client) } }));
vi.mock('../store/useLexStore', () => ({
  default: { getState: () => mocks.store },
}));

import apiClient from './api';

const registeredRequestInterceptor = mocks.requestUse.mock.calls[0][0];
const [registeredResponseSuccess, registeredResponseFailure] = mocks.responseUse.mock.calls[0];

describe('apiClient', () => {
  let requestInterceptor;
  let responseSuccess;
  let responseFailure;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.store = { accessToken: null, refreshAccessToken: vi.fn() };
    requestInterceptor = registeredRequestInterceptor;
    responseSuccess = registeredResponseSuccess;
    responseFailure = registeredResponseFailure;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ajoute le bearer token seulement lorsqu’il existe', () => {
    const anonymous = { headers: {} };
    expect(requestInterceptor(anonymous)).toBe(anonymous);
    expect(anonymous.headers.Authorization).toBeUndefined();
    mocks.store.accessToken = 'access-token';
    const authenticated = { headers: {} };
    requestInterceptor(authenticated);
    expect(authenticated.headers.Authorization).toBe('Bearer access-token');
  });

  it('annonce une API réchauffée après une réponse réussie', () => {
    const listener = vi.fn();
    window.addEventListener('api:warmed', listener);
    const response = { data: { ok: true } };
    expect(responseSuccess(response)).toBe(response);
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener('api:warmed', listener);
  });

  it('réessaie une lecture après une erreur réseau et signale le réveil', async () => {
    vi.useFakeTimers();
    const warming = vi.fn();
    window.addEventListener('api:warming-up', warming);
    const config = { url: '/cases', method: 'get', headers: {} };
    mocks.client.mockResolvedValue({ data: 'retried' });
    const pending = responseFailure({ config });
    await vi.runAllTimersAsync();
    await expect(pending).resolves.toEqual({ data: 'retried' });
    expect(config._netRetry).toBe(1);
    expect(warming).toHaveBeenCalledTimes(1);
    expect(mocks.client).toHaveBeenCalledWith(config);
    window.removeEventListener('api:warming-up', warming);
  });

  it('ne réessaie pas les écritures non idempotentes', async () => {
    const error = { config: { url: '/cases', method: 'post' } };
    await expect(responseFailure(error)).rejects.toBe(error);
    expect(mocks.client).not.toHaveBeenCalled();
  });

  it('rafraîchit un 401 une seule fois puis rejoue la requête', async () => {
    mocks.store.refreshAccessToken.mockResolvedValue('fresh-token');
    mocks.client.mockResolvedValue({ data: 'ok' });
    const config = { url: '/cases', method: 'get', headers: {} };
    await expect(responseFailure({ config, response: { status: 401 } }))
      .resolves.toEqual({ data: 'ok' });
    expect(config._retry).toBe(true);
    expect(config.headers.Authorization).toBe('Bearer fresh-token');
    expect(mocks.client).toHaveBeenCalledWith(config);
  });

  it('propage l’échec du refresh et ignore un 401 du refresh lui-même', async () => {
    const refreshError = new Error('refresh failed');
    mocks.store.refreshAccessToken.mockRejectedValue(refreshError);
    await expect(responseFailure({
      config: { url: '/cases', method: 'get', headers: {} }, response: { status: 401 },
    })).rejects.toBe(refreshError);

    const original = { config: { url: '/auth/refresh', method: 'post' }, response: { status: 401 } };
    await expect(responseFailure(original)).rejects.toBe(original);
  });
});

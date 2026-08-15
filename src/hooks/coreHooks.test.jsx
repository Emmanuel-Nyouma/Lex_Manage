import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIdleTimeout } from './useIdleTimeout';
import { useKeyboardNavigation } from './useKeyboardNavigation';
import { useNetworkStatus } from './useNetworkStatus';
import { useSocket } from './useSocket';
import useTranslation from './useTranslation';

const mocks = vi.hoisted(() => ({
  store: { currentUser: null, accessToken: null, language: 'en' },
  socket: null,
  io: vi.fn(),
}));

vi.mock('socket.io-client', () => ({ io: mocks.io }));
vi.mock('../store/useLexStore', () => {
  const hook = (selector) => selector ? selector(mocks.store) : mocks.store;
  hook.getState = () => mocks.store;
  return { default: hook };
});

describe('hooks système', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.store = { currentUser: null, accessToken: null, language: 'en' };
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    Object.defineProperty(navigator, 'connection', { configurable: true, value: undefined });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('déclare la session inactive après le délai et la réactive sur activité', () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useIdleTimeout(1000));
    expect(result.current.isIdle).toBe(false);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.isIdle).toBe(true);
    act(() => window.dispatchEvent(new MouseEvent('mousemove')));
    expect(result.current.isIdle).toBe(false);
    act(() => result.current.setIsIdle(true));
    expect(result.current.isIdle).toBe(true);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('gère Escape et Enter sans soumettre depuis un textarea', () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn();
    const { unmount } = renderHook(() => useKeyboardNavigation(onClose, onSubmit));

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
    expect(onClose).toHaveBeenCalledTimes(1);
    const input = document.createElement('input');
    document.body.appendChild(input);
    act(() => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    act(() => textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('détecte immédiatement le mode hors ligne et réagit aux événements réseau', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useNetworkStatus());
    await waitFor(() => expect(result.current.status).toBe('offline'));
    expect(result.current).toEqual({ status: 'offline', rtt: null, isOnline: false });
    expect(fetchMock).not.toHaveBeenCalled();

    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    fetchMock.mockResolvedValue({ ok: true });
    act(() => window.dispatchEvent(new Event('online')));
    await waitFor(() => expect(result.current.status).toBe('online'));
    act(() => window.dispatchEvent(new Event('offline')));
    expect(result.current.status).toBe('offline');
  });

  it('classe une connexion lente via Network Information API', async () => {
    const connection = { effectiveType: '2g', addEventListener: vi.fn(), removeEventListener: vi.fn() };
    Object.defineProperty(navigator, 'connection', { configurable: true, value: connection });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    vi.spyOn(performance, 'now').mockReturnValueOnce(0).mockReturnValueOnce(30);
    const { result, unmount } = renderHook(() => useNetworkStatus());
    await waitFor(() => expect(result.current.status).toBe('slow'));
    expect(result.current.rtt).toEqual(expect.any(Number));
    expect(connection.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    unmount();
    expect(connection.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('retourne null sans session et crée une socket authentifiée avec nettoyage', () => {
    const disconnected = vi.fn();
    const connected = vi.fn();
    const handlers = {};
    const socket = {
      id: 'socket-1', connected: false, disconnect: disconnected, connect: connected,
      on: vi.fn((name, handler) => { handlers[name] = handler; }),
    };
    mocks.io.mockReturnValue(socket);

    const { result, rerender, unmount } = renderHook(() => useSocket());
    expect(result.current).toBeNull();
    expect(mocks.io).not.toHaveBeenCalled();

    mocks.store = { currentUser: { tenantId: 'tenant-a' }, accessToken: 'token-1', language: 'en' };
    rerender();
    expect(mocks.io).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      transports: ['websocket'], query: { tenantId: 'tenant-a' }, reconnectionAttempts: 10,
    }));
    const auth = mocks.io.mock.calls[0][1].auth;
    const callback = vi.fn();
    auth(callback);
    expect(callback).toHaveBeenCalledWith({ token: 'token-1' });
    act(() => handlers.connect());
    expect(result.current).toBe(socket);
    act(() => handlers.disconnect('transport close'));
    expect(result.current).toBeNull();
    unmount();
    expect(disconnected).toHaveBeenCalled();
  });

  it('reconnecte après une expulsion serveur et expose les traductions avec repli anglais', () => {
    vi.useFakeTimers();
    const handlers = {};
    const socket = {
      connected: false, disconnect: vi.fn(), connect: vi.fn(),
      on: vi.fn((name, handler) => { handlers[name] = handler; }),
    };
    mocks.io.mockReturnValue(socket);
    mocks.store = { currentUser: { tenantId: 'tenant-a' }, accessToken: 'token-1', language: 'fr' };
    const { result, rerender } = renderHook(() => ({ socket: useSocket(), translation: useTranslation() }));
    expect(result.current.translation.language).toBe('fr');
    act(() => handlers.disconnect('io server disconnect'));
    act(() => vi.advanceTimersByTime(2000));
    expect(socket.connect).toHaveBeenCalled();

    mocks.store = { ...mocks.store, language: 'unsupported' };
    rerender();
    expect(result.current.translation.language).toBe('unsupported');
    expect(result.current.translation.t).toBeDefined();
  });
});

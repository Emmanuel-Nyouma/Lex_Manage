import { beforeEach, describe, expect, it, vi } from 'vitest';
import useLexStore from './useLexStore';

const mocks = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn(), toastError: vi.fn() }));
vi.mock('../lib/api', () => ({ default: { post: mocks.post, get: mocks.get } }));
vi.mock('sonner', () => ({ toast: { error: mocks.toastError } }));

const resetStore = () => {
  useLexStore.setState({
    currentUser: null, accessToken: null, language: 'en', theme: 'light',
    isLoading: false, isRefreshing: false, refreshPromise: null,
  });
};

describe('useLexStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.className = '';
    resetStore();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('persiste la langue, le thème et seulement le marqueur de session', () => {
    const store = useLexStore.getState();
    store.setLanguage('fr');
    store.setTheme('dark');
    store.setAccessToken('access-token');
    expect(localStorage.getItem('language')).toBe('fr');
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('wasLoggedIn')).toBe('true');
    expect(localStorage.getItem('accessToken')).toBeNull();
    useLexStore.getState().setTheme('light');
    useLexStore.getState().setAccessToken(null);
    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem('wasLoggedIn')).toBeNull();
  });

  it('connecte puis déconnecte un utilisateur', async () => {
    mocks.post.mockResolvedValueOnce({ data: { accessToken: 'token-1', user: { id: 'user-1' } } });
    await useLexStore.getState().login('alice@example.test', 'password');
    expect(useLexStore.getState()).toEqual(expect.objectContaining({ accessToken: 'token-1', currentUser: { id: 'user-1' }, isLoading: false }));
    mocks.post.mockResolvedValueOnce({ data: {} });
    await useLexStore.getState().logout();
    expect(useLexStore.getState().currentUser).toBeNull();
    expect(useLexStore.getState().accessToken).toBeNull();
  });

  it('propage l’échec de connexion et nettoie toujours le chargement', async () => {
    const error = { response: { data: { message: 'Invalid credentials' } } };
    mocks.post.mockRejectedValueOnce(error);
    await expect(useLexStore.getState().login('alice@example.test', 'bad')).rejects.toBe(error);
    expect(useLexStore.getState().isLoading).toBe(false);
  });

  it('signale un échec de déconnexion mais efface la session locale', async () => {
    useLexStore.setState({ currentUser: { id: 'user-1' }, accessToken: 'token' });
    mocks.post.mockRejectedValueOnce(new Error('offline'));
    await useLexStore.getState().logout();
    expect(mocks.toastError).toHaveBeenCalled();
    expect(useLexStore.getState().currentUser).toBeNull();
  });

  it('hydrate le profil et invalide une session refusée', async () => {
    mocks.get.mockResolvedValueOnce({ data: { id: 'user-1', firstName: 'Alice' } });
    await expect(useLexStore.getState().fetchMe()).resolves.toEqual({ id: 'user-1', firstName: 'Alice' });
    localStorage.setItem('wasLoggedIn', 'true');
    mocks.get.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(useLexStore.getState().fetchMe()).rejects.toBeDefined();
    expect(localStorage.getItem('wasLoggedIn')).toBeNull();
  });

  it('rafraîchit le jeton et hydrate le profil absent', async () => {
    mocks.post.mockResolvedValueOnce({ data: { accessToken: 'fresh-token' } });
    mocks.get.mockResolvedValueOnce({ data: { id: 'user-1' } });
    await expect(useLexStore.getState().refreshAccessToken()).resolves.toBe('fresh-token');
    expect(mocks.get).toHaveBeenCalledWith('/auth/me');
    expect(useLexStore.getState()).toEqual(expect.objectContaining({ accessToken: 'fresh-token', currentUser: { id: 'user-1' }, isRefreshing: false }));
  });

  it('conserve le profil renvoyé par refresh et partage la requête concurrente', async () => {
    let resolveRefresh;
    mocks.post.mockReturnValueOnce(new Promise((resolve) => { resolveRefresh = resolve; }));
    const first = useLexStore.getState().refreshAccessToken();
    const second = useLexStore.getState().refreshAccessToken();
    expect(mocks.post).toHaveBeenCalledTimes(1);
    resolveRefresh({ data: { accessToken: 'fresh', user: { id: 'user-2' } } });
    await expect(first).resolves.toBe('fresh');
    await expect(second).resolves.toBe('fresh');
    expect(useLexStore.getState().currentUser).toEqual({ id: 'user-2' });
  });

  it('efface une session expirée mais conserve les données lors d’une panne réseau', async () => {
    useLexStore.setState({ currentUser: { id: 'user-1' }, accessToken: 'old' });
    mocks.post.mockRejectedValueOnce({ response: { status: 403 } });
    await expect(useLexStore.getState().refreshAccessToken()).rejects.toBeDefined();
    expect(useLexStore.getState().currentUser).toBeNull();
    expect(useLexStore.getState().accessToken).toBeNull();

    useLexStore.setState({ currentUser: { id: 'user-1' }, accessToken: 'old' });
    mocks.post.mockRejectedValueOnce(new Error('network'));
    await expect(useLexStore.getState().refreshAccessToken()).rejects.toBeDefined();
    expect(useLexStore.getState().currentUser).toEqual({ id: 'user-1' });
    expect(console.warn).toHaveBeenCalled();
  });

  it('initialise l’authentification et gère les réponses de l’assistant', async () => {
    mocks.post.mockResolvedValueOnce({ data: { accessToken: 'fresh', user: { id: 'user-1' } } });
    await useLexStore.getState().initAuth();
    expect(useLexStore.getState().isLoading).toBe(false);
    mocks.post.mockResolvedValueOnce({ data: { answer: 'Bonjour' } });
    await expect(useLexStore.getState().sendAiMessage('Question')).resolves.toEqual({ answer: 'Bonjour' });
    mocks.post.mockRejectedValueOnce(new Error('AI unavailable'));
    await expect(useLexStore.getState().sendAiMessage('Question')).resolves.toBeNull();
  });
});

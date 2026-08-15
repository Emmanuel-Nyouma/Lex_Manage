import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNotifications, useNotificationStore } from './useNotifications';

const mocks = vi.hoisted(() => ({
  get: vi.fn(), patch: vi.fn(), info: vi.fn(), error: vi.fn(),
  on: vi.fn(), off: vi.fn(), currentUser: { id: 'user-1' },
}));

vi.mock('../lib/api', () => ({ default: { get: mocks.get, patch: mocks.patch } }));
vi.mock('../store/useLexStore', () => ({ default: () => ({ currentUser: mocks.currentUser }) }));
vi.mock('./useSocket', () => ({ useSocket: () => ({ on: mocks.on, off: mocks.off }) }));
vi.mock('sonner', () => ({ toast: { info: mocks.info, error: mocks.error } }));

const important = { id: 'notification-1', level: 'IMPORTANT', motif: 'Audience', message: 'Tomorrow', readByIds: [] };

describe('notification state and realtime hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mocks.currentUser = { id: 'user-1' };
    useNotificationStore.getState().reset();
    mocks.get.mockResolvedValue({ data: [important] });
    mocks.patch.mockResolvedValue({ data: {} });
  });

  it('enrichit, limite et réinitialise les notifications', () => {
    const store = useNotificationStore.getState();
    store.setNotifications([important, { ...important, id: 'read', readByIds: ['user-1'] }], 'user-1');
    expect(useNotificationStore.getState().unreadCount).toBe(1);
    store.addNotification({ id: 'urgent', level: 'URGENT', readByIds: [] }, 'user-1');
    expect(useNotificationStore.getState().urgentNotification.id).toBe('urgent');
    store.clearUrgent();
    store.setInitialToastsShown(true, 'user-1');
    store.setError('offline');
    expect(useNotificationStore.getState()).toEqual(expect.objectContaining({ hasInitialToastsBeenShown: true, error: 'offline' }));
    store.reset();
    expect(useNotificationStore.getState()).toEqual(expect.objectContaining({ notifications: [], unreadCount: 0, error: null }));
  });

  it('marque une notification comme lue et signale un échec', async () => {
    useNotificationStore.getState().setNotifications([important], 'user-1');
    await useNotificationStore.getState().markAsRead('notification-1', 'user-1');
    expect(useNotificationStore.getState().unreadCount).toBe(0);
    mocks.patch.mockRejectedValueOnce(new Error('offline'));
    await useNotificationStore.getState().markAsRead('notification-1', 'user-1');
    expect(mocks.error).toHaveBeenCalled();
  });

  it('annule la lecture globale optimiste lorsque l’API échoue', async () => {
    useNotificationStore.getState().setNotifications([important], 'user-1');
    mocks.patch.mockRejectedValueOnce(new Error('offline'));
    await useNotificationStore.getState().markAllAsRead();
    expect(useNotificationStore.getState().unreadCount).toBe(1);
    expect(mocks.error).toHaveBeenCalled();
  });

  it('charge, affiche et écoute les notifications pertinentes', async () => {
    const { result, unmount } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.notifications).toHaveLength(1));
    expect(mocks.info).toHaveBeenCalledWith('Audience', expect.objectContaining({ description: 'Tomorrow' }));
    expect(sessionStorage.getItem('lex-toasts-shown-user-1')).toContain('notification-1');
    expect(mocks.on).toHaveBeenCalledWith('notification.new', expect.any(Function));

    const handler = mocks.on.mock.calls[0][1];
    act(() => handler({ id: 'ignored', level: 'NORMAL', recipientIds: ['other'], message: 'No' }));
    expect(result.current.notifications).toHaveLength(1);
    act(() => handler({ id: 'new', level: 'NORMAL', title: 'Update', recipientIds: ['user-1'], message: 'Yes' }));
    expect(result.current.notifications[0].id).toBe('new');
    expect(mocks.info).toHaveBeenCalledWith('Update', { description: 'Yes' });

    unmount();
    expect(mocks.off).toHaveBeenCalledWith('notification.new', handler);
  });

  it('expose une erreur de chargement et permet de réessayer', async () => {
    mocks.get.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ data: [] });
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.error).toContain('indisponibles'));
    await act(() => result.current.retry());
    await waitFor(() => expect(result.current.error).toBeNull());
  });
});

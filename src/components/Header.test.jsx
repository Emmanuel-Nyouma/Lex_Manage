import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Header from './Header';

const mocks = vi.hoisted(() => ({
  get: vi.fn(), navigate: vi.fn(), openAi: vi.fn(), toggleSidebar: vi.fn(), setSearchOpen: vi.fn(),
  markRead: vi.fn(), markAll: vi.fn(), retry: vi.fn(),
}));

const t = {
  open_menu: 'Open menu', search_placeholder: 'Search everything', search_short: 'Search',
  notifications: 'Notifications', unread_new: 'new', mark_all_read: 'Mark all read', close: 'Close',
  no_notifications: 'No notifications',
};

vi.mock('../store/useLexStore', () => ({ default: () => ({ currentUser: { firstName: 'Ada', lastName: 'Njou' } }) }));
vi.mock('../hooks/useTranslation', () => ({ default: () => ({ t, language: 'en' }) }));
vi.mock('../lib/api', () => ({ default: { get: mocks.get } }));
vi.mock('../lib/router', () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
}));
vi.mock('./search/SearchPalette', () => ({
  SearchPalette: ({ isOpen, onClose }) => isOpen ? <button onClick={onClose}>Close palette</button> : null,
}));

const suggestions = {
  cases: [{ id: 'case-1', title: 'Alpha case', clientName: 'Acme' }],
  documents: [{ id: 'doc-1', title: 'Contract', file_name: 'contract.pdf' }],
  members: [{ id: 'member-1', firstName: 'Ada', lastName: 'Member', role: 'CABINET_ADMIN' }],
  clients: [{ id: 'client-1', name: 'Client One', email: 'client@example.com' }],
};

const renderHeader = (overrides = {}) => render(
  <Header
    onOpenAi={mocks.openAi}
    onToggleMobileSidebar={mocks.toggleSidebar}
    isSearchOpen={false}
    setIsSearchOpen={mocks.setSearchOpen}
    notificationsApi={{
      notifications: [], unreadCount: 0, markAsRead: mocks.markRead,
      markAllAsRead: mocks.markAll, error: null, retry: mocks.retry,
      ...overrides,
    }}
  />,
);

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mocks.get.mockResolvedValue({ data: suggestions });
  });

  afterEach(() => vi.useRealTimers());

  it('ouvre les commandes globales et le profil', () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Search everything' }));
    fireEvent.click(screen.getByRole('button', { name: 'LexAssist AI' }));
    expect(mocks.toggleSidebar).toHaveBeenCalledOnce();
    expect(mocks.setSearchOpen).toHaveBeenCalledWith(true);
    expect(mocks.openAi).toHaveBeenCalledOnce();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/profile');
  });

  it.each([
    ['Alpha case', '/cases/case-1'],
    ['Contract', '/documents'],
    ['Ada Member', '/company-settings'],
    ['Client One', '/clients/client-1'],
  ])('navigue depuis la suggestion %s', async (label, destination) => {
    renderHeader();
    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'al' } });
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    fireEvent.mouseDown(screen.getByRole('button', { name: new RegExp(label) }));
    expect(mocks.navigate).toHaveBeenCalledWith(destination);
  });

  it('efface, étend et ferme la recherche au clavier', async () => {
    renderHeader();
    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'al' } });
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mocks.setSearchOpen).toHaveBeenCalledWith(true);
    fireEvent.change(input, { target: { value: 'new' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).toHaveValue('');
  });

  it('affiche un état vide quand la recherche échoue', async () => {
    mocks.get.mockRejectedValue(new Error('offline'));
    renderHeader();
    fireEvent.change(screen.getByPlaceholderText('Search'), { target: { value: 'zz' } });
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    expect(screen.getByText('Aucun résultat pour «zz»')).toBeInTheDocument();
  });

  it('marque les notifications et ouvre leur détail', async () => {
    const notifications = [
      { id: 'n1', level: 'URGENT', motif: 'HEARING', title: 'Court today', message: 'Attend court', createdAt: '2026-08-15', isRead: false },
      { id: 'n2', level: 'UNKNOWN', motif: 'OTHER', message: '', createdAt: '2026-08-14', isRead: true },
    ];
    renderHeader({ notifications, unreadCount: 12 });
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.getByText('9+')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mark all read' }));
    expect(mocks.markAll).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Marquer comme lue : Court today' }));
    expect(mocks.markRead).toHaveBeenCalledWith('n1');

    fireEvent.click(screen.getByText('Court today'));
    expect(screen.getByRole('dialog')).toHaveTextContent('Attend court');
    fireEvent.click(screen.getAllByRole('button', { name: 'Close' }).at(-1));
  });

  it('présente les erreurs et l’état vide du centre de notifications', () => {
    const { rerender } = renderHeader({ error: 'Notifications unavailable' });
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Notifications unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(mocks.retry).toHaveBeenCalledOnce();

    rerender(
      <Header onOpenAi={mocks.openAi} onToggleMobileSidebar={mocks.toggleSidebar} isSearchOpen={false} setIsSearchOpen={mocks.setSearchOpen}
        notificationsApi={{ notifications: [], unreadCount: 0, markAsRead: mocks.markRead, markAllAsRead: mocks.markAll, error: null, retry: mocks.retry }} />,
    );
    expect(screen.getByText('No notifications')).toBeInTheDocument();
  });
});

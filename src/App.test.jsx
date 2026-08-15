import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LexManageApp from './App';
import { BrowserRouter } from './lib/router';

const mocks = vi.hoisted(() => ({
  store: {
    accessToken: null, isLoading: false, currentUser: null,
    initAuth: vi.fn(), logout: vi.fn(),
  },
  notifications: { socket: null, urgentNotification: null, clearUrgent: vi.fn() },
  idle: false,
  invalidateQueries: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('./store/useLexStore', () => {
  const hook = () => mocks.store;
  hook.getState = () => mocks.store;
  return { default: hook };
});
vi.mock('./hooks/useIdleTimeout', () => ({ useIdleTimeout: () => ({ isIdle: mocks.idle }) }));
vi.mock('./hooks/useNotifications', () => ({ useNotifications: () => mocks.notifications }));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));
vi.mock('sonner', () => ({
  Toaster: () => <div data-testid="toaster" />,
  toast: { success: mocks.toastSuccess },
}));
vi.mock('lucide-react', () => ({
  ShieldCheck: () => <span>shield</span>,
  X: () => <span>x</span>,
}));

vi.mock('./components/AuthScreen', () => ({ default: () => <div>Auth screen</div> }));
vi.mock('./components/OnboardingScreen', () => ({
  default: () => <div>Welcome screen</div>,
  ONBOARDING_STORAGE_KEY: 'lexmanage:onboarding-completed',
}));
vi.mock('./components/Sidebar', () => ({
  default: ({ isMobileOpen, onCloseMobile }) => (
    <div data-testid="sidebar" data-open={String(isMobileOpen)}>
      <button onClick={onCloseMobile}>close sidebar</button>
    </div>
  ),
}));
vi.mock('./components/Header', () => ({
  default: ({ onOpenAi, onToggleMobileSidebar, isSearchOpen, setIsSearchOpen }) => (
    <div data-testid="header" data-search={String(isSearchOpen)}>
      <button onClick={onOpenAi}>open ai</button>
      <button onClick={onToggleMobileSidebar}>toggle sidebar</button>
      <button onClick={() => setIsSearchOpen(false)}>close search</button>
    </div>
  ),
}));
vi.mock('./components/ui', () => ({
  Breadcrumbs: () => <div>breadcrumbs</div>,
  FocusTrap: ({ children }) => <>{children}</>,
  PageSkeleton: () => <div>route loading</div>,
}));

const view = (name) => ({ default: () => <div>{name}</div> });
vi.mock('./components/DashboardView', () => view('Dashboard view'));
vi.mock('./components/CaseManagementView', () => view('Cases view'));
vi.mock('./components/CalendarView', () => view('Calendar view'));
vi.mock('./components/DocumentsView', () => view('Documents view'));
vi.mock('./components/ClientsDirectoryView', () => view('Clients view'));
vi.mock('./components/ClientDetailView', () => view('Client detail view'));
vi.mock('./components/CompanySettingsView', () => view('Company settings view'));
vi.mock('./components/NotificationCenterView', () => view('Notification center view'));
vi.mock('./components/ProfileView', () => view('Profile view'));
vi.mock('./components/SettingsView', () => view('Settings view'));
vi.mock('./components/AiAssistantView', () => view('AI view'));
vi.mock('./components/ColleaguesView', () => view('Colleagues view'));

const renderAt = (path) => {
  window.history.replaceState(null, '', path);
  return render(<BrowserRouter><LexManageApp /></BrowserRouter>);
};

describe('LexManageApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.store = {
      accessToken: null, isLoading: false, currentUser: null,
      initAuth: vi.fn(), logout: vi.fn(),
    };
    mocks.notifications = { socket: null, urgentNotification: null, clearUrgent: vi.fn() };
    mocks.idle = false;
  });

  it('affiche le chargement global pendant le bootstrap de session', () => {
    mocks.store.isLoading = true;
    renderAt('/');
    expect(screen.getByText('Chargement de LexManage...')).toBeInTheDocument();
    expect(mocks.store.initAuth).toHaveBeenCalledTimes(1);
  });

  it('dirige un nouveau visiteur vers l’onboarding et un visiteur connu vers le login', async () => {
    const first = renderAt('/');
    expect(await screen.findByText('Welcome screen')).toBeInTheDocument();
    first.unmount();

    localStorage.setItem('lexmanage:onboarding-completed', 'true');
    renderAt('/');
    expect(await screen.findByText('Auth screen')).toBeInTheDocument();
  });

  it('protège les routes privées et redirige vers le login', async () => {
    renderAt('/dashboard');
    expect(await screen.findByText('Auth screen')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  });

  it('redirige un utilisateur authentifié du login vers le dashboard', async () => {
    mocks.store.accessToken = 'token';
    mocks.store.currentUser = { id: 'user-1', role: 'LAWYER' };
    renderAt('/login');
    expect(await screen.findByText('Dashboard view')).toBeInTheDocument();
    expect(screen.getByText('breadcrumbs')).toBeInTheDocument();
  });

  it('interdit les paramètres cabinet aux non-administrateurs', async () => {
    mocks.store.accessToken = 'token';
    mocks.store.currentUser = { id: 'user-1', role: 'LAWYER' };
    renderAt('/company-settings');
    expect(await screen.findByText('Dashboard view')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/dashboard');
  });

  it('autorise un administrateur et gère navigation, recherche et sidebar', async () => {
    mocks.store.accessToken = 'token';
    mocks.store.currentUser = { id: 'admin-1', role: 'CABINET_ADMIN' };
    renderAt('/company-settings');
    expect(await screen.findByText('Company settings view')).toBeInTheDocument();

    fireEvent.click(screen.getByText('toggle sidebar'));
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-open', 'true');
    fireEvent.click(screen.getByText('close sidebar'));
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-open', 'false');

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(screen.getByTestId('header')).toHaveAttribute('data-search', 'true');
    fireEvent.click(screen.getByText('open ai'));
    expect(await screen.findByText('AI view')).toBeInTheDocument();
  });

  it('synchronise login et logout entre onglets', async () => {
    mocks.store.accessToken = 'token';
    mocks.store.currentUser = { id: 'user-1', role: 'LAWYER' };
    renderAt('/dashboard');
    await screen.findByText('Dashboard view');
    mocks.store.initAuth.mockClear();

    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'wasLoggedIn', newValue: null })));
    expect(mocks.store.logout).toHaveBeenCalledTimes(1);
    mocks.store.accessToken = null;
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'wasLoggedIn', newValue: 'true' })));
    expect(mocks.store.initAuth).toHaveBeenCalledTimes(1);
  });

  it('déconnecte une session inactive', async () => {
    mocks.store.accessToken = 'token';
    mocks.store.currentUser = { id: 'user-1', role: 'LAWYER' };
    mocks.idle = true;
    renderAt('/dashboard');
    await waitFor(() => expect(mocks.store.logout).toHaveBeenCalled());
  });

  it('écoute la création temps réel d’un dossier et nettoie le listener', async () => {
    const handlers = {};
    const socket = {
      on: vi.fn((event, handler) => { handlers[event] = handler; }),
      off: vi.fn(),
    };
    mocks.notifications.socket = socket;
    mocks.store.accessToken = 'token';
    mocks.store.currentUser = { id: 'user-1', role: 'LAWYER' };
    const rendered = renderAt('/dashboard');
    await screen.findByText('Dashboard view');
    expect(socket.on).toHaveBeenCalledWith('case.created', expect.any(Function));
    act(() => handlers['case.created']({ title: 'Dossier Alpha' }));
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Nouveau dossier créé: Dossier Alpha');
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cases'] });
    rendered.unmount();
    expect(socket.off).toHaveBeenCalledWith('case.created', handlers['case.created']);
  });

  it('affiche et ferme une alerte urgente accessible', async () => {
    mocks.notifications.urgentNotification = { title: 'Audience', message: 'Demain à 8h' };
    mocks.store.accessToken = 'token';
    mocks.store.currentUser = { id: 'user-1', role: 'LAWYER' };
    renderAt('/dashboard');
    expect(await screen.findByRole('alertdialog')).toHaveTextContent('Audience');
    fireEvent.click(screen.getByRole('button', { name: 'Fermer l’alerte urgente' }));
    expect(mocks.notifications.clearUrgent).toHaveBeenCalledTimes(1);
  });
});

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AlertCircle } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import { PdfPreviewModal } from './PdfPreviewModal';
import NetworkStatusBanner from './NetworkStatusBanner';
import SettingsView from './SettingsView';
import Sidebar from './Sidebar';
import EmptyState from './EmptyState';
import ErrorHandler from './ErrorHandler';
import GlobalErrorBoundary from './GlobalErrorBoundary';

const mocks = vi.hoisted(() => ({
  network: { status: 'online', rtt: null }, setLanguage: vi.fn(), setTheme: vi.fn(),
  logout: vi.fn(), close: vi.fn(), setError: vi.fn(), capture: vi.fn(),
  language: 'en', theme: 'light', role: 'CABINET_ADMIN',
}));

vi.mock('../hooks/useNetworkStatus', () => ({ default: () => mocks.network }));
vi.mock('../hooks/useKeyboardNavigation', () => ({ useKeyboardNavigation: vi.fn() }));
vi.mock('../hooks/useTranslation', () => ({ default: () => ({ t: { dashboard: 'Dashboard', clients: 'Clients', colleagues_nav: 'Colleagues', cases: 'Cases', calendar: 'Calendar', documents: 'Documents', firm_management: 'Firm management', notifications: 'Notifications', settings: 'Settings', close: 'Close', logout: 'Logout' } }) }));
vi.mock('../lib/router', () => ({
  NavLink: ({ children, className, onClick, to }) => <a href={to} onClick={onClick} className={typeof className === 'function' ? className({ isActive: to === '/dashboard' }) : className}>{children}</a>,
}));
vi.mock('../store/useLexStore', () => ({
  default: (selector) => {
    const state = {
      language: mocks.language, theme: mocks.theme, setLanguage: mocks.setLanguage, setTheme: mocks.setTheme,
      logout: mocks.logout, setError: mocks.setError,
      currentUser: { id: 'user-1', firstName: 'Alice', lastName: 'Admin', role: mocks.role },
    };
    return selector ? selector(state) : state;
  },
}));
vi.mock('../lib/errorTracking', () => ({ captureFrontendError: mocks.capture }));

describe('feedback and navigation components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.network = { status: 'online', rtt: null };
    mocks.language = 'en';
    mocks.theme = 'light';
    mocks.role = 'CABINET_ADMIN';
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('confirme, annule et ferme au clavier une action destructive', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { rerender } = render(<ConfirmDialog isOpen={false} onConfirm={onConfirm} onCancel={onCancel} />);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    rerender(<ConfirmDialog isOpen title="Delete client?" description="Permanent action" destructiveText="Delete now" cancelText="Keep" onConfirm={onConfirm} onCancel={onCancel} />);
    expect(screen.getByRole('alertdialog')).toHaveAccessibleDescription('Permanent action');
    fireEvent.click(screen.getByRole('button', { name: 'Keep' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete now' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('prévisualise, zoome, imprime, télécharge et ferme un PDF', () => {
    const onClose = vi.fn();
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    const { container } = render(<PdfPreviewModal isOpen onClose={onClose} fileUrl="https://files.example/doc.pdf" fileName="contract.pdf" />);
    expect(screen.getByRole('dialog', { name: 'contract.pdf' })).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Zoom In'));
    expect(screen.getByText('110%')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Zoom Out'));
    fireEvent.click(screen.getByTitle('Print'));
    expect(print).toHaveBeenCalledOnce();
    expect(screen.getByTitle('Download')).toHaveAttribute('download', 'contract.pdf');
    fireEvent.click(screen.getByRole('button', { name: 'Close preview' }));
    fireEvent.click(container.firstChild);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('distingue les états réseau online, offline et lent', () => {
    const { rerender } = render(<NetworkStatusBanner language="en" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    mocks.network = { status: 'offline', rtt: null };
    rerender(<NetworkStatusBanner language="en" />);
    expect(screen.getByRole('status')).toHaveTextContent('No internet connection');
    mocks.network = { status: 'slow', rtt: 1400 };
    rerender(<NetworkStatusBanner language="fr" />);
    expect(screen.getByRole('status')).toHaveTextContent('Connexion internet faible');
    expect(screen.getByText('1400 ms')).toBeInTheDocument();
  });

  it('modifie les préférences de langue et de thème', () => {
    render(<SettingsView />);
    fireEvent.click(screen.getByRole('button', { name: /Français/ }));
    fireEvent.click(screen.getByRole('button', { name: /dark/i }));
    expect(mocks.setLanguage).toHaveBeenCalledWith('fr');
    expect(mocks.setTheme).toHaveBeenCalledWith('dark');
  });

  it('affiche la navigation administrative et ferme le menu mobile', () => {
    render(<Sidebar isMobileOpen onCloseMobile={mocks.close} />);
    expect(screen.getByText('Firm management')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Clients'));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(mocks.close).toHaveBeenCalledTimes(2);
    expect(mocks.logout).toHaveBeenCalledOnce();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('rend un état vide avec ou sans action', () => {
    const { rerender } = render(<EmptyState icon={AlertCircle} title="No records" description="Create the first one" action={<button>Create</button>} />);
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    rerender(<EmptyState title="Still empty" description="Nothing here" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('présente et ferme les erreurs applicatives', () => {
    render(<ErrorHandler error={{ response: { status: 403 }, stack: 'trace' }} />);
    expect(screen.getByText('Access denied')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /show technical details/i }));
    expect(screen.getByText('trace')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close error message' }));
    expect(mocks.setError).toHaveBeenCalledWith(null);
  });

  it('capture une erreur React et propose le rechargement', () => {
    const Broken = () => { throw new Error('Render exploded'); };
    render(<GlobalErrorBoundary><Broken /></GlobalErrorBoundary>);
    expect(screen.getByRole('heading', { name: 'Error' })).toBeInTheDocument();
    expect(mocks.capture).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ source: 'global-error-boundary' }));
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});

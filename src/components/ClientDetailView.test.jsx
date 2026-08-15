import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ClientDetailView from './ClientDetailView';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  query: { data: null, isLoading: false, error: null },
  signedUrl: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('../lib/router', () => ({
  useParams: () => ({ id: 'client-1' }),
  useNavigate: () => mocks.navigate,
}));
vi.mock('../hooks/useClients', () => ({ useClient: () => mocks.query }));
vi.mock('../lib/documentService', () => ({ getDocumentSignedUrl: mocks.signedUrl }));
vi.mock('sonner', () => ({ toast: { error: mocks.toastError } }));

const client = {
  id: 'client-1', name: 'Acme SARL', type_client: 'morale', createdAt: '2026-01-01T00:00:00Z',
  email: 'contact@acme.test', phone: '+237600000000', address: 'Douala',
  cases: [{
    id: 'case-1', title: 'Litige commercial', status: 'OPEN', createdAt: '2026-02-01T00:00:00Z',
    assignee: { firstName: 'Alice', lastName: 'Admin' }, _count: { documents: 1 },
    documents: [{ id: 'doc-1', title: 'Contrat', file_name: 'contrat.pdf' }],
  }],
};

describe('ClientDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.query = { data: client, isLoading: false, error: null };
    mocks.signedUrl.mockResolvedValue('https://signed.test/doc');
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('affiche le squelette pendant le chargement', () => {
    mocks.query = { data: null, isLoading: true, error: null };
    const { container } = render(<ClientDetailView />);
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });

  it('affiche l’erreur et retourne à l’annuaire', async () => {
    mocks.query = { data: null, isLoading: false, error: new Error('404') };
    const user = userEvent.setup();
    render(<ClientDetailView />);
    expect(screen.getByRole('heading', { name: 'Client not found' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to Directory' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/clients');
  });

  it('présente le profil 360°, les statistiques et ouvre un dossier', async () => {
    const user = userEvent.setup();
    render(<ClientDetailView />);
    expect(screen.getAllByText('Acme SARL').length).toBeGreaterThan(0);
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('contact@acme.test')).toBeInTheDocument();
    expect(screen.getByText('1 Records')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ouvrir le dossier Litige commercial' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/cases');
    fireEvent.keyDown(screen.getByRole('button', { name: 'Ouvrir le dossier Litige commercial' }), { key: 'Enter' });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Ouvrir le dossier Litige commercial' }), { key: ' ' });
    expect(mocks.navigate).toHaveBeenCalledTimes(3);
  });

  it('revient à l’annuaire depuis la flèche du header', () => {
    const { container } = render(<ClientDetailView />);
    fireEvent.click(container.querySelector('button'));
    expect(mocks.navigate).toHaveBeenCalledWith('/clients');
  });

  it('agrège les documents, ouvre et télécharge un lien signé', async () => {
    const user = userEvent.setup();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<ClientDetailView />);
    await user.click(screen.getByRole('button', { name: /DOCUMENTS/ }));
    expect(screen.getByText('1 Files')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ouvrir Contrat' }));
    await waitFor(() => expect(window.open).toHaveBeenCalledWith(
      'https://signed.test/doc', '_blank', 'noopener,noreferrer',
    ));
    await user.click(screen.getByRole('button', { name: 'Télécharger Contrat' }));
    await waitFor(() => expect(click).toHaveBeenCalledOnce());
  });

  it('signale l’impossibilité de signer un document', async () => {
    mocks.signedUrl.mockResolvedValue(null);
    const user = userEvent.setup();
    render(<ClientDetailView />);
    await user.click(screen.getByRole('button', { name: /DOCUMENTS/ }));
    await user.click(screen.getByRole('button', { name: 'Ouvrir Contrat' }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith(
      'Impossible de générer le lien sécurisé.',
    ));
    expect(window.open).not.toHaveBeenCalled();
  });

  it('affiche les onglets audiences et facturation sans données fictives', async () => {
    const user = userEvent.setup();
    render(<ClientDetailView />);
    await user.click(screen.getByRole('button', { name: /HEARINGS/ }));
    expect(screen.getByRole('heading', { name: 'Audiences' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /BILLING/ }));
    expect(screen.getByRole('heading', { name: 'Facturation' })).toBeInTheDocument();
  });

  it('gère un client individuel sans coordonnées, dossiers ni documents', async () => {
    mocks.query = {
      data: { id: 'c2', name: 'Jean Client', type_client: 'physique', createdAt: '2026-01-01', cases: [] },
      isLoading: false, error: null,
    };
    const user = userEvent.setup();
    render(<ClientDetailView />);
    expect(screen.getByText('Individual')).toBeInTheDocument();
    expect(screen.getAllByText('Not provided')).toHaveLength(3);
    expect(screen.getByText('No cases recorded for this client yet.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /DOCUMENTS/ }));
    expect(screen.getByText('No documents found for this client across any cases.')).toBeInTheDocument();
  });

  it('ignore les dossiers dont la liste de documents est absente', async () => {
    mocks.query = { data: { ...client, cases: [{ ...client.cases[0], documents: undefined }] }, isLoading: false, error: null };
    const user = userEvent.setup();
    render(<ClientDetailView />);
    await user.click(screen.getByRole('button', { name: /DOCUMENTS/ }));
    expect(screen.getByText('0 Files')).toBeInTheDocument();
  });
});

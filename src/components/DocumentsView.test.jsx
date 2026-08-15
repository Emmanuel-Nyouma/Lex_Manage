import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DocumentsView from './DocumentsView';

const mocks = vi.hoisted(() => ({
  role: 'CABINET_ADMIN',
  documentsResult: {},
  deleteMutate: vi.fn(),
  ingestMutate: vi.fn(),
  ingestPending: false,
  ingestVariables: null,
  signedUrl: vi.fn(),
  refetch: vi.fn(),
  fetchNextPage: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('../store/useLexStore', () => ({ default: () => ({ currentUser: { role: mocks.role } }) }));
vi.mock('../hooks/useDocuments', () => ({
  useDocuments: () => mocks.documentsResult,
  useDeleteDocument: () => ({ mutate: mocks.deleteMutate }),
}));
vi.mock('../hooks/useDmsCategories', () => ({
  useDmsCategories: () => [
    { id: 'CONTRAT', label: 'Contrats' },
    { id: 'PREUVE', label: 'Preuves' },
    { id: 'Autre', label: 'Autre' },
  ],
}));
vi.mock('../hooks/useIngestToLexAssist', () => ({
  useIngestToLexAssist: () => ({
    mutate: mocks.ingestMutate,
    isPending: mocks.ingestPending,
    variables: mocks.ingestVariables,
  }),
}));
vi.mock('../lib/documentService', () => ({ getDocumentSignedUrl: (...args) => mocks.signedUrl(...args) }));
vi.mock('sonner', () => ({ toast: { error: mocks.toastError } }));
vi.mock('./DocumentUpload', () => ({
  default: ({ onUploadSuccess }) => <button onClick={onUploadSuccess}>Finish upload</button>,
}));
vi.mock('./ConfirmDialog', () => ({
  default: ({ isOpen, onConfirm, onCancel, description }) => isOpen ? (
    <div><span>{description}</span><button onClick={onConfirm}>Confirm delete</button><button onClick={onCancel}>Cancel delete</button></div>
  ) : null,
}));

const documents = [
  { id: 'doc-1', title: 'Client contract', file_name: 'contract.pdf', category: 'CONTRAT', file_type: 'application/pdf', file_size: 1048576, createdAt: '2026-08-01' },
  { id: 'doc-2', file_name: 'photo.png', category: 'UNKNOWN', file_type: null, file_size: 2048, createdAt: '2026-08-02' },
];

describe('DocumentsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.role = 'CABINET_ADMIN';
    mocks.ingestPending = false;
    mocks.ingestVariables = null;
    mocks.signedUrl.mockResolvedValue('https://files.example/doc');
    mocks.documentsResult = {
      data: { documents }, isLoading: false, error: null,
      refetch: mocks.refetch, fetchNextPage: mocks.fetchNextPage,
      hasNextPage: true, isFetchingNextPage: false,
    };
    vi.stubGlobal('open', vi.fn());
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('affiche les états chargement et erreur avec relance', () => {
    mocks.documentsResult = { ...mocks.documentsResult, isLoading: true, data: { documents: [] } };
    const { container, rerender } = render(<DocumentsView />);
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3);

    mocks.documentsResult = { ...mocks.documentsResult, isLoading: false, error: new Error('Storage unavailable') };
    rerender(<DocumentsView />);
    expect(screen.getByText('Storage unavailable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });

  it('importe, filtre, recherche et pagine les documents', () => {
    vi.useFakeTimers();
    render(<DocumentsView />);
    fireEvent.click(screen.getByRole('button', { name: 'Importer des documents' }));
    fireEvent.click(screen.getByRole('button', { name: 'Finish upload' }));
    expect(mocks.refetch).toHaveBeenCalledOnce();

    const search = screen.getByPlaceholderText('Rechercher un document dans cette page...');
    fireEvent.change(search, { target: { value: 'Client' } });
    expect(screen.getByText('Résultats sur cette page')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Client contract/ }));
    act(() => vi.advanceTimersByTime(100));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(300));

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'CONTRAT' } });
    expect(screen.getByText('CONTRATS')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Charger plus' }));
    expect(mocks.fetchNextPage).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('ouvre, télécharge, indexe et supprime un document', async () => {
    render(<DocumentsView />);
    fireEvent.click(screen.getByRole('button', { name: /CONTRATS/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Importer dans LexAssist AI' }));
    expect(mocks.ingestMutate).toHaveBeenCalledWith('doc-1');

    fireEvent.click(screen.getByRole('button', { name: 'Voir document' }));
    await act(async () => {});
    expect(window.open).toHaveBeenCalledWith('https://files.example/doc', '_blank');

    fireEvent.click(screen.getByRole('button', { name: 'Télécharger document' }));
    await act(async () => {});
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer document' }));
    expect(screen.getAllByText(/Client contract/).length).toBeGreaterThan(1);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));
    expect(mocks.deleteMutate).toHaveBeenCalledWith('doc-1');
  });

  it('masque les actions privilégiées pour un utilisateur en lecture seule', () => {
    mocks.role = 'PARALEGAL';
    render(<DocumentsView />);
    expect(screen.queryByRole('button', { name: 'Importer des documents' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /CONTRATS/ }));
    expect(screen.queryByRole('button', { name: 'Supprimer document' })).not.toBeInTheDocument();
  });

  it('signale un échec de génération du lien sécurisé', async () => {
    mocks.signedUrl.mockResolvedValue(null);
    render(<DocumentsView />);
    fireEvent.click(screen.getByRole('button', { name: /CONTRATS/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Voir document' }));
    await act(async () => {});
    expect(mocks.toastError).toHaveBeenCalledWith('Generating secure link failed');
  });
});

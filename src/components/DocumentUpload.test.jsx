import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DocumentUpload from './DocumentUpload';

const mocks = vi.hoisted(() => ({
  user: { id: 'user-1', role: 'CABINET_ADMIN' },
  dropOptions: null,
  dragActive: false,
  upload: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  categories: [
    { id: 'general', label: 'Général', subCategories: [] },
    { id: 'clients', label: 'Clients', subCategories: [{ id: 'contracts', label: 'Contrats' }] },
  ],
}));

vi.mock('react-dropzone', () => ({
  useDropzone: (options) => {
    mocks.dropOptions = options;
    return {
      getRootProps: () => ({ role: 'button', 'aria-label': 'Zone de téléversement' }),
      getInputProps: () => ({ 'data-testid': 'file-input' }),
      isDragActive: mocks.dragActive,
    };
  },
}));
vi.mock('../lib/documentService', () => ({ uploadLegalDocument: mocks.upload }));
vi.mock('../store/useLexStore', () => ({ default: () => ({ currentUser: mocks.user }) }));
vi.mock('../hooks/useDmsCategories', () => ({ useDmsCategories: () => mocks.categories }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }));

describe('DocumentUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = { id: 'user-1', role: 'CABINET_ADMIN' };
    mocks.dragActive = false;
    mocks.upload.mockResolvedValue({ id: 'doc-1' });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('configure Dropzone avec les formats et la limite de 50 Mo', () => {
    render(<DocumentUpload />);
    expect(mocks.dropOptions.accept).toEqual(expect.objectContaining({
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    }));
    expect(mocks.dropOptions.maxSize).toBe(50 * 1024 * 1024);
    expect(mocks.dropOptions.multiple).toBe(true);
    expect(screen.getByText('Cliquez ou glissez vos documents ici')).toBeInTheDocument();
  });

  it('affiche l’état de glisser actif', () => {
    mocks.dragActive = true;
    render(<DocumentUpload />);
    expect(screen.getByText('Déposez pour importer')).toBeInTheDocument();
  });

  it('cache le contrôle des rôles aux non-administrateurs', () => {
    mocks.user = { id: 'user-2', role: 'LAWYER' };
    render(<DocumentUpload />);
    expect(screen.queryByText("Contrôle d'Accès")).not.toBeInTheDocument();
  });

  it('sélectionne catégorie, sous-catégorie et rôles avant l’envoi', async () => {
    const user = userEvent.setup();
    render(<DocumentUpload />);
    await user.selectOptions(screen.getByLabelText('Catégorie principale'), 'clients');
    await user.click(screen.getByRole('button', { name: 'Contrats' }));
    await user.click(screen.getByRole('button', { name: 'Partners / Avocats' }));
    await user.click(screen.getByRole('button', { name: 'Associates / Assistants' }));
    const file = new File(['pdf'], 'contrat.pdf', { type: 'application/pdf' });

    await act(async () => mocks.dropOptions.onDrop([file]));

    expect(mocks.upload).toHaveBeenCalledWith(file, mocks.user, {
      category: 'clients', subCategory: 'contracts', allowedRoles: ['LAWYER', 'ASSISTANT'],
    });
  });

  it('revient à Tout le monde lorsqu’on retire le dernier rôle ou clique ALL', async () => {
    const user = userEvent.setup();
    render(<DocumentUpload />);
    await user.click(screen.getByRole('button', { name: 'Partners / Avocats' }));
    await user.click(screen.getByRole('button', { name: 'Partners / Avocats' }));
    await user.click(screen.getByRole('button', { name: 'Cabinet Admin' }));
    await user.click(screen.getByRole('button', { name: 'Tout le monde' }));
    const file = new File(['x'], 'public.txt', { type: 'text/plain' });
    await act(async () => mocks.dropOptions.onDrop([file]));
    expect(mocks.upload).toHaveBeenCalledWith(file, mocks.user, expect.objectContaining({ allowedRoles: [] }));
  });

  it('ignore une liste vide et respecte le refus de téléverser un doublon', async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    render(<DocumentUpload existingDocuments={[{ file_name: 'same.pdf' }]} />);
    await act(async () => mocks.dropOptions.onDrop([]));
    await act(async () => mocks.dropOptions.onDrop([
      new File(['x'], 'same.pdf', { type: 'application/pdf' }),
    ]));
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('same.pdf'));
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it('détecte aussi un doublon par titre et poursuit après confirmation', async () => {
    render(<DocumentUpload existingDocuments={[{ title: 'same.pdf' }]} />);
    const file = new File(['x'], 'same.pdf', { type: 'application/pdf' });
    await act(async () => mocks.dropOptions.onDrop([file]));
    expect(mocks.upload).toHaveBeenCalledOnce();
  });

  it('téléverse les fichiers en série, affiche la progression et appelle le callback', async () => {
    let resolveFirst;
    mocks.upload.mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValueOnce({ id: 'doc-2' });
    const onUploadSuccess = vi.fn();
    render(<DocumentUpload onUploadSuccess={onUploadSuccess} />);
    const files = [
      new File(['a'], 'a.pdf', { type: 'application/pdf' }),
      new File(['b'], 'b.pdf', { type: 'application/pdf' }),
    ];
    let operation;
    act(() => { operation = mocks.dropOptions.onDrop(files); });
    expect(await screen.findByText('a.pdf')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(mocks.dropOptions.disabled).toBe(true);
    await act(async () => { resolveFirst({ id: 'doc-1' }); await operation; });

    expect(mocks.upload).toHaveBeenCalledTimes(2);
    expect(mocks.success).toHaveBeenCalledWith('Documents importés et analysés avec succès');
    expect(onUploadSuccess).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByText('a.pdf')).not.toBeInTheDocument());
  });

  it('affiche une erreur, nettoie la progression et ne déclenche pas le callback', async () => {
    mocks.upload.mockRejectedValue(new Error('offline'));
    const onUploadSuccess = vi.fn();
    render(<DocumentUpload onUploadSuccess={onUploadSuccess} />);
    await act(async () => mocks.dropOptions.onDrop([
      new File(['x'], 'failed.pdf', { type: 'application/pdf' }),
    ]));
    expect(mocks.error).toHaveBeenCalledWith('Échec du traitement des documents');
    expect(onUploadSuccess).not.toHaveBeenCalled();
    expect(screen.queryByText('failed.pdf')).not.toBeInTheDocument();
  });
});

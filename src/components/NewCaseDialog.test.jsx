import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NewCaseDialog from './NewCaseDialog';

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(), upload: vi.fn(), close: vi.fn(), success: vi.fn(), error: vi.fn(),
  clients: [], loadingClients: false,
}));
vi.mock('../hooks/useCases', () => ({ useCreateCase: () => ({ mutateAsync: mocks.mutate, isPending: false }) }));
vi.mock('../hooks/useClients', () => ({ useClients: () => ({ data: mocks.clients, isLoading: mocks.loadingClients }) }));
vi.mock('../lib/documentService', () => ({ uploadLegalDocument: (...args) => mocks.upload(...args) }));
vi.mock('../store/useLexStore', () => ({ default: () => ({ currentUser: { id: 'user-1' } }) }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }));
vi.mock('../hooks/useKeyboardNavigation', () => ({ useKeyboardNavigation: vi.fn() }));
vi.mock('react-dropzone', () => ({
  useDropzone: ({ onDrop }) => ({
    getRootProps: () => ({ 'data-testid': 'dropzone', onClick: () => onDrop([
      new File(['one'], 'one.pdf', { type: 'application/pdf' }),
      new File(['two'], 'two.pdf', { type: 'application/pdf' }),
    ]) }),
    getInputProps: () => ({}),
    isDragActive: false,
  }),
}));

describe('NewCaseDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.clients = [{ id: '11111111-1111-4111-8111-111111111111', name: 'Acme Corp', email: 'acme@example.com', type_client: 'COMPANY' }];
    mocks.loadingClients = false;
    mocks.mutate.mockResolvedValue({ id: 'case-1' });
    mocks.upload.mockResolvedValue(undefined);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('ne rend rien fermé et ferme via les contrôles', () => {
    const { container, rerender } = render(<NewCaseDialog isOpen={false} onClose={mocks.close} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<NewCaseDialog isOpen onClose={mocks.close} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fermer la fenêtre' }));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(mocks.close).toHaveBeenCalledTimes(2);
  });

  it('sélectionne un client et crée le dossier avec ses pièces', async () => {
    const user = userEvent.setup();
    mocks.upload.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('bad file'));
    render(<NewCaseDialog isOpen onClose={mocks.close} />);
    await user.click(screen.getByRole('button', { name: /Client/ }));
    await user.click(screen.getByRole('button', { name: /Acme Corp/ }));
    await user.type(screen.getByLabelText(/Objet \/ titre du dossier/), '  Alpha dispute  ');
    await user.type(screen.getByLabelText(/Numéro \/ référence du dossier/), '  REF-1  ');
    await user.type(screen.getByLabelText(/Juridiction \/ tribunal/), '  High Court  ');
    await user.type(screen.getByLabelText(/Description \/ notes stratégiques/), '  Confidential  ');
    fireEvent.click(screen.getByTestId('dropzone'));
    fireEvent.submit(document.getElementById('new-case-form'));

    await waitFor(() => expect(mocks.mutate).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Alpha dispute', clientName: 'Acme Corp', clientId: '11111111-1111-4111-8111-111111111111',
      caseNumber: 'REF-1', courtName: 'High Court', description: 'Confidential',
    })));
    expect(mocks.upload).toHaveBeenCalledTimes(2);
    expect(mocks.success).toHaveBeenCalledWith('1 document(s) associé(s) au dossier');
    expect(mocks.error).toHaveBeenCalledWith(expect.stringContaining('1 document(s) non importé'));
    expect(mocks.close).toHaveBeenCalledOnce();
  });

  it('accepte un nom de client libre et permet de retirer une pièce', async () => {
    const user = userEvent.setup();
    render(<NewCaseDialog isOpen onClose={mocks.close} />);
    await user.click(screen.getByRole('button', { name: /Client/ }));
    const search = screen.getByPlaceholderText('Rechercher un client…');
    await user.type(search, 'New Client');
    await user.click(screen.getByRole('button', { name: /Utiliser quand même/ }));
    fireEvent.click(screen.getByTestId('dropzone'));
    await user.click(screen.getByRole('button', { name: 'Retirer one.pdf' }));
    expect(screen.queryByText('one.pdf')).not.toBeInTheDocument();
    expect(screen.getByText('two.pdf')).toBeInTheDocument();
  });

  it('affiche les erreurs de validation et du backend', async () => {
    const user = userEvent.setup();
    render(<NewCaseDialog isOpen onClose={mocks.close} />);
    fireEvent.submit(document.getElementById('new-case-form'));
    expect(await screen.findByText('Informations incomplètes')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Objet \/ titre du dossier/), 'Valid title');
    mocks.mutate.mockRejectedValue({ response: { data: { message: ['Duplicate', 'Forbidden'] } } });
    fireEvent.submit(document.getElementById('new-case-form'));
    expect(await screen.findByText('Duplicate, Forbidden')).toBeInTheDocument();
    expect(mocks.error).toHaveBeenCalledWith('Le formulaire n’a pas pu être envoyé');
  });
});

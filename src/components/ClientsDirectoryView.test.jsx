import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ClientsDirectoryView from './ClientsDirectoryView';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  refetch: vi.fn(),
  createMutate: vi.fn(),
  deleteMutate: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  role: 'CABINET_ADMIN',
  clientsResult: { data: [], isLoading: false, error: null },
}));

vi.mock('../lib/router', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('../hooks/useClients', () => ({
  useClients: () => ({ ...mocks.clientsResult, refetch: mocks.refetch }),
  useCreateClient: () => ({ mutate: mocks.createMutate, isPending: false }),
  useDeleteClient: () => ({ mutate: mocks.deleteMutate }),
}));

vi.mock('../hooks/useCases', () => ({
  useCases: () => ({ data: { cases: [] } }),
}));

vi.mock('../hooks/useCalendar', () => ({
  useGlobalDeadlines: () => ({ data: [] }),
}));

vi.mock('../store/useLexStore', () => ({
  default: (selector) => selector({ currentUser: { role: mocks.role } }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
}));

describe('ClientsDirectoryView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.refetch = vi.fn();
    mocks.clientsResult.data = [];
    mocks.clientsResult.isLoading = false;
    mocks.clientsResult.error = null;
    mocks.role = 'CABINET_ADMIN';
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('affiche une erreur réseau exploitable et permet de réessayer', () => {
    mocks.clientsResult.error = new Error('Network Error');

    render(<ClientsDirectoryView />);

    expect(screen.getByText('Directory Sync Error')).toBeInTheDocument();
    expect(screen.getByText('Network issue. Check your connection.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry connection/i }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });

  it('bloque nativement la création sans nom', () => {
    render(<ClientsDirectoryView />);

    fireEvent.click(screen.getByRole('button', { name: /^new client$/i }));
    const nameInput = screen.getByPlaceholderText('e.g. John Doe or Tech Africa Ltd');
    fireEvent.click(screen.getByRole('button', { name: /save client/i }));

    expect(nameInput).toBeRequired();
    expect(nameInput).toBeInvalid();
    expect(mocks.createMutate).not.toHaveBeenCalled();
  });

  it('retire les champs optionnels vides du payload de création', async () => {
    mocks.createMutate.mockImplementation((_payload, options) => options.onSuccess());
    render(<ClientsDirectoryView />);

    fireEvent.click(screen.getByRole('button', { name: /^new client$/i }));
    fireEvent.change(screen.getByPlaceholderText('e.g. John Doe or Tech Africa Ltd'), {
      target: { value: 'Alice Dupont' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save client/i }));

    await waitFor(() => expect(mocks.createMutate).toHaveBeenCalledOnce());
    const [payload] = mocks.createMutate.mock.calls[0];
    expect(payload).toEqual({
      name: 'Alice Dupont',
      phone: '',
      address: '',
      type_client: 'physique',
    });
    expect(screen.queryByRole('button', { name: /save client/i })).not.toBeInTheDocument();
  });

  it('demande confirmation avant la suppression optimiste', () => {
    mocks.clientsResult.data = [{
      id: 'client-1',
      name: 'Cabinet Demo',
      email: 'contact@example.test',
      type_client: 'morale',
    }];
    render(<ClientsDirectoryView />);

    fireEvent.click(screen.getAllByRole('button', { name: /delete client/i })[0]);

    expect(window.confirm).toHaveBeenCalledOnce();
    expect(mocks.deleteMutate).toHaveBeenCalledWith('client-1');
  });

  it.each([
    [{ response: { status: 401 } }, 'Your session has expired. Please log in again.'],
    [{ response: { status: 403 } }, "You don't have permission to access this resource."],
    [new Error('Database unavailable'), 'Database unavailable'],
    [{}, 'Something went wrong. Please try again.'],
  ])('présente les variantes d’erreur de synchronisation', (error, message) => {
    mocks.clientsResult.error = error;
    mocks.refetch = null;
    render(<ClientsDirectoryView />);
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry connection/i })).not.toBeInTheDocument();
  });

  it('affiche le chargement puis un état vide ouvrant le formulaire', () => {
    mocks.clientsResult.isLoading = true;
    const { rerender } = render(<ClientsDirectoryView />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    mocks.clientsResult.isLoading = false;
    rerender(<ClientsDirectoryView />);
    expect(screen.getByText('No clients match your search.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add a new client' }));
    expect(screen.getByRole('dialog', { name: 'Add a client' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('recherche par nom ou email, ferme le popup et ouvre un résultat', () => {
    mocks.clientsResult.data = [
      { id: 'client-1', name: 'Alice Dupont', email: 'alice@lex.test', phone: '600', address: 'Douala', type_client: 'physique' },
      { id: 'client-2', name: 'Atlas SARL', email: null, phone: null, address: null, type_client: 'morale' },
    ];
    render(<ClientsDirectoryView />);
    const search = screen.getByRole('textbox', { name: 'Search clients' });
    fireEvent.change(search, { target: { value: 'alice@lex' } });
    expect(screen.getByText('Results for "alice@lex"')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open search result Alice Dupont' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/clients/client-1');
    expect(screen.queryByText('Results for "alice@lex"')).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'missing' } });
    expect(screen.getByText('Aucun résultat')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close search results' }));
    expect(screen.queryByText('Aucun résultat')).not.toBeInTheDocument();
    fireEvent.focus(search);
    expect(screen.getByText('Aucun résultat')).toBeInTheDocument();
  });

  it('ouvre un client au clavier et respecte un refus de confirmation', () => {
    mocks.clientsResult.data = [{ id: 'client-1', name: 'Alice', type_client: 'physique' }];
    vi.mocked(window.confirm).mockReturnValue(false);
    render(<ClientsDirectoryView />);
    const openRows = screen.getAllByLabelText('Open Alice');
    fireEvent.keyDown(openRows[0], { key: 'Enter' });
    fireEvent.keyDown(openRows[1], { key: ' ' });
    expect(mocks.navigate).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Alice' }));
    expect(mocks.deleteMutate).not.toHaveBeenCalled();
  });

  it('masque toutes les actions administratives aux non-administrateurs', () => {
    mocks.role = 'LAWYER';
    mocks.clientsResult.data = [{ id: 'client-1', name: 'Alice', type_client: 'physique' }];
    render(<ClientsDirectoryView />);
    expect(screen.queryByRole('button', { name: /new client/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });
});

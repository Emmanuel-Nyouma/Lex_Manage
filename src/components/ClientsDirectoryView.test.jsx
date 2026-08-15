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
  default: (selector) => selector({ currentUser: { role: 'CABINET_ADMIN' } }),
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
    mocks.clientsResult.data = [];
    mocks.clientsResult.isLoading = false;
    mocks.clientsResult.error = null;
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
});

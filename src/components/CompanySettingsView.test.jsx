import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CompanySettingsView from './CompanySettingsView';

const mocks = vi.hoisted(() => ({
  role: 'CABINET_ADMIN',
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  writeText: vi.fn(),
  createObjectURL: vi.fn(() => 'blob:logo-preview'),
  invitations: [],
  members: [],
  tenant: null,
}));

vi.mock('../store/useLexStore', () => ({
  default: () => ({ currentUser: { id: 'user-1', role: mocks.role } }),
}));

vi.mock('../lib/api', () => ({
  default: {
    get: mocks.get,
    post: mocks.post,
    patch: mocks.patch,
    delete: mocks.delete,
  },
}));

vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

vi.mock('./SendNotificationDialog', () => ({
  default: ({ isOpen }) => (isOpen ? <div role="dialog">Notification</div> : null),
}));

describe('CompanySettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.role = 'CABINET_ADMIN';
    mocks.writeText.mockResolvedValue(undefined);
    mocks.invitations = [];
    mocks.members = [{
      id: 'user-1', firstName: 'Alice', lastName: 'Admin', email: 'alice@example.test',
      role: 'CABINET_ADMIN', isActive: true,
    }];
    mocks.tenant = {
      id: 'tenant-1234', name: 'Cabinet Demo', city: 'Douala', country: 'Cameroun',
      address: 'Bonanjo', phone: '600', fax: '', website: '', siret: '', barNumber: '',
      _count: { users: 1 }, roleStats: { lawyers: 0, assistants: 0, secretaries: 0 },
    };
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: mocks.writeText } });
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: mocks.createObjectURL });
    mocks.get.mockImplementation(async (path) => {
      if (path === '/tenants/invitations') return { data: mocks.invitations };
      if (path === '/tenants/members') return { data: mocks.members };
      return { data: mocks.tenant };
    });
  });

  it('bloque les utilisateurs non administrateurs', () => {
    mocks.role = 'LAWYER';
    render(<CompanySettingsView />);

    expect(screen.getByText('Restricted Access')).toBeInTheDocument();
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it('charge le cabinet et conserve la navigation entre les onglets extraits', async () => {
    render(<CompanySettingsView />);

    expect(await screen.findByText('Cabinet Demo')).toBeInTheDocument();
    expect(screen.getAllByText('Alice Admin')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
    expect(screen.getByText('Invite a member')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Firm Info' }));
    expect(screen.getByText('Firm Logo')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Send Notification/i }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Notification');
  });

  it('signale un échec de chargement sans bloquer l’écran', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.get.mockRejectedValue(new Error('offline'));
    render(<CompanySettingsView />);
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith('Error loading data'));
    expect(screen.getByText('Your Firm')).toBeInTheDocument();
  });

  it('copie l’identifiant du cabinet et signale un presse-papiers indisponible', async () => {
    render(<CompanySettingsView />);
    const copy = await screen.findByRole('button', { name: 'Copy firm ID' });
    fireEvent.click(copy);
    await waitFor(() => expect(mocks.writeText).toHaveBeenCalledWith('tenant-1234'));
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Copied to clipboard!');
    mocks.writeText.mockRejectedValueOnce(new Error('denied'));
    fireEvent.click(copy);
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith('Unable to copy to clipboard'));
  });

  it('crée une invitation, copie son lien et revient aux invitations', async () => {
    mocks.post.mockResolvedValue({ data: { token: 'token-123' } });
    render(<CompanySettingsView />);
    fireEvent.click(await screen.findByRole('button', { name: 'Invite' }));
    fireEvent.change(screen.getByLabelText('Professional Email'), { target: { value: 'bob@lex.test' } });
    fireEvent.change(screen.getByLabelText('Role in the firm'), { target: { value: 'ASSISTANT' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Generate invitation' }).closest('form'));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/tenants/invitations', {
      email: 'bob@lex.test', role: 'ASSISTANT',
    }));
    expect(screen.getByDisplayValue(/token-123/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Copy invitation link' }));
    await waitFor(() => expect(mocks.writeText).toHaveBeenCalledWith(expect.stringContaining('token-123')));
    fireEvent.click(screen.getByRole('button', { name: /View all pending invitations/ }));
    expect(screen.getByText('Pending Invitations')).toBeInTheDocument();
  });

  it('affiche l’erreur API d’invitation et permet de révoquer une invitation', async () => {
    mocks.invitations = [{
      id: 'invite-1', email: 'bob@lex.test', token: 'abcdefgh1234', role: 'LAWYER', expiresAt: '2026-09-01',
    }];
    mocks.post.mockRejectedValue({ response: { data: { message: 'Email déjà invité' } } });
    mocks.delete.mockResolvedValue({});
    render(<CompanySettingsView />);
    fireEvent.click(await screen.findByRole('button', { name: 'Invite' }));
    fireEvent.change(screen.getByLabelText('Professional Email'), { target: { value: 'bob@lex.test' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Generate invitation' }).closest('form'));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith('Email déjà invité'));
    fireEvent.click(screen.getByRole('button', { name: /Invitations/ }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Revoke invitation' })[0]);
    await waitFor(() => expect(mocks.delete).toHaveBeenCalledWith('/tenants/invitations/invite-1'));
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Invitation revoked');
  });

  it('modifie le rôle d’un collègue et désactive son accès après confirmation', async () => {
    mocks.members = [
      ...mocks.members,
      { id: 'user-2', firstName: 'Bob', lastName: 'Lawyer', email: 'bob@lex.test', role: 'LAWYER', isActive: true, createdAt: '2026-01-01' },
    ];
    mocks.patch.mockResolvedValue({ data: {} });
    render(<CompanySettingsView />);
    await screen.findAllByText('Bob Lawyer');
    const edit = screen.getAllByRole('button', { name: 'Edit role' }).find((button) => !button.disabled);
    fireEvent.click(edit);
    expect(screen.getByRole('dialog', { name: /Edit Member: Bob Lawyer/ })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Member Role'), { target: { value: 'ASSISTANT' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update Role' }));
    await waitFor(() => expect(mocks.patch).toHaveBeenCalledWith('/tenants/members/user-2', { role: 'ASSISTANT' }));
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Member updated');

    const deactivate = screen.getAllByRole('button', { name: 'Deactivate member' }).find((button) => !button.disabled);
    fireEvent.click(deactivate);
    expect(screen.getByRole('alertdialog', { name: 'Deactivate Bob?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));
    await waitFor(() => expect(mocks.patch).toHaveBeenCalledWith('/tenants/members/user-2', { isActive: false }));
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Member deactivated');
  });

  it('enregistre les informations du cabinet et téléverse le logo', async () => {
    mocks.patch.mockResolvedValue({ data: { name: 'Cabinet Atlas', city: 'Yaoundé' } });
    mocks.post.mockResolvedValue({ data: { logoUrl: 'https://cdn.test/logo.png' } });
    render(<CompanySettingsView />);
    fireEvent.click(await screen.findByRole('button', { name: 'Firm Info' }));
    fireEvent.change(screen.getByLabelText(/Firm Name/), { target: { value: 'Cabinet Atlas' } });
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Yaoundé' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(mocks.patch).toHaveBeenCalledWith('/tenants/me', expect.objectContaining({
      name: 'Cabinet Atlas', city: 'Yaoundé',
    })));
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Firm information updated');

    const file = new File(['logo'], 'logo.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Firm logo file'), { target: { files: [file] } });
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/tenants/me/logo', expect.any(FormData), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }));
    expect(mocks.createObjectURL).toHaveBeenCalledWith(file);
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Logo updated');
  });
});

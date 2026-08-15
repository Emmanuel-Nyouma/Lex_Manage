import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileView from './ProfileView';

const mocks = vi.hoisted(() => ({
  user: {
    id: 'user-1', firstName: 'Alice', lastName: 'Admin', email: 'alice@lex.test',
    phone: '+237600000000', role: 'CABINET_ADMIN',
  },
  fetchMe: vi.fn(),
  mutate: vi.fn(),
  isPending: false,
  patch: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('../store/useLexStore', () => ({
  default: () => ({ currentUser: mocks.user, fetchMe: mocks.fetchMe }),
}));
vi.mock('../hooks/useProfile', () => ({
  useUpdateProfile: () => ({ mutate: mocks.mutate, isPending: mocks.isPending }),
}));
vi.mock('../lib/api', () => ({ default: { patch: mocks.patch } }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }));

describe('ProfileView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = {
      id: 'user-1', firstName: 'Alice', lastName: 'Admin', email: 'alice@lex.test',
      phone: '+237600000000', role: 'CABINET_ADMIN',
    };
    mocks.isPending = false;
    mocks.patch.mockResolvedValue({});
  });

  it('affiche l’identité administrative et ses coordonnées', () => {
    render(<ProfileView />);
    expect(screen.getByRole('heading', { name: 'Alice Admin' })).toBeInTheDocument();
    expect(screen.getByText('CABINET ADMIN')).toBeInTheDocument();
    expect(screen.getByText('alice@lex.test')).toBeInTheDocument();
    expect(screen.getByText('+237600000000')).toBeInTheDocument();
  });

  it('affiche les valeurs de repli d’un profil incomplet non-admin', () => {
    mocks.user = { role: undefined };
    render(<ProfileView />);
    expect(screen.getByRole('heading', { name: 'No Name Set' })).toBeInTheDocument();
    expect(screen.getByText('Lawyer')).toBeInTheDocument();
    expect(screen.getByText('No email set')).toBeInTheDocument();
    expect(screen.getByText('No phone set')).toBeInTheDocument();
  });

  it('modifie le profil puis recharge l’utilisateur après succès', async () => {
    const user = userEvent.setup();
    mocks.mutate.mockImplementation((_data, options) => options.onSuccess());
    render(<ProfileView />);

    await user.click(screen.getByRole('button', { name: 'Edit Profile' }));
    const firstName = screen.getByLabelText('First Name');
    expect(firstName).toHaveValue('Alice');
    await user.clear(firstName);
    await user.type(firstName, 'Alicia');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => expect(mocks.mutate).toHaveBeenCalledWith({
      firstName: 'Alicia', lastName: 'Admin', phone: '+237600000000',
    }, expect.objectContaining({ onSuccess: expect.any(Function) })));
    expect(mocks.fetchMe).toHaveBeenCalledOnce();
    expect(screen.getByRole('heading', { name: 'My Profile' })).toBeInTheDocument();
  });

  it('valide les noms requis et permet d’annuler l’édition', async () => {
    const user = userEvent.setup();
    render(<ProfileView />);
    await user.click(screen.getByRole('button', { name: 'Edit Profile' }));
    await user.clear(screen.getByLabelText('First Name'));
    fireEvent.submit(screen.getByRole('button', { name: 'Save Changes' }).closest('form'));
    expect(await screen.findByText('First name is required')).toBeInTheDocument();
    expect(mocks.mutate).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('heading', { name: 'My Profile' })).toBeInTheDocument();
  });

  it('rejette localement des nouveaux mots de passe différents', async () => {
    const user = userEvent.setup();
    render(<ProfileView />);
    await user.click(screen.getByRole('button', { name: 'Modifier le mot de passe' }));
    await user.type(screen.getByLabelText(/Mot de passe actuel/), 'old-password');
    await user.type(screen.getByLabelText(/Nouveau mot de passe/), 'new-password');
    await user.type(screen.getByLabelText(/Confirmer le mot de passe/), 'different');
    fireEvent.submit(screen.getByRole('button', { name: 'Enregistrer' }).closest('form'));
    expect(mocks.error).toHaveBeenCalledWith('Les nouveaux mots de passe ne correspondent pas.');
    expect(mocks.patch).not.toHaveBeenCalled();
  });

  it('change le mot de passe, réinitialise le formulaire et affiche le succès', async () => {
    const user = userEvent.setup();
    render(<ProfileView />);
    await user.click(screen.getByRole('button', { name: 'Modifier le mot de passe' }));
    await user.type(screen.getByLabelText(/Mot de passe actuel/), 'old-password');
    await user.type(screen.getByLabelText(/Nouveau mot de passe/), 'new-password');
    await user.type(screen.getByLabelText(/Confirmer le mot de passe/), 'new-password');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(mocks.patch).toHaveBeenCalledWith('/auth/change-password', {
      currentPassword: 'old-password', newPassword: 'new-password',
    }));
    expect(mocks.success).toHaveBeenCalledWith(
      'Mot de passe modifié. Vos autres sessions ont été révoquées.',
    );
    expect(screen.getByRole('button', { name: 'Modifier le mot de passe' })).toBeInTheDocument();
  });

  it('affiche le message backend lors d’un échec de mot de passe et permet d’annuler', async () => {
    mocks.patch.mockRejectedValue({ response: { data: { message: 'Mot de passe actuel incorrect' } } });
    const user = userEvent.setup();
    render(<ProfileView />);
    await user.click(screen.getByRole('button', { name: 'Modifier le mot de passe' }));
    await user.type(screen.getByLabelText(/Mot de passe actuel/), 'wrong-password');
    await user.type(screen.getByLabelText(/Nouveau mot de passe/), 'new-password');
    await user.type(screen.getByLabelText(/Confirmer le mot de passe/), 'new-password');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Mot de passe actuel incorrect'));
    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.getByRole('button', { name: 'Modifier le mot de passe' })).toBeInTheDocument();
  });

  it('utilise un message générique si l’erreur mot de passe est sans réponse API', async () => {
    mocks.patch.mockRejectedValue(new Error('offline'));
    const user = userEvent.setup();
    render(<ProfileView />);
    await user.click(screen.getByRole('button', { name: 'Modifier le mot de passe' }));
    for (const label of ['Mot de passe actuel', 'Nouveau mot de passe', 'Confirmer le mot de passe']) {
      await user.type(screen.getByLabelText(new RegExp(label)), label === 'Mot de passe actuel' ? 'old-password' : 'new-password');
    }
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Impossible de modifier le mot de passe.'));
  });
});

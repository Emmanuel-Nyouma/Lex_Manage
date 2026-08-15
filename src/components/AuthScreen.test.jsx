import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AuthScreen from './AuthScreen';

const mocks = vi.hoisted(() => ({
  params: new URLSearchParams(),
  login: vi.fn(),
  post: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('../lib/router', () => ({ useSearchParams: () => [mocks.params] }));
vi.mock('../lib/api', () => ({ default: { post: mocks.post } }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }));
vi.mock('./NetworkStatusBanner', () => ({ default: () => <div data-testid="network-status" /> }));
vi.mock('../store/useLexStore', () => {
  const useLexStore = (selector) => selector({ language: 'fr' });
  useLexStore.getState = () => ({ login: mocks.login });
  return { default: useLexStore };
});

const fill = async (user, label, value) => user.type(screen.getByLabelText(label), value);

describe('AuthScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.params = new URLSearchParams();
    mocks.login.mockResolvedValue(undefined);
    mocks.post.mockResolvedValue({ data: {} });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('connecte un utilisateur et reflète le réveil du serveur', async () => {
    const user = userEvent.setup();
    render(<AuthScreen />);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/health'), { method: 'GET' });

    fireEvent(window, new Event('api:warming-up'));
    expect(screen.getByRole('status')).toHaveTextContent('Démarrage du serveur');
    fireEvent(window, new Event('api:warmed'));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    await fill(user, 'Email professionnel', 'lawyer@example.com');
    await fill(user, 'Mot de passe', 'Secret1!');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));
    await waitFor(() => expect(mocks.login).toHaveBeenCalledWith('lawyer@example.com', 'Secret1!'));
    expect(screen.getByText(/Heureux de vous/)).toBeInTheDocument();
  });

  it('affiche une erreur de connexion sans révéler le compte', async () => {
    const user = userEvent.setup();
    mocks.login.mockRejectedValue({ response: { status: 401 } });
    render(<AuthScreen />);
    await fill(user, 'Email professionnel', 'unknown@example.com');
    await fill(user, 'Mot de passe', 'Wrong1!');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Adresse email ou mot de passe incorrect');
  });

  it('valide les deux étapes puis crée un cabinet', async () => {
    const user = userEvent.setup();
    render(<AuthScreen />);
    await user.click(screen.getByRole('button', { name: 'Créer un nouveau cabinet' }));
    await user.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(mocks.error).toHaveBeenCalledWith(expect.stringContaining('informations du cabinet'));

    await fill(user, 'Nom du cabinet', 'Lex Partners');
    await fill(user, 'Pays', 'Cameroun');
    await fill(user, 'Ville', 'Douala');
    await user.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(screen.getByText('Étape 2 : administrateur principal')).toBeInTheDocument();

    await fill(user, 'Prénom', 'Ada');
    await fill(user, 'Nom', 'Njou');
    await fill(user, 'Email professionnel', 'ada@example.com');
    await fill(user, 'Téléphone', '+237690000000');
    await fill(user, 'Mot de passe', 'SecurePass1!');
    await fill(user, 'Confirmer le mot de passe', 'SecurePass1!');
    expect(screen.getByText('Forte')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Créer le cabinet' }));

    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/auth/register', expect.objectContaining({
      tenantName: 'Lex Partners',
      email: 'ada@example.com',
      invitationToken: undefined,
    })));
    expect(mocks.success).toHaveBeenCalledWith(expect.stringContaining('Cabinet créé'));
    expect(screen.getByRole('heading', { name: 'Bienvenue' })).toBeInTheDocument();
  }, 15_000);

  it('envoie un lien de récupération et revient à la connexion', async () => {
    const user = userEvent.setup();
    mocks.post.mockResolvedValue({ data: { message: 'Lien envoyé' } });
    render(<AuthScreen />);
    await user.click(screen.getByRole('button', { name: 'Mot de passe oublié ?' }));
    await fill(user, 'Email de récupération', 'ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Envoyer le lien' }));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'ada@example.com' }));
    expect(mocks.success).toHaveBeenCalledWith('Lien envoyé');
    expect(screen.getByRole('heading', { name: 'Bienvenue' })).toBeInTheDocument();
  });

  it('réinitialise le mot de passe depuis un jeton URL', async () => {
    const user = userEvent.setup();
    mocks.params = new URLSearchParams('mode=reset_password&token=reset-token');
    render(<AuthScreen />);
    await fill(user, 'Nouveau mot de passe', 'NewPassword1!');
    await fill(user, 'Confirmer le mot de passe', 'NewPassword1!');
    await user.click(screen.getByRole('button', { name: 'Réinitialiser le mot de passe' }));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/auth/reset-password', {
      token: 'reset-token',
      newPassword: 'NewPassword1!',
    }));
    expect(screen.getByRole('heading', { name: 'Bienvenue' })).toBeInTheDocument();
  });

  it('rejoint directement un cabinet avec un jeton d’invitation', async () => {
    const user = userEvent.setup();
    mocks.params = new URLSearchParams('invitation=invite-token');
    render(<AuthScreen />);
    expect(screen.getByRole('heading', { name: 'Rejoindre le cabinet' })).toBeInTheDocument();
    await fill(user, 'Prénom', 'Ada');
    await fill(user, 'Nom', 'Njou');
    await fill(user, 'Email professionnel', 'ada@example.com');
    await fill(user, 'Téléphone', '+237690000000');
    await fill(user, 'Mot de passe', 'SecurePass1!');
    await fill(user, 'Confirmer le mot de passe', 'SecurePass1!');
    await user.click(screen.getByRole('button', { name: 'Rejoindre maintenant' }));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/auth/register', expect.objectContaining({
      invitationToken: 'invite-token',
      tenantName: undefined,
    })));
  });
});

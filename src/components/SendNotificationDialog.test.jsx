import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SendNotificationDialog from './SendNotificationDialog';

const mocks = vi.hoisted(() => ({
  get: vi.fn(), post: vi.fn(), close: vi.fn(), success: vi.fn(), error: vi.fn(), info: vi.fn(),
}));
vi.mock('../lib/api', () => ({ default: { get: mocks.get, post: mocks.post } }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error, info: mocks.info } }));
vi.mock('../hooks/useCases', () => ({
  useCases: () => ({ data: { cases: [{ id: '11111111-1111-4111-8111-111111111111', title: 'Alpha', clientName: 'Acme' }] } }),
}));

const advanceToMessage = async (user) => {
  await user.click(screen.getByRole('button', { name: /Continuer/ }));
  await user.click(screen.getByRole('button', { name: /Audience imminente/ }));
  await user.click(screen.getByRole('button', { name: /Suivant/ }));
  await user.click(screen.getByRole('button', { name: /Administrateurs/ }));
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '11111111-1111-4111-8111-111111111111' } });
  await user.click(screen.getByRole('button', { name: /Dernière étape/ }));
};

describe('SendNotificationDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockResolvedValue({ data: [] });
    mocks.post.mockResolvedValue({ data: {} });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('ne rend rien quand il est fermé', () => {
    const { container } = render(<SendNotificationDialog isOpen={false} onClose={mocks.close} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('charge et applique un modèle', async () => {
    const template = { id: 't1', name: 'Court alert', level: 'URGENT', motif: 'HEARING', title: 'Hearing', message: 'Tomorrow', recipientRoles: ['LAWYER'] };
    mocks.get.mockResolvedValue({ data: [template] });
    render(<SendNotificationDialog isOpen onClose={mocks.close} />);
    fireEvent.click(screen.getByRole('button', { name: 'Templates' }));
    expect(await screen.findByRole('button', { name: /Court alert/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Court alert/ }));
    expect(mocks.success).toHaveBeenCalledWith('Template "Court alert" applied');
  });

  it('parcourt les étapes, ajuste le niveau et envoie une notification', async () => {
    const user = userEvent.setup();
    render(<SendNotificationDialog isOpen onClose={mocks.close} />);
    await advanceToMessage(user);
    expect(mocks.info).toHaveBeenCalledWith(expect.stringContaining('automatiquement ajusté à 2'));
    await user.type(screen.getByLabelText("Sujet de l'alerte"), '  Hearing update  ');
    await user.type(screen.getByLabelText('Contenu détaillé'), '  Attend tomorrow  ');
    await user.click(screen.getByRole('button', { name: /Diffuser l'alerte/ }));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/notifications', {
      level: 'IMPORTANT', motif: 'HEARING', title: 'Hearing update', message: 'Attend tomorrow',
      recipientRoles: ['CABINET_ADMIN'], caseId: '11111111-1111-4111-8111-111111111111',
    }));
    expect(mocks.close).toHaveBeenCalledOnce();
  });

  it('permet de retirer un rôle et affiche une erreur serveur', async () => {
    const user = userEvent.setup();
    mocks.post.mockRejectedValue({ response: { data: { message: 'Permission denied' } } });
    render(<SendNotificationDialog isOpen onClose={mocks.close} />);
    await user.click(screen.getByRole('button', { name: /Continuer/ }));
    await user.click(screen.getByRole('button', { name: /Suivant/ }));
    await user.click(screen.getByRole('button', { name: /Assistants/ }));
    await user.click(screen.getByRole('button', { name: /Assistants/ }));
    await user.click(screen.getByRole('button', { name: /Dernière étape/ }));
    await user.click(screen.getByRole('button', { name: /Diffuser l'alerte/ }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Erreur d'envoi: Permission denied"));
  });

  it('signale une panne de chargement des modèles', async () => {
    mocks.get.mockRejectedValue(new Error('offline'));
    render(<SendNotificationDialog isOpen onClose={mocks.close} />);
    fireEvent.click(screen.getByRole('button', { name: 'Templates' }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Failed to load templates'));
    expect(screen.getByText(/No templates available/)).toBeInTheDocument();
  });
});

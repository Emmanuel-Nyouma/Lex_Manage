import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ScheduledTab from './NotificationScheduled';
import { HistoryTab, TemplatesTab } from './NotificationHistoryTemplates';

const { api, toast } = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('../../lib/api', () => ({ default: api }));
vi.mock('sonner', () => ({ toast }));
vi.mock('../../hooks/useCases', () => ({
  useCases: () => ({ data: { cases: [{ id: 'case-1', title: 'Affaire Atlas', clientName: 'Atlas SARL' }] } }),
}));

const pending = {
  id: 'scheduled-1',
  title: 'Audience Atlas',
  message: 'Préparer les pièces',
  level: 'IMPORTANT',
  motif: 'HEARING',
  status: 'PENDING',
  scheduledAt: '2027-08-20T09:00:00Z',
  case: { title: 'Affaire Atlas' },
  recipientRoles: ['LAWYER'],
};

const archived = {
  id: 'scheduled-2',
  level: 'NORMAL',
  motif: 'INTERNAL_REMINDER',
  status: 'SENT',
  scheduledAt: '2026-08-01T09:00:00Z',
  recipientRoles: [],
};

const historyItem = {
  id: 'history-1',
  title: 'Délai Atlas',
  message: 'Déposer les conclusions',
  level: 'URGENT',
  motif: 'DEADLINE',
  createdAt: '2026-08-15T09:00:00Z',
  case: { title: 'Affaire Atlas' },
  recipientIds: ['user-1', 'user-2'],
  createdBy: { firstName: 'Ada', lastName: 'Njoya' },
};

const template = {
  id: 'template-1',
  name: 'Rappel audience',
  title: 'Audience demain',
  message: 'Merci de vérifier le dossier.',
  level: 'IMPORTANT',
  motif: 'HEARING',
  recipientRoles: ['LAWYER'],
  createdBy: { firstName: 'Ada', lastName: 'Njoya' },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ScheduledTab', () => {
  it('charge les notifications, annule une attente et supprime une archive', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: [pending, archived] });
    api.delete.mockResolvedValue({});
    render(<ScheduledTab />);

    expect(await screen.findByText('Audience Atlas')).toBeInTheDocument();
    expect(screen.getByText('Archive')).toBeInTheDocument();
    expect(screen.getByText('Affaire Atlas')).toBeInTheDocument();
    expect(screen.getByText('LAWYER')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel Audience Atlas' }));
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/notifications/scheduled/scheduled-1'));
    expect(toast.success).toHaveBeenCalledWith('Scheduled notification cancelled');

    await user.click(screen.getByRole('button', { name: /Delete Rappel interne/i }));
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/notifications/scheduled/scheduled-2/permanent'));
    expect(toast.success).toHaveBeenCalledWith('Scheduled notification deleted');
  });

  it('affiche l’état vide et signale un échec de chargement', async () => {
    api.get.mockRejectedValue(new Error('offline'));
    render(<ScheduledTab />);
    expect(await screen.findByText(/No scheduled notifications/)).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Failed to load scheduled notifications');
  });

  it('crée une notification planifiée avec dossier et destinataire', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: [] });
    api.post.mockResolvedValue({ data: { ...pending, id: 'scheduled-new' } });
    render(<ScheduledTab />);

    await user.click(await screen.findByRole('button', { name: 'Schedule Notification' }));
    await user.selectOptions(screen.getByLabelText('Level'), 'URGENT');
    await user.selectOptions(screen.getByLabelText('Motif'), 'DEADLINE');
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Échéance urgente' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Préparer les conclusions' } });
    await user.selectOptions(screen.getByLabelText('Related Case (optional)'), 'case-1');
    await user.click(screen.getByRole('button', { name: 'Avocats / Partners' }));
    fireEvent.change(screen.getByLabelText('Send at *'), { target: { value: '2027-08-20T09:00' } });
    await user.click(screen.getByRole('button', { name: 'Schedule' }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/notifications/scheduled', expect.objectContaining({
      level: 'URGENT', motif: 'DEADLINE', title: 'Échéance urgente', caseId: 'case-1', recipientRoles: ['LAWYER'],
    })));
    expect(api.post.mock.calls[0][1].scheduledAt).toBe(new Date('2027-08-20T09:00').toISOString());
    expect(toast.success).toHaveBeenCalledWith('Notification scheduled');
    expect(screen.queryByText('Schedule a Notification')).not.toBeInTheDocument();
  });

  it('retire un rôle, omet le dossier vide et affiche l’erreur API de création', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: [] });
    api.post.mockRejectedValue({ response: { data: { message: 'Date invalide' } } });
    render(<ScheduledTab />);

    await user.click(await screen.findByRole('button', { name: 'Schedule Notification' }));
    const role = screen.getByRole('button', { name: 'Administrateurs' });
    await user.click(role);
    await user.click(role);
    fireEvent.change(screen.getByLabelText('Send at *'), { target: { value: '2027-09-01T10:30' } });
    await user.click(screen.getByRole('button', { name: 'Schedule' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Date invalide'));
    expect(api.post.mock.calls[0][1]).toEqual(expect.objectContaining({ caseId: undefined, recipientRoles: [] }));
    expect(screen.getByText('Schedule a Notification')).toBeInTheDocument();
  });

  it('signale les erreurs génériques d’annulation et de suppression', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: [pending, archived] });
    api.delete.mockRejectedValueOnce(new Error('offline')).mockRejectedValueOnce({ response: { data: { message: 'Suppression refusée' } } });
    render(<ScheduledTab />);

    await user.click(await screen.findByRole('button', { name: 'Cancel Audience Atlas' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to cancel'));
    await user.click(screen.getByRole('button', { name: /Delete Rappel interne/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Suppression refusée'));
  });
});

describe('HistoryTab', () => {
  it('charge, développe au clavier et replie une notification', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: [historyItem] });
    render(<HistoryTab />);

    const toggle = await screen.findByRole('button', { name: 'Expand Délai Atlas' });
    toggle.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByText('2 users')).toBeInTheDocument();
    expect(screen.getByText('Affaire Atlas')).toBeInTheDocument();
    expect(screen.getByText('Ada Njoya', { exact: false })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Collapse Délai Atlas' }));
    expect(screen.queryByText('2 users')).not.toBeInTheDocument();
  });

  it('supprime une notification et permet de rafraîchir la liste', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: [historyItem] });
    api.delete.mockResolvedValue({});
    render(<HistoryTab />);

    await user.click(await screen.findByRole('button', { name: 'Delete Délai Atlas' }));
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/notifications/history/history-1'));
    expect(toast.success).toHaveBeenCalledWith('Notification deleted');
    expect(await screen.findByText(/No notifications sent yet/)).toBeInTheDocument();
  });

  it('rafraîchit et affiche les valeurs de repli', async () => {
    const user = userEvent.setup();
    api.get
      .mockResolvedValueOnce({ data: [{ ...historyItem, id: 'history-2', title: '', message: '', case: null, recipientIds: [], createdBy: null }] })
      .mockResolvedValueOnce({ data: [historyItem] });
    render(<HistoryTab />);

    expect(await screen.findByRole('button', { name: /Expand Délai procédural/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Délai Atlas')).toBeInTheDocument();
  });

  it('signale les erreurs de chargement et de suppression', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({ data: [historyItem] });
    api.delete.mockRejectedValue({ response: { data: { message: 'Conservation obligatoire' } } });
    render(<HistoryTab />);
    await user.click(await screen.findByRole('button', { name: 'Delete Délai Atlas' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Conservation obligatoire'));

    vi.clearAllMocks();
    api.get.mockRejectedValue(new Error('offline'));
    render(<HistoryTab />);
    expect(await screen.findByText(/No notifications sent yet/)).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Failed to load history');
  });
});

describe('TemplatesTab', () => {
  it('charge, utilise et supprime un modèle', async () => {
    const user = userEvent.setup();
    const onUse = vi.fn();
    api.get.mockResolvedValue({ data: [template] });
    api.delete.mockResolvedValue({});
    render(<TemplatesTab onUseTemplate={onUse} />);

    await user.click(await screen.findByRole('button', { name: 'Use' }));
    expect(onUse).toHaveBeenCalledWith(template);
    await user.click(screen.getByRole('button', { name: 'Delete Rappel audience' }));
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/notifications/templates/template-1'));
    expect(toast.success).toHaveBeenCalledWith('Template deleted');
    expect(await screen.findByText(/No templates yet/)).toBeInTheDocument();
  });

  it('crée un modèle complet puis ferme le formulaire', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: [] });
    api.post.mockResolvedValue({ data: { ...template, id: 'template-new', name: 'Relance client' } });
    render(<TemplatesTab onUseTemplate={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'New Template' }));
    fireEvent.change(screen.getByLabelText('Template name *'), { target: { value: 'Relance client' } });
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Pièces manquantes' } });
    await user.selectOptions(screen.getByLabelText('Level'), 'URGENT');
    await user.selectOptions(screen.getByLabelText('Motif'), 'DOCUMENT_TO_SIGN');
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Merci de transmettre les pièces.' } });
    const role = screen.getByRole('button', { name: 'Secrétaires' });
    await user.click(role);
    await user.click(role);
    await user.click(screen.getByRole('button', { name: 'Assistants' }));
    await user.click(screen.getByRole('button', { name: 'Save Template' }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/notifications/templates', {
      name: 'Relance client', level: 'URGENT', motif: 'DOCUMENT_TO_SIGN', title: 'Pièces manquantes',
      message: 'Merci de transmettre les pièces.', recipientRoles: ['ASSISTANT'],
    }));
    expect(toast.success).toHaveBeenCalledWith('Template created');
    expect(screen.queryByText('New Template', { selector: 'h4' })).not.toBeInTheDocument();
  });

  it('valide le nom obligatoire et affiche une erreur API', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: [] });
    api.post.mockRejectedValue({ response: { data: { message: 'Nom déjà utilisé' } } });
    render(<TemplatesTab onUseTemplate={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'New Template' }));
    fireEvent.submit(screen.getByRole('button', { name: 'Save Template' }).closest('form'));
    expect(toast.error).toHaveBeenCalledWith('Template name is required');
    expect(api.post).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Template name *'), { target: { value: 'Doublon' } });
    await user.click(screen.getByRole('button', { name: 'Save Template' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Nom déjà utilisé'));
  });

  it('permet d’annuler le formulaire', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ data: [] });
    render(<TemplatesTab onUseTemplate={vi.fn()} />);
    await user.click(await screen.findByRole('button', { name: 'New Template' }));
    expect(screen.getByText('New Template', { selector: 'h4' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('New Template', { selector: 'h4' })).not.toBeInTheDocument();
  });

  it('signale les échecs de chargement et de suppression', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({ data: [template] });
    api.delete.mockRejectedValue(new Error('offline'));
    render(<TemplatesTab onUseTemplate={vi.fn()} />);
    await user.click(await screen.findByRole('button', { name: 'Delete Rappel audience' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to delete template'));

    vi.clearAllMocks();
    api.get.mockRejectedValue(new Error('offline'));
    render(<TemplatesTab onUseTemplate={vi.fn()} />);
    expect(await screen.findByText(/No templates yet/)).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Failed to load templates');
  });
});

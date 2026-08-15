import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditLogsTable } from './AuditLogsTable';
import NewEventDialog from './NewEventDialog';

const mocks = vi.hoisted(() => ({
  cases: [],
  post: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('../hooks/useCases', () => ({
  useCases: () => ({ data: { cases: mocks.cases } }),
}));
vi.mock('../lib/api', () => ({
  default: { post: mocks.post },
}));
vi.mock('sonner', () => ({
  toast: { success: mocks.success, error: mocks.error },
}));

describe('AuditLogsTable', () => {
  it('présente un état vide sur les dispositions mobile et desktop', () => {
    render(<AuditLogsTable />);
    expect(screen.getAllByText('No activity logs found.')).toHaveLength(2);
    expect(screen.getByRole('columnheader', { name: 'User' })).toBeInTheDocument();
  });

  it('rend chaque journal avec acteur, action et identifiant tronqué', () => {
    render(<AuditLogsTable logs={[
      {
        id: 'log-1', action: 'DELETE', entity: 'Case', entityId: '1234567890abcdef',
        createdAt: '2026-07-26T12:00:00.000Z', user: { firstName: 'Alice', lastName: 'Admin' },
      },
      {
        id: 'log-2', action: 'UPDATE', entity: 'Client', entityId: null,
        createdAt: '2026-07-26T13:00:00.000Z', user: null,
      },
    ]} />);

    expect(screen.getAllByText('Alice Admin')).toHaveLength(2);
    expect(screen.getAllByText('DELETE')).toHaveLength(2);
    expect(screen.getAllByText('UPDATE')).toHaveLength(2);
    expect(screen.getAllByText('#12345678')).toHaveLength(2);
    expect(screen.getAllByText('#')).toHaveLength(2);
  });
});

describe('NewEventDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cases = [
      { id: 'case-1', title: 'Contrat Acme', clientName: 'Acme SARL' },
    ];
    mocks.post.mockResolvedValue({ data: { id: 'deadline-1' } });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('ne rend rien lorsqu’il est fermé', () => {
    const { container } = render(<NewEventDialog isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('valide les champs requis sans appeler le backend', async () => {
    const user = userEvent.setup();
    render(<NewEventDialog isOpen onClose={vi.fn()} />);

    fireEvent.submit(screen.getByRole('dialog').querySelector('form'));
    expect(mocks.error).toHaveBeenCalledWith('Veuillez remplir les champs obligatoires');
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it('crée une échéance globale avec les valeurs par défaut et ferme la modale', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<NewEventDialog isOpen onClose={onClose} />);

    await user.type(screen.getByLabelText(/Titre de l'échéance/), 'Audience urgente');
    fireEvent.change(screen.getByLabelText(/Date d'échéance/), { target: { value: '2026-08-20' } });
    await user.click(screen.getByRole('button', { name: 'Créer l’échéance' }));

    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/cases/none/deadlines', {
      title: 'Audience urgente', dueAt: '2026-08-20', priority: 'MEDIUM',
    }));
    expect(mocks.success).toHaveBeenCalledWith('Événement ajouté au calendrier');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('crée une échéance liée au dossier avec une priorité choisie', async () => {
    const user = userEvent.setup();
    const { container } = render(<NewEventDialog isOpen onClose={vi.fn()} />);
    const selects = container.querySelectorAll('select');

    await user.type(screen.getByLabelText(/Titre de l'échéance/), 'Dépôt mémoire');
    fireEvent.change(screen.getByLabelText(/Date d'échéance/), { target: { value: '2026-09-01' } });
    await user.selectOptions(selects[0], 'URGENT');
    await user.selectOptions(selects[1], 'case-1');
    await user.click(screen.getByRole('button', { name: 'Créer l’échéance' }));

    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith('/cases/case-1/deadlines', {
      title: 'Dépôt mémoire', dueAt: '2026-09-01', priority: 'URGENT',
    }));
  });

  it('affiche une erreur de création et réactive le bouton', async () => {
    mocks.post.mockRejectedValue(new Error('offline'));
    const user = userEvent.setup();
    render(<NewEventDialog isOpen onClose={vi.fn()} />);

    await user.type(screen.getByLabelText(/Titre de l'échéance/), 'Audience');
    fireEvent.change(screen.getByLabelText(/Date d'échéance/), { target: { value: '2026-08-20' } });
    await user.click(screen.getByRole('button', { name: 'Créer l’échéance' }));

    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Erreur lors de la création de l'événement"));
    expect(screen.getByRole('button', { name: 'Créer l’échéance' })).toBeEnabled();
  });

  it('se ferme depuis le bouton, Annuler, le fond et Échap', async () => {
    const onClose = vi.fn();
    const { container } = render(<NewEventDialog isOpen onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    fireEvent.click(container.firstChild.firstChild);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(4);
  });
});

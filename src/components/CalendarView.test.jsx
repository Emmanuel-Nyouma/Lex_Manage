import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CalendarView from './CalendarView';

const mocks = vi.hoisted(() => ({
  calendar: vi.fn(),
  deleteDeadline: vi.fn(),
  refetch: vi.fn(),
  role: 'CABINET_ADMIN',
}));

vi.mock('../hooks/useCalendar', () => ({ useGlobalDeadlines: mocks.calendar }));
vi.mock('../hooks/useCases', () => ({
  useDeleteDeadline: () => ({ mutateAsync: mocks.deleteDeadline }),
}));
vi.mock('../store/useLexStore', () => ({
  default: () => ({ currentUser: { id: 'admin-1', role: mocks.role } }),
}));
vi.mock('./NewEventDialog', () => ({
  default: ({ isOpen, onClose }) => isOpen ? <div role="dialog" aria-label="new event"><button onClick={onClose}>Close event form</button></div> : null,
}));
vi.mock('./ConfirmDialog', () => ({
  default: ({ isOpen, onConfirm, onCancel }) => isOpen ? <div role="dialog" aria-label="delete confirmation"><button onClick={onConfirm}>Confirm delete</button><button onClick={onCancel}>Cancel delete</button></div> : null,
}));

const events = [
  { id: 'event-1', title: 'Contract hearing', dueAt: '2026-08-15', priority: 'URGENT', isDone: false, case: { title: 'Acme dispute' } },
  { id: 'event-2', title: 'File submissions', dueAt: '2026-08-20', priority: 'HIGH', isDone: true, case: null },
  { id: 'event-3', title: 'September mediation', dueAt: '2026-09-02', priority: 'NORMAL', isDone: false, case: { title: 'Mediation file' } },
];

describe('CalendarView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-15T12:00:00.000Z'));
    mocks.role = 'CABINET_ADMIN';
    mocks.calendar.mockReturnValue({ data: events, isLoading: false, isError: false, refetch: mocks.refetch });
    mocks.deleteDeadline.mockResolvedValue(undefined);
  });

  afterEach(() => vi.useRealTimers());

  it('rend le calendrier, navigue entre les mois et ouvre le formulaire', () => {
    render(<CalendarView />);
    expect(screen.getByRole('heading', { name: 'Calendrier' })).toBeInTheDocument();
    expect(screen.getByText('Août 2026')).toBeInTheDocument();
    expect(screen.getAllByText('Contract hearing').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Mois suivant' }));
    expect(screen.getByText('Septembre 2026')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mois précédent' }));
    expect(screen.getByText('Août 2026')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /ajouter/i }));
    expect(screen.getByRole('dialog', { name: 'new event' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close event form' }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });

  it('recherche un événement et saute vers sa journée', () => {
    render(<CalendarView />);
    const search = screen.getByRole('searchbox', { name: 'Rechercher un événement' });
    fireEvent.change(search, { target: { value: 'September' } });
    expect(screen.getByRole('listbox', { name: 'Résultats de recherche' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('option', { name: /September mediation/i }));

    expect(screen.getAllByText('Septembre 2026')).toHaveLength(2);
    expect(screen.getByRole('dialog', { name: /mercredi/i })).toBeInTheDocument();
    expect(search).toHaveValue('');
  });

  it('affiche un résultat vide et permet d’effacer la recherche', () => {
    render(<CalendarView />);
    const search = screen.getByRole('searchbox', { name: 'Rechercher un événement' });
    fireEvent.change(search, { target: { value: 'introuvable' } });
    expect(screen.getByText('Aucun événement trouvé')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Effacer la recherche' }));
    expect(search).toHaveValue('');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('ouvre une journée, protège la suppression par confirmation et actualise les données', async () => {
    render(<CalendarView />);
    fireEvent.click(screen.getByRole('button', { name: '15, 1 échéance' }));
    expect(screen.getByRole('dialog', { name: /samedi/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer Contract hearing' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));
      await Promise.resolve();
    });

    expect(mocks.deleteDeadline).toHaveBeenCalledWith('event-1');
    expect(mocks.refetch).toHaveBeenCalledOnce();
    expect(within(screen.getByRole('dialog', { name: /samedi/i })).queryByText('Contract hearing')).not.toBeInTheDocument();
  });

  it('cache la suppression aux non-administrateurs', () => {
    mocks.role = 'LAWYER';
    render(<CalendarView />);
    fireEvent.click(screen.getByRole('button', { name: '15, 1 échéance' }));
    expect(screen.queryByRole('button', { name: 'Supprimer Contract hearing' })).not.toBeInTheDocument();
  });

  it('affiche les états de chargement, vide et erreur avec relance', () => {
    mocks.calendar.mockReturnValueOnce({ data: undefined, isLoading: true, isError: false, refetch: mocks.refetch });
    const { container, rerender } = render(<CalendarView />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(5);

    mocks.calendar.mockReturnValueOnce({ data: [], isLoading: false, isError: false, refetch: mocks.refetch });
    rerender(<CalendarView />);
    expect(screen.getByText('Aucune échéance en Août')).toBeInTheDocument();

    mocks.calendar.mockReturnValueOnce({ data: undefined, isLoading: false, isError: true, error: { response: { data: { message: 'Service indisponible' } } }, refetch: mocks.refetch });
    rerender(<CalendarView />);
    expect(screen.getByRole('alert')).toHaveTextContent('Service indisponible');
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });
});

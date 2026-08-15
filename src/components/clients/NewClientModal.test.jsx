import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NewClientModal from './NewClientModal';

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  isPending: false,
  cases: [{ id: 'case-1', title: 'Commercial case', status: 'OPEN', clientName: 'Acme' }],
  deadlines: [{ id: 'deadline-1', title: 'Court hearing', dueAt: '2026-08-20', isDone: false, case: { title: 'Acme case' } }],
}));

vi.mock('../../hooks/useClients', () => ({
  useCreateClient: () => ({ mutate: mocks.mutate, isPending: mocks.isPending }),
}));
vi.mock('../../hooks/useCases', () => ({
  useCases: () => ({ data: { cases: mocks.cases } }),
}));
vi.mock('../../hooks/useCalendar', () => ({
  useGlobalDeadlines: () => ({ data: mocks.deadlines }),
}));
vi.mock('sonner', () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}));

describe('NewClientModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isPending = false;
    mocks.cases = [{ id: 'case-1', title: 'Commercial case', status: 'OPEN', clientName: 'Acme' }];
    mocks.deadlines = [{ id: 'deadline-1', title: 'Court hearing', dueAt: '2026-08-20', isDone: false, case: { title: 'Acme case' } }];
  });

  it('ne rend rien lorsqu’il est fermé', () => {
    render(<NewClientModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('valide le nom avant d’envoyer la mutation', () => {
    render(<NewClientModal isOpen onClose={vi.fn()} />);
    fireEvent.submit(screen.getByRole('button', { name: 'Save Client' }).closest('form'));
    expect(mocks.mutate).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledWith('Client name is required (min. 2 characters).');
  });

  it('nettoie les champs optionnels et ferme après succès', () => {
    const onClose = vi.fn();
    mocks.mutate.mockImplementation((_payload, options) => options.onSuccess());
    render(<NewClientModal isOpen onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/Full Name or Company Name/), { target: { value: '  Jean Dupont  ' } });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '+237600000000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Client' }));

    expect(mocks.mutate).toHaveBeenCalledWith(
      { name: 'Jean Dupont', phone: '+237600000000', address: '', type_client: 'physique' },
      expect.any(Object),
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Client added successfully.');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('lie un dossier et restitue une erreur API utile', () => {
    mocks.mutate.mockImplementation((_payload, options) => options.onError({ response: { data: { message: ['Email already used'] } } }));
    render(<NewClientModal isOpen onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Full Name or Company Name/), { target: { value: 'Acme SARL' } });
    fireEvent.click(screen.getByRole('button', { name: /company/i }));
    fireEvent.click(screen.getByRole('button', { name: /link to existing record/i }));
    fireEvent.click(screen.getByRole('button', { name: /select a case/i }));
    fireEvent.click(screen.getByRole('button', { name: /commercial case/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Client' }));

    expect(mocks.mutate.mock.calls[0][0]).toEqual(expect.objectContaining({ name: 'Acme SARL', type_client: 'morale', caseId: 'case-1' }));
    expect(mocks.toastError).toHaveBeenCalledWith('Email already used');
  });

  it('lie un événement futur et envoie tous les champs renseignés', () => {
    mocks.mutate.mockImplementation((_payload, options) => options.onSuccess());
    const onClose = vi.fn();
    render(<NewClientModal isOpen onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/Full Name or Company Name/), { target: { value: 'Jean Test' } });
    fireEvent.change(screen.getByLabelText('Professional Email'), { target: { value: 'jean@lex.test' } });
    fireEvent.change(screen.getByLabelText('Residential or Headquarters Address'), { target: { value: 'Douala' } });
    fireEvent.click(screen.getByRole('button', { name: /link to existing record/i }));
    fireEvent.click(screen.getByRole('button', { name: /select a calendar event/i }));
    fireEvent.click(screen.getByRole('button', { name: /court hearing/i }));
    expect(screen.getByText(/Client will be linked via event/)).toHaveTextContent('Court hearing');
    fireEvent.click(screen.getByRole('button', { name: 'Save Client' }));
    expect(mocks.mutate.mock.calls[0][0]).toEqual(expect.objectContaining({
      name: 'Jean Test', email: 'jean@lex.test', address: 'Douala', deadlineId: 'deadline-1',
    }));
    expect(mocks.mutate.mock.calls[0][0]).not.toHaveProperty('caseId');
  });

  it('filtre, retire les liaisons et ferme d’abord les listes avec Échap', () => {
    const onClose = vi.fn();
    render(<NewClientModal isOpen onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /link to existing record/i }));
    fireEvent.click(screen.getByRole('button', { name: /select a case/i }));
    fireEvent.change(screen.getByPlaceholderText('Search cases…'), { target: { value: 'missing' } });
    expect(screen.getByText('No cases found')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByPlaceholderText('Search cases…')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /select a calendar event/i }));
    fireEvent.change(screen.getByPlaceholderText('Search events…'), { target: { value: 'missing' } });
    expect(screen.getByText('No upcoming events found')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('retire une liaison existante', () => {
    render(<NewClientModal isOpen onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /link to existing record/i }));
    fireEvent.click(screen.getByRole('button', { name: /select a case/i }));
    fireEvent.click(screen.getByRole('button', { name: /commercial case/i }));
    fireEvent.click(screen.getByRole('button', { name: /commercial case/i }));
    fireEvent.click(screen.getByRole('button', { name: '✕ Remove link' }));
    expect(screen.getByRole('button', { name: /select a case/i })).toBeInTheDocument();
  });

  it('affiche l’état de mutation et le message d’erreur générique', () => {
    mocks.isPending = true;
    const { rerender } = render(<NewClientModal isOpen onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Save Client' })).toBeDisabled();
    mocks.isPending = false;
    mocks.mutate.mockImplementation((_payload, options) => options.onError(new Error('offline')));
    rerender(<NewClientModal isOpen onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Full Name or Company Name/), { target: { value: 'Jean' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Save Client' }).closest('form'));
    expect(mocks.toastError).toHaveBeenCalledWith('Could not add the client. Please try again.');
  });
});

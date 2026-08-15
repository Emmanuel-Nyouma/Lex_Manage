import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CaseManagementView from './CaseManagementView';

const mocks = vi.hoisted(() => ({
  casesResult: {},
  caseResult: {},
  routeId: undefined,
  navigate: vi.fn(),
  fetchNextPage: vi.fn(),
  refetch: vi.fn(),
  callGemini: vi.fn(),
}));

vi.mock('../hooks/useCases', () => ({
  useCases: () => mocks.casesResult,
  useCase: () => mocks.caseResult,
}));
vi.mock('../lib/router', () => ({
  useNavigate: () => mocks.navigate,
  useParams: () => ({ id: mocks.routeId }),
}));
vi.mock('../store/useLexStore', () => ({ default: () => ({ callGemini: mocks.callGemini }) }));
vi.mock('./NewCaseDialog', () => ({
  default: ({ isOpen, onClose }) => isOpen ? <button onClick={onClose}>Close new case</button> : null,
}));
vi.mock('./CaseDrawer', () => ({
  default: ({ activeCase, onClose }) => activeCase ? <button onClick={onClose}>Drawer {activeCase.title}</button> : null,
}));

const cases = [
  {
    id: 'case-1', title: 'Alpha matter', clientName: 'Acme', courtName: 'High Court', status: 'OPEN',
    client: { name: 'Acme linked' }, assignee: { firstName: 'Ada', lastName: 'Njou' },
  },
  { id: 'case-2', title: 'Beta matter', clientName: 'Beta Corp', status: 'CLOSED' },
];

describe('CaseManagementView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.routeId = undefined;
    mocks.casesResult = {
      data: { cases }, isLoading: false, error: null,
      fetchNextPage: mocks.fetchNextPage, hasNextPage: true, isFetchingNextPage: false,
      refetch: mocks.refetch,
    };
    mocks.caseResult = { data: null, isLoading: false, error: null };
  });

  it('affiche le squelette pendant le chargement', () => {
    mocks.casesResult = { ...mocks.casesResult, isLoading: true };
    const { container } = render(<CaseManagementView />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it.each([
    [{ response: { status: 401 } }, 'session has expired'],
    [{ response: { status: 403 } }, "don't have permission"],
    [{ message: 'Network Error' }, 'Network issue'],
    [{ message: 'Server unavailable' }, 'Server unavailable'],
  ])('présente une erreur utile et permet de réessayer', (error, message) => {
    mocks.casesResult = { ...mocks.casesResult, error };
    render(<CaseManagementView />);
    expect(screen.getByText(new RegExp(message, 'i'))).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry connection/i }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });

  it('filtre, trie, pagine et ouvre les panneaux métier', () => {
    render(<CaseManagementView />);
    expect(screen.getAllByText('Alpha matter').length).toBeGreaterThan(0);
    expect(screen.getByText('CRM Linked')).toBeInTheDocument();
    expect(screen.getByLabelText('Pagination')).toHaveTextContent('Showing 2 cases');

    fireEvent.click(screen.getByRole('button', { name: /case file/i }));
    fireEvent.click(screen.getByRole('button', { name: /case file/i }));
    fireEvent.click(screen.getByRole('button', { name: /responsible/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Load more cases' }));
    expect(mocks.fetchNextPage).toHaveBeenCalledOnce();

    fireEvent.change(screen.getByPlaceholderText('Search cases, clients...'), { target: { value: 'missing' } });
    expect(screen.getByText('No matches found')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear Search' }));

    fireEvent.click(screen.getByRole('button', { name: 'New Case' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close new case' }));
    fireEvent.click(screen.getAllByText('Alpha matter')[0]);
    expect(screen.getByRole('button', { name: 'Drawer Alpha matter' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Drawer Alpha matter' }));
  });

  it('gère un dossier demandé directement par URL', () => {
    mocks.routeId = 'case-1';
    mocks.caseResult = { data: null, isLoading: true, error: null };
    const { rerender } = render(<CaseManagementView />);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement du dossier');

    mocks.caseResult = { data: null, isLoading: false, error: new Error('forbidden') };
    rerender(<CaseManagementView />);
    expect(screen.getByRole('alert')).toHaveTextContent('Dossier inaccessible');
    fireEvent.click(screen.getByRole('button', { name: 'Retour aux dossiers' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/cases', { replace: true });
  });

  it('affiche un état vide et ouvre la création du premier dossier', () => {
    mocks.casesResult = { ...mocks.casesResult, data: { cases: [] }, hasNextPage: false };
    render(<CaseManagementView />);
    expect(screen.getByText('No cases found')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create first case' }));
    expect(screen.getByRole('button', { name: 'Close new case' })).toBeInTheDocument();
  });
});

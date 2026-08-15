import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ColleaguesView from './ColleaguesView';

const mocks = vi.hoisted(() => ({ result: {}, userId: 'u1' }));
const t = {
  colleagues_title: 'Colleagues', colleagues_subtitle: 'Your firm team', colleagues_search: 'Search colleagues',
  colleagues_filter_all: 'All', colleagues_cases: 'case', colleagues_cases_pl: 'cases',
  colleagues_cases_label: 'Active cases', colleagues_no_cases: 'No assigned case', colleagues_empty: 'No colleague found',
};
vi.mock('../hooks/useTranslation', () => ({ default: () => ({ t, language: 'en' }) }));
vi.mock('../hooks/useCases', () => ({ useColleagues: () => mocks.result }));
vi.mock('../store/useLexStore', () => ({ default: () => ({ currentUser: { id: mocks.userId } }) }));

const manyCases = Array.from({ length: 8 }, (_, index) => ({
  id: `c${index}`, title: `Matter ${index}`, priority: index ? 'MEDIUM' : 'URGENT', status: index ? 'IN_PROGRESS' : 'OPEN',
}));
const colleagues = [
  { id: 'u1', firstName: 'Ada', lastName: 'Njou', email: 'ada@example.com', role: 'CABINET_ADMIN', cases: manyCases },
  { id: 'u2', firstName: 'Bob', lastName: 'Law', email: 'bob@example.com', role: 'LAWYER', cases: [] },
  { id: 'u3', firstName: 'Sam', lastName: 'Unknown', email: 'sam@example.com', role: 'CUSTOM_ROLE', cases: [{ id: 'cx', title: 'Closed', priority: 'NONE', status: 'CUSTOM' }] },
];

describe('ColleaguesView', () => {
  beforeEach(() => { mocks.result = { data: colleagues, isLoading: false, isError: false }; });

  it('affiche, filtre et développe la charge de travail', () => {
    render(<ColleaguesView />);
    expect(screen.getByText('Ada Njou')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('No assigned case')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /Active cases/ })[0]);
    expect(screen.getByText('Matter 0')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search colleagues'), { target: { value: 'bob@example' } });
    expect(screen.queryByText('Ada Njou')).not.toBeInTheDocument();
    expect(screen.getByText('Bob Law')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search colleagues'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lawyer' }));
    expect(screen.queryByText('Ada Njou')).not.toBeInTheDocument();
  });

  it('rend les états chargement, erreur et vide', () => {
    mocks.result = { data: [], isLoading: true, isError: false };
    const { container, rerender } = render(<ColleaguesView />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();

    mocks.result = { data: [], isLoading: false, isError: true };
    rerender(<ColleaguesView />);
    expect(screen.getByText('Failed to load colleagues.')).toBeInTheDocument();

    mocks.result = { data: [], isLoading: false, isError: false };
    rerender(<ColleaguesView />);
    expect(screen.getByText('No colleague found')).toBeInTheDocument();
  });
});

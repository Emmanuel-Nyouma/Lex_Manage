import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardView from './DashboardView';

const mocks = vi.hoisted(() => ({
  dashboard: vi.fn(),
  navigate: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock('../hooks/useDashboardStats', () => ({ useDashboardStats: mocks.dashboard }));
vi.mock('../lib/router', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('../store/useLexStore', () => ({
  default: () => ({ currentUser: { firstName: 'Alice', lastName: 'Ngono' } }),
}));
vi.mock('recharts', () => {
  const Chart = ({ children }) => <div>{children}</div>;
  return {
    AreaChart: Chart, Area: Chart, BarChart: Chart, Bar: Chart, PieChart: Chart,
    Pie: Chart, Cell: Chart, LineChart: Chart, Line: Chart, XAxis: Chart,
    YAxis: Chart, CartesianGrid: Chart, Tooltip: Chart, ResponsiveContainer: Chart,
  };
});

const populatedStats = {
  counts: { activeCases: 12, pendingDeadlines: 3, totalDocuments: 20, totalClients: 8 },
  deltas: { activeCases: 2, pendingDeadlines: -1, totalDocuments: 4, totalClients: 1 },
  byStatus: [
    { name: 'Open', value: 8, color: '#f59e0b' },
    { name: 'Closed', value: 4, color: '#10b981' },
  ],
  byLawyer: [
    { name: 'Alice', cases: 10 },
    { name: 'Bob', cases: 1 },
    { name: 'Chantal', cases: 1 },
  ],
  upcomingDeadlines: [
    { id: 'deadline-1', title: 'Urgent hearing', dueAt: '2026-08-16', priority: 'URGENT', case: { title: 'State v Doe' } },
  ],
  weeklyActivity: [
    { week: 'W1', cases: 1, deadlines: 0 },
    { week: 'W2', cases: 3, deadlines: 2 },
  ],
  recentActivity: [
    {
      id: 'activity-1', action: 'CREATE', entity: 'Case', entityId: 'case-12345678',
      createdAt: '2026-08-15T09:30:00.000Z', user: { firstName: 'Bob', lastName: 'Manga' },
      details: { after: { title: 'New commercial dispute' } },
    },
  ],
};

const emptyStats = {
  counts: { activeCases: 0, pendingDeadlines: 0, totalDocuments: 0, totalClients: 0 },
  deltas: { activeCases: 0, pendingDeadlines: 0, totalDocuments: 0, totalClients: 0 },
  byStatus: [], byLawyer: [], upcomingDeadlines: [], recentActivity: [],
  weeklyActivity: [{ week: 'W1', cases: 0, deadlines: 0 }],
};

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-15T10:00:00.000Z'));
  });

  afterEach(() => vi.useRealTimers());

  it('affiche un squelette pendant le chargement', () => {
    mocks.dashboard.mockReturnValue({ isLoading: true });
    const { container } = render(<DashboardView />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(4);
    expect(screen.queryByText('Active Cases')).not.toBeInTheDocument();
  });

  it('affiche une erreur utile et permet de relancer le chargement', () => {
    mocks.dashboard.mockReturnValue({ isLoading: false, isError: true, refetch: mocks.refetch });
    render(<DashboardView />);
    expect(screen.getByText('Failed to load dashboard data.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });

  it('rend les données, les analyses et les actions de navigation', () => {
    mocks.dashboard.mockReturnValue({ data: populatedStats, isLoading: false, isError: false, refetch: mocks.refetch, isFetching: false });
    render(<DashboardView />);

    expect(screen.getByText(/Good morning/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Alice Ngono' })).toBeInTheDocument();
    expect(screen.getByText('Active Cases')).toBeInTheDocument();
    expect(screen.getByText('Overload Detected')).toBeInTheDocument();
    expect(screen.getByText('1 Deadline Within 7 Days')).toBeInTheDocument();
    expect(screen.getByText('Document Activity Rising')).toBeInTheDocument();
    expect(screen.getByText('New commercial dispute')).toBeInTheDocument();
    expect(screen.getByText('Tomorrow')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Refresh dashboard' }));
    fireEvent.click(screen.getByRole('button', { name: /view all/i }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
    expect(mocks.navigate).toHaveBeenCalledWith('/calendar');
  });

  it('désactive le rafraîchissement pendant une requête', () => {
    mocks.dashboard.mockReturnValue({ data: emptyStats, isLoading: false, isError: false, refetch: mocks.refetch, isFetching: true });
    render(<DashboardView />);
    expect(screen.getByRole('button', { name: 'Refresh dashboard' })).toBeDisabled();
    expect(screen.getByText('Firm Running Smoothly')).toBeInTheDocument();
    expect(screen.getByText('No activity recorded yet')).toBeInTheDocument();
    expect(screen.getByText('No cases yet')).toBeInTheDocument();
    expect(screen.getByText('No upcoming deadlines')).toBeInTheDocument();
    expect(screen.getByText('No workload data')).toBeInTheDocument();
    expect(screen.getByText('No activity yet')).toBeInTheDocument();
  });
});

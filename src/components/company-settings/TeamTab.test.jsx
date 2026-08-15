import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TeamTab from './TeamTab';

const members = [
  { id: 'user-1', firstName: 'Alice', lastName: 'Admin', email: 'alice@example.test', role: 'CABINET_ADMIN', isActive: true, createdAt: '2026-01-10T00:00:00.000Z' },
  { id: 'user-2', firstName: 'Bob', lastName: 'Lawyer', email: 'bob@example.test', phone: '+237600000000', role: 'LAWYER', isActive: true },
  { id: 'user-3', firstName: 'Chantal', lastName: 'Assistant', email: 'chantal@example.test', role: 'ASSISTANT', isActive: false },
];

const renderTab = (overrides = {}) => {
  const props = {
    inactiveCount: 1,
    showInactive: false,
    setShowInactive: vi.fn(),
    activeCount: 2,
    isLoading: false,
    members,
    currentUser: { id: 'user-1' },
    setEditingMember: vi.fn(),
    setConfirmAction: vi.fn(),
    ...overrides,
  };
  return { props, ...render(<TeamTab {...props} />) };
};

describe('TeamTab', () => {
  it('affiche le chargement puis l’état vide', () => {
    const { rerender } = renderTab({ isLoading: true, members: [] });
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    rerender(<TeamTab inactiveCount={0} showInactive={false} setShowInactive={vi.fn()} activeCount={0} isLoading={false} members={[]} currentUser={{ id: 'user-1' }} setEditingMember={vi.fn()} setConfirmAction={vi.fn()} />);
    expect(screen.getByText('No members yet.')).toBeInTheDocument();
  });

  it('rend les membres actifs et protège le compte courant', () => {
    renderTab();
    expect(screen.getAllByText('Alice Admin')).toHaveLength(2);
    expect(screen.getAllByText('Bob Lawyer')).toHaveLength(2);
    expect(screen.queryByText('Chantal Assistant')).not.toBeInTheDocument();
    expect(screen.getAllByText('You')).toHaveLength(2);
    const editButtons = screen.getAllByRole('button', { name: 'Edit role' });
    expect(editButtons.filter((button) => button.disabled)).toHaveLength(2);
  });

  it('demande l’affichage des comptes inactifs', () => {
    const setShowInactive = vi.fn();
    renderTab({ setShowInactive });
    fireEvent.click(screen.getByRole('button', { name: 'Show inactive (1)' }));
    expect(setShowInactive).toHaveBeenCalledOnce();
    expect(setShowInactive.mock.calls[0][0](false)).toBe(true);
  });

  it('ouvre les actions de modification, désactivation et réactivation', () => {
    const setEditingMember = vi.fn();
    const setConfirmAction = vi.fn();
    renderTab({ showInactive: true, setEditingMember, setConfirmAction });

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit role' }).find((button) => !button.disabled));
    expect(setEditingMember).toHaveBeenCalledWith(members[1]);

    fireEvent.click(screen.getAllByRole('button', { name: 'Deactivate member' }).find((button) => !button.disabled));
    expect(setConfirmAction).toHaveBeenCalledWith({ type: 'deactivate', member: members[1] });

    fireEvent.click(screen.getAllByRole('button', { name: 'Reactivate member' })[0]);
    expect(setConfirmAction).toHaveBeenCalledWith({ type: 'reactivate', member: members[2] });
  });
});

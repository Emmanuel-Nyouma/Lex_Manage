import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CompanySettingsView from './CompanySettingsView';

const mocks = vi.hoisted(() => ({
  role: 'CABINET_ADMIN',
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../store/useLexStore', () => ({
  default: () => ({ currentUser: { id: 'user-1', role: mocks.role } }),
}));

vi.mock('../lib/api', () => ({
  default: {
    get: mocks.get,
    post: mocks.post,
    patch: mocks.patch,
    delete: mocks.delete,
  },
}));

vi.mock('./SendNotificationDialog', () => ({
  default: ({ isOpen }) => (isOpen ? <div role="dialog">Notification</div> : null),
}));

describe('CompanySettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.role = 'CABINET_ADMIN';
    mocks.get.mockImplementation(async (path) => {
      if (path === '/tenants/invitations') return { data: [] };
      if (path === '/tenants/members') {
        return {
          data: [{
            id: 'user-1',
            firstName: 'Alice',
            lastName: 'Admin',
            email: 'alice@example.test',
            role: 'CABINET_ADMIN',
            isActive: true,
          }],
        };
      }
      return {
        data: {
          id: 'tenant-1234',
          name: 'Cabinet Demo',
          city: 'Douala',
          country: 'Cameroun',
          _count: { users: 1 },
          roleStats: { lawyers: 0, assistants: 0, secretaries: 0 },
        },
      };
    });
  });

  it('bloque les utilisateurs non administrateurs', () => {
    mocks.role = 'LAWYER';
    render(<CompanySettingsView />);

    expect(screen.getByText('Restricted Access')).toBeInTheDocument();
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it('charge le cabinet et conserve la navigation entre les onglets extraits', async () => {
    render(<CompanySettingsView />);

    expect(await screen.findByText('Cabinet Demo')).toBeInTheDocument();
    expect(screen.getAllByText('Alice Admin')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
    expect(screen.getByText('Invite a member')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Firm Info' }));
    expect(screen.getByText('Firm Logo')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Send Notification/i }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Notification');
  });
});

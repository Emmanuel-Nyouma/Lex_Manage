import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NotificationCenterView from './NotificationCenterView';

const mocks = vi.hoisted(() => ({
  role: 'CABINET_ADMIN',
  get: vi.fn(),
  delete: vi.fn(),
  post: vi.fn(),
}));

vi.mock('../store/useLexStore', () => ({
  default: () => ({ currentUser: { role: mocks.role } }),
}));

vi.mock('../lib/api', () => ({
  default: {
    get: mocks.get,
    delete: mocks.delete,
    post: mocks.post,
  },
}));

vi.mock('../hooks/useCases', () => ({
  useCases: () => ({ data: { cases: [] } }),
}));

vi.mock('./SendNotificationDialog', () => ({
  default: ({ isOpen, preloadTemplate }) => (
    isOpen ? <div role="dialog">Template: {preloadTemplate?.name}</div> : null
  ),
}));

describe('NotificationCenterView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.role = 'CABINET_ADMIN';
    mocks.get.mockImplementation(async (path) => {
      if (path === '/notifications/templates') return { data: [] };
      if (path === '/notifications/scheduled') return { data: [] };
      return { data: [] };
    });
  });

  it('refuse l’accès aux utilisateurs non administrateurs', () => {
    mocks.role = 'LAWYER';
    render(<NotificationCenterView />);

    expect(screen.getByText('Restricted Access')).toBeInTheDocument();
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it('affiche les états vides des trois onglets administrateur', async () => {
    render(<NotificationCenterView />);

    expect(await screen.findByText('No notifications sent yet.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Templates' }));
    expect(await screen.findByText(/No templates yet/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Scheduled' }));
    expect(await screen.findByText(/No scheduled notifications/)).toBeInTheDocument();
    expect(mocks.get).toHaveBeenCalledWith('/notifications/history');
    expect(mocks.get).toHaveBeenCalledWith('/notifications/templates');
    expect(mocks.get).toHaveBeenCalledWith('/notifications/scheduled');
  });

  it('précharge le dialogue d’envoi depuis un template', async () => {
    mocks.get.mockImplementation(async (path) => {
      if (path === '/notifications/templates') {
        return {
          data: [{
            id: 'template-1',
            name: 'Audience urgente',
            level: 'URGENT',
            motif: 'HEARING',
            title: 'Audience',
            message: 'Préparer le dossier.',
            recipientRoles: ['LAWYER'],
          }],
        };
      }
      return { data: [] };
    });

    render(<NotificationCenterView />);
    fireEvent.click(screen.getByRole('button', { name: 'Templates' }));
    await screen.findByText('Audience urgente');
    fireEvent.click(screen.getByRole('button', { name: 'Use' }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveTextContent('Template: Audience urgente');
    });
  });
});

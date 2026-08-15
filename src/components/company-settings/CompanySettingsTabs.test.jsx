import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import InvitationsTab from './InvitationsTab';
import InviteTab from './InviteTab';

describe('Company settings invitation tabs', () => {
  it('affiche le squelette puis l’état vide des invitations', () => {
    const { rerender, container } = render(
      <InvitationsTab isLoading invitations={[]} copyToClipboard={vi.fn()} revokeInvitation={vi.fn()} />,
    );
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
    rerender(<InvitationsTab isLoading={false} invitations={[]} copyToClipboard={vi.fn()} revokeInvitation={vi.fn()} />);
    expect(screen.getByText('No active invitations.')).toBeInTheDocument();
  });

  it('présente les invitations mobile et desktop et déclenche leurs actions', async () => {
    const copy = vi.fn();
    const revoke = vi.fn();
    const user = userEvent.setup();
    render(<InvitationsTab isLoading={false} invitations={[
      { id: 'i1', email: 'lawyer@lex.test', token: 'abcdefgh123456', role: 'LAWYER', expiresAt: '2026-09-01' },
      { id: 'i2', email: 'custom@lex.test', token: 'ijklmnop123456', role: 'CUSTOM_ROLE', expiresAt: '2026-09-02' },
    ]} copyToClipboard={copy} revokeInvitation={revoke} />);
    expect(screen.getAllByText('lawyer@lex.test')).toHaveLength(2);
    expect(screen.getAllByText('CUSTOM ROLE')).toHaveLength(2);
    await user.click(screen.getAllByRole('button', { name: 'Copy invitation link' })[0]);
    await user.click(screen.getAllByRole('button', { name: 'Revoke invitation' })[0]);
    expect(copy).toHaveBeenCalledWith(`${window.location.origin}/login?invitation=abcdefgh123456`);
    expect(revoke).toHaveBeenCalledWith('i1');
  });

  it('édite et soumet le formulaire d’invitation', async () => {
    const setEmail = vi.fn();
    const setRole = vi.fn();
    const submit = vi.fn((event) => event.preventDefault());
    const user = userEvent.setup();
    render(<InviteTab email="" setEmail={setEmail} role="LAWYER" setRole={setRole}
      isInviting={false} handleInvite={submit} lastGeneratedLink="" copyToClipboard={vi.fn()} setActiveTab={vi.fn()} />);
    await user.type(screen.getByLabelText('Professional Email'), 'a@lex.test');
    await user.selectOptions(screen.getByLabelText('Role in the firm'), 'ASSISTANT');
    fireEvent.submit(screen.getByRole('button', { name: 'Generate invitation' }).closest('form'));
    expect(setEmail).toHaveBeenCalled();
    expect(setRole).toHaveBeenCalledWith('ASSISTANT');
    expect(submit).toHaveBeenCalled();
  });

  it('affiche le chargement et les actions du dernier lien généré', async () => {
    const copy = vi.fn();
    const setActiveTab = vi.fn();
    const user = userEvent.setup();
    render(<InviteTab email="a@lex.test" setEmail={vi.fn()} role="LAWYER" setRole={vi.fn()}
      isInviting handleInvite={vi.fn()} lastGeneratedLink="https://lex.test/invite"
      copyToClipboard={copy} setActiveTab={setActiveTab} />);
    expect(screen.getByRole('button', { name: 'Generate invitation' })).toBeDisabled();
    expect(screen.getByDisplayValue('https://lex.test/invite')).toHaveAttribute('readonly');
    await user.click(screen.getByRole('button', { name: 'Copy invitation link' }));
    await user.click(screen.getByRole('button', { name: /View all pending invitations/ }));
    expect(copy).toHaveBeenCalledWith('https://lex.test/invite');
    expect(setActiveTab).toHaveBeenCalledWith('invitations');
  });
});

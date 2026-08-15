import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Breadcrumb } from './Breadcrumb';
import { Breadcrumbs } from './Breadcrumbs';
import { Checkbox } from './Checkbox';
import { FocusTrap } from './FocusTrap';
import { PageSkeleton, Skeleton, SkeletonText } from './Skeleton';
import { Tooltip } from './Tooltip';

vi.stubGlobal('ResizeObserver', class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
});

const route = vi.hoisted(() => ({ pathname: '/dashboard' }));
vi.mock('../../lib/router', () => ({
  useLocation: () => route,
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
}));

describe('core UI components', () => {
  beforeEach(() => {
    route.pathname = '/dashboard';
  });

  it('rend un fil d’Ariane statique avec liens et page courante', () => {
    render(<Breadcrumb items={[
      { label: 'Home', href: '/' },
      { label: 'Clients', href: '/clients' },
      { label: 'Alice', current: true },
    ]} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByText('Alice')).toHaveAttribute('aria-current', 'page');
  });

  it('construit le fil d’Ariane depuis la route et utilise un libellé de repli', () => {
    route.pathname = '/cases/case-42';
    render(<Breadcrumbs />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Case Management' })).toHaveAttribute('href', '/cases');
    expect(screen.getByText('Case-42')).toHaveAttribute('aria-current', 'page');
  });

  it('masque le fil d’Ariane sur la racine et les écrans plein format', () => {
    route.pathname = '/';
    const { rerender } = render(<Breadcrumbs />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    route.pathname = '/lex-assist';
    rerender(<Breadcrumbs />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('rend une case à cocher avec et sans libellé et transmet sa référence', () => {
    const ref = React.createRef();
    const change = vi.fn();
    const { rerender } = render(<Checkbox ref={ref} label="Accept" onChange={change} className="custom" />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Accept' }));
    expect(change).toHaveBeenCalledOnce();
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    rerender(<Checkbox aria-label="Silent choice" />);
    expect(screen.getByRole('checkbox', { name: 'Silent choice' })).toBeInTheDocument();
  });

  it('piège le focus, boucle avec Tab et ferme avec Échap', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    const onClose = vi.fn();
    const { unmount } = render(
      <FocusTrap isActive onClose={onClose}>
        <button>First</button><input aria-label="Middle" /><button>Last</button>
      </FocusTrap>,
    );
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
    screen.getByRole('button', { name: 'Last' }).focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    unmount();
    expect(outside).toHaveFocus();
    outside.remove();
  });

  it('tolère un piège inactif ou sans élément focalisable', () => {
    const { rerender } = render(<FocusTrap isActive={false}><span>Passive</span></FocusTrap>);
    fireEvent.keyDown(document, { key: 'Tab' });
    rerender(<FocusTrap isActive><span>No controls</span></FocusTrap>);
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByText('No controls')).toBeInTheDocument();
  });

  it('rend les squelettes, toutes les variantes et le repli', () => {
    const { container, rerender } = render(<><Skeleton data-testid="one" className="wide" /><SkeletonText lines={2} /></>);
    expect(screen.getByTestId('one')).toHaveClass('wide');
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(4);
    for (const variant of ['content', 'table', 'calendar', 'detail', 'assistant', 'unknown']) {
      rerender(<PageSkeleton variant={variant} className="custom" />);
      expect(screen.getByRole('status', { name: 'Loading' })).toHaveClass('custom');
    }
  });

  it('rend un déclencheur de tooltip professionnel', async () => {
    const user = userEvent.setup();
    render(<Tooltip title="Helpful context"><button>Info</button></Tooltip>);
    const trigger = screen.getByRole('button', { name: 'Info' });
    await user.hover(trigger);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Helpful context');
  });
});

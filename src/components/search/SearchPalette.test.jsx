import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchPalette } from './SearchPalette';

const mocks = vi.hoisted(() => ({ get: vi.fn(), navigate: vi.fn(), close: vi.fn() }));
vi.mock('../../lib/api', () => ({ default: { get: mocks.get } }));
vi.mock('../../lib/router', () => ({ useNavigate: () => mocks.navigate }));

const results = {
  cases: [{ id: 'case-1', title: 'Alpha Case', clientName: 'Acme', caseNumber: 'A-1' }],
  documents: [{ id: 'doc-1', title: 'Contract', fileName: 'contract.pdf' }],
  members: [{ id: 'member-1', firstName: 'Ada', lastName: 'Njou', role: 'CABINET_ADMIN' }],
  clients: [{ id: 'client-1', name: 'Client One', email: 'client@example.com' }],
};

describe('SearchPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mocks.get.mockResolvedValue({ data: results });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => vi.useRealTimers());

  it('ne rend rien quand la palette est fermée', () => {
    const { container } = render(<SearchPalette isOpen={false} onClose={mocks.close} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('recherche et navigue au clavier dans tous les types de résultat', async () => {
    render(<SearchPalette isOpen onClose={mocks.close} />);
    const input = screen.getByPlaceholderText('Rechercher dossiers, documents, équipe...');
    fireEvent.change(input, { target: { value: 'alpha & beta' } });
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    expect(mocks.get).toHaveBeenCalledWith('/search/global?q=alpha%20%26%20beta');
    expect(screen.getByText('Alpha Case')).toBeInTheDocument();
    expect(screen.getByText('Contract')).toBeInTheDocument();
    expect(screen.getByText('Ada Njou')).toBeInTheDocument();
    expect(screen.getByText('Client One')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowDown' });
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(mocks.navigate).toHaveBeenCalledWith('/cases/case-1');
    expect(mocks.close).toHaveBeenCalled();
  });

  it.each([
    ['Alpha Case', '/cases/case-1'],
    ['Contract', '/documents'],
    ['Ada Njou', '/company-settings'],
    ['Client One', '/clients/client-1'],
  ])('navigue depuis le résultat %s', async (name, destination) => {
    render(<SearchPalette isOpen onClose={mocks.close} />);
    fireEvent.change(screen.getByPlaceholderText('Rechercher dossiers, documents, équipe...'), { target: { value: 'al' } });
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    fireEvent.mouseEnter(screen.getByRole('button', { name: new RegExp(name) }));
    fireEvent.click(screen.getByRole('button', { name: new RegExp(name) }));
    expect(mocks.navigate).toHaveBeenCalledWith(destination);
  });

  it('ferme avec Échap, le raccourci ou le bouton', () => {
    render(<SearchPalette isOpen onClose={mocks.close} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    fireEvent.click(screen.getByRole('button', { name: 'Fermer la recherche' }));
    expect(mocks.close).toHaveBeenCalledTimes(3);
  });

  it('affiche un état sans résultat et absorbe une panne de recherche', async () => {
    mocks.get.mockRejectedValue(new Error('offline'));
    render(<SearchPalette isOpen onClose={mocks.close} />);
    const input = screen.getByPlaceholderText('Rechercher dossiers, documents, équipe...');
    fireEvent.change(input, { target: { value: 'zz' } });
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    expect(screen.getByText(/Aucun résultat pour "zz"/)).toBeInTheDocument();
    expect(console.error).toHaveBeenCalledWith('Search error:', expect.any(Error));

    fireEvent.change(input, { target: { value: 'z' } });
    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    expect(screen.getByText(/Tapez au moins 2 caractères/)).toBeInTheDocument();
  });
});

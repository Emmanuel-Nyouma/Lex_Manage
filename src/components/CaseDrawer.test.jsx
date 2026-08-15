import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CaseDrawer from './CaseDrawer';

const mocks = vi.hoisted(() => ({
  user: { id: 'user-1', role: 'LAWYER' },
  deadlines: [],
  loading: false,
  create: vi.fn(),
  mark: vi.fn(),
  refetch: vi.fn(),
  upload: vi.fn(),
  dropOptions: null,
  dragActive: false,
  success: vi.fn(),
  error: vi.fn(),
  keyboard: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('../hooks/useCases', () => ({
  useCases: () => ({ refetch: mocks.refetch }),
  useDeadlines: () => ({ data: mocks.deadlines, isLoading: mocks.loading }),
  useCreateDeadline: () => ({ mutateAsync: mocks.create }),
  useMarkDeadlineDone: () => ({ mutate: mocks.mark }),
}));
vi.mock('react-dropzone', () => ({
  useDropzone: (options) => {
    mocks.dropOptions = options;
    return {
      getRootProps: () => ({ 'data-testid': 'drawer-dropzone' }),
      getInputProps: () => ({ 'data-testid': 'drawer-file-input' }),
      isDragActive: mocks.dragActive,
    };
  },
}));
vi.mock('../lib/documentService', () => ({ uploadLegalDocument: mocks.upload }));
vi.mock('../store/useLexStore', () => ({ default: () => ({ currentUser: mocks.user }) }));
vi.mock('../hooks/useKeyboardNavigation', () => ({ useKeyboardNavigation: mocks.keyboard }));
vi.mock('../lib/router', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }));

const activeCase = {
  id: 'case-1', title: 'Litige Acme', client_name: 'Acme SARL', status: 'Active',
  courtName: 'Tribunal de Douala',
  documents: [{ id: 'doc-1', title: 'Contrat', fileType: 'PDF' }],
};

describe('CaseDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deadlines = [];
    mocks.loading = false;
    mocks.dragActive = false;
    mocks.create.mockResolvedValue({ id: 'deadline-1' });
    mocks.upload.mockResolvedValue({ id: 'doc-2' });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('ne rend rien sans dossier actif', () => {
    const { container } = render(<CaseDrawer activeCase={null} onClose={vi.fn()} onCallGemini={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('affiche le dossier, ses documents et les valeurs de repli', () => {
    const { rerender } = render(<CaseDrawer activeCase={activeCase} onClose={vi.fn()} onCallGemini={vi.fn()} />);
    expect(screen.getByText('Litige Acme')).toBeInTheDocument();
    expect(screen.getByText('Tribunal de Douala', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Contrat')).toBeInTheDocument();

    rerender(<CaseDrawer activeCase={{ ...activeCase, status: 'Closed', courtName: '', documents: [] }} onClose={vi.fn()} onCallGemini={vi.fn()} />);
    expect(screen.getByText('Jurisdiction not defined', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('No documents yet.')).toBeInTheDocument();
  });

  it('ferme par le bouton, le fond, Échap et branche le hook clavier', () => {
    const onClose = vi.fn();
    const { container } = render(<CaseDrawer activeCase={activeCase} onClose={onClose} onCallGemini={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close drawer' }));
    fireEvent.click(container.firstChild);
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onClose).toHaveBeenCalledTimes(3);
    expect(mocks.keyboard).toHaveBeenCalledWith(onClose);
  });

  it('affiche le chargement, l’état vide puis marque seulement une échéance ouverte', () => {
    mocks.loading = true;
    const { rerender, container } = render(<CaseDrawer activeCase={activeCase} onClose={vi.fn()} onCallGemini={vi.fn()} />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();

    mocks.loading = false;
    mocks.deadlines = [];
    rerender(<CaseDrawer activeCase={activeCase} onClose={vi.fn()} onCallGemini={vi.fn()} />);
    expect(screen.getByText('No deadlines scheduled.')).toBeInTheDocument();

    mocks.deadlines = [
      { id: 'd1', title: 'Audience', dueAt: '2026-08-20', isDone: false },
      { id: 'd2', title: 'Dépôt fait', dueAt: '2026-08-21', isDone: true },
    ];
    rerender(<CaseDrawer activeCase={activeCase} onClose={vi.fn()} onCallGemini={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mark deadline as done' }));
    fireEvent.click(screen.getByRole('button', { name: 'Deadline completed' }));
    expect(mocks.mark).toHaveBeenCalledWith('d1');
    expect(mocks.mark).toHaveBeenCalledTimes(1);
  });

  it('ajoute une échéance valide, ignore une soumission vide et permet d’annuler', async () => {
    const user = userEvent.setup();
    const { container } = render(<CaseDrawer activeCase={activeCase} onClose={vi.fn()} onCallGemini={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Add new deadline' }));
    fireEvent.submit(screen.getByPlaceholderText('Deadline title...').closest('form'));
    expect(mocks.create).not.toHaveBeenCalled();
    await user.type(screen.getByPlaceholderText('Deadline title...'), 'Audience');
    fireEvent.change(container.querySelector('input[type="date"]'), { target: { value: '2026-08-20' } });
    await user.click(screen.getByRole('button', { name: 'OK' }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledWith({
      title: 'Audience', dueAt: '2026-08-20', priority: 'MEDIUM',
    }));
    expect(screen.queryByPlaceholderText('Deadline title...')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add new deadline' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByPlaceholderText('Deadline title...')).not.toBeInTheDocument();
  });

  it('génère une stratégie assainie et un brouillon copiable', async () => {
    const ai = vi.fn().mockResolvedValueOnce('<strong>Strategy</strong><script>bad()</script>')
      .mockResolvedValueOnce('Bonjour client');
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const { container } = render(<CaseDrawer activeCase={activeCase} onClose={vi.fn()} onCallGemini={ai} />);
    await user.click(screen.getByRole('button', { name: 'Strategy' }));
    await waitFor(() => expect(container.querySelector('strong')).toHaveTextContent('Strategy'));
    expect(container.querySelector('script')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Draft Email' }));
    expect(await screen.findByText('Bonjour client')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Copy to clipboard' }));
    expect(writeText).toHaveBeenCalledWith('Bonjour client');
    expect(mocks.success).toHaveBeenCalledWith('Brouillon copié dans le presse-papiers.');
  });

  it.each([
    ['Strategy', 'Impossible de générer la stratégie pour le moment.'],
    ['Draft Email', 'Impossible de générer l’e-mail pour le moment.'],
  ])('récupère après un échec IA de %s', async (button, message) => {
    const user = userEvent.setup();
    render(<CaseDrawer activeCase={activeCase} onClose={vi.fn()} onCallGemini={vi.fn().mockRejectedValue(new Error('offline'))} />);
    await user.click(screen.getByRole('button', { name: button }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith(message));
    expect(screen.getByRole('button', { name: button })).toBeEnabled();
  });

  it('signale un échec de copie', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<CaseDrawer activeCase={activeCase} onClose={vi.fn()} onCallGemini={vi.fn().mockResolvedValue('Brouillon')} />);
    await user.click(screen.getByRole('button', { name: 'Draft Email' }));
    await user.click(await screen.findByRole('button', { name: 'Copy to clipboard' }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Impossible de copier le brouillon.'));
  });

  it('importe les documents, rafraîchit le dossier et gère les erreurs', async () => {
    render(<CaseDrawer activeCase={activeCase} onClose={vi.fn()} onCallGemini={vi.fn()} />);
    const files = [new File(['a'], 'a.pdf'), new File(['b'], 'b.pdf')];
    await act(async () => mocks.dropOptions.onDrop(files));
    expect(mocks.upload).toHaveBeenNthCalledWith(1, files[0], mocks.user, 'Pièces', 'case-1');
    expect(mocks.success).toHaveBeenCalledWith('2 document(s) importés');
    expect(mocks.refetch).toHaveBeenCalledOnce();

    mocks.upload.mockRejectedValue(new Error('offline'));
    await act(async () => mocks.dropOptions.onDrop([files[0]]));
    expect(mocks.error).toHaveBeenCalledWith("Échec de l'upload");
    await act(async () => mocks.dropOptions.onDrop([]));
    expect(mocks.upload).toHaveBeenCalledTimes(3);
  });

  it('ignore le drop sans id et affiche l’état glisser', async () => {
    mocks.dragActive = true;
    render(<CaseDrawer activeCase={{ ...activeCase, id: undefined }} onClose={vi.fn()} onCallGemini={vi.fn()} />);
    expect(screen.getByText('Déposer pour uploader')).toBeInTheDocument();
    await act(async () => mocks.dropOptions.onDrop([new File(['x'], 'x.pdf')]));
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it('ouvre la route complète du dossier', async () => {
    const user = userEvent.setup();
    render(<CaseDrawer activeCase={activeCase} onClose={vi.fn()} onCallGemini={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Open full case' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/cases/case-1');
  });
});

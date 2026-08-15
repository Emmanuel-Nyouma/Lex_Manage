import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AiAssistantView from './AiAssistantView';

const mocks = vi.hoisted(() => ({
  conversations: [],
  loading: false,
  create: vi.fn(), get: vi.fn(), send: vi.fn(), remove: vi.fn(),
  invalidate: vi.fn(), success: vi.fn(), error: vi.fn(),
}));

const t = {
  greeting_morning: 'Good morning', greeting_afternoon: 'Good afternoon', greeting_evening: 'Good evening',
  you: 'You', copy: 'Copy', new_conversation: 'New conversation', history: 'History',
  no_conversation: 'No conversations', messages_count: 'message', messages_count_pl: 'messages', delete: 'Delete',
  cant_load_conv: 'Cannot load conversation', ai_error: 'AI unavailable', cant_delete: 'Cannot delete',
  conv_deleted: 'Conversation deleted', rag_mode: 'Secure RAG', new_chat_btn: 'New chat',
  lexassist_subtitle: 'Ask about your legal work', prompt_summarize: 'Summarize a document',
  prompt_clause: 'Analyze a clause', prompt_deadlines: 'Find deadlines', prompt_risks: 'Identify risks',
  analyzing: 'Analyzing', lexassist_thinking: 'Thinking', ask_legal_question: 'Ask a legal question',
  lexassist_disclaimer: 'Verify important legal information.',
};

vi.mock('../store/useLexStore', () => ({ default: () => ({ currentUser: { firstName: 'Ada', lastName: 'Njou' } }) }));
vi.mock('../hooks/useTranslation', () => ({ default: () => ({ t, language: 'en' }) }));
vi.mock('../hooks/useChat', () => ({
  useConversations: () => ({ data: mocks.conversations, isLoading: mocks.loading }),
  chatApi: { create: mocks.create, get: mocks.get, send: mocks.send, remove: mocks.remove },
}));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: mocks.invalidate }) }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }));

describe('AiAssistantView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.conversations = [];
    mocks.loading = false;
    mocks.create.mockResolvedValue({ id: 'conv-new' });
    mocks.send.mockResolvedValue({ message: 'A concise answer' });
    mocks.remove.mockResolvedValue(undefined);
    Element.prototype.scrollIntoView = vi.fn();
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  afterEach(() => vi.useRealTimers());

  it('affiche l’accueil et envoie une suggestion dans une nouvelle conversation', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-08-15T08:00:00'));
    render(<AiAssistantView />);
    expect(screen.getByRole('heading', { name: 'Good morning, Ada Njou' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Summarize a document/ }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
    expect(mocks.send).toHaveBeenCalledWith('conv-new', 'Summarize a document');
    expect(mocks.invalidate).toHaveBeenCalledWith({ queryKey: ['chat-conversations'] });
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(screen.getByText('A concise answer')).toBeInTheDocument();
  });

  it('ouvre une conversation, copie une réponse et démarre un nouveau chat', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mocks.conversations = [{ id: 'conv-1', title: 'Contract review', updatedAt: '2026-08-14', _count: { messages: 2 } }];
    mocks.get.mockResolvedValue({ messages: [
      { id: 'm1', role: 'user', content: 'Question' },
      { id: 'm2', role: 'assistant', content: 'Existing answer' },
    ] });
    render(<AiAssistantView />);
    fireEvent.click(screen.getByRole('button', { name: 'History: Contract review' }));
    await waitFor(() => expect(screen.getByText('Existing answer')).toBeInTheDocument());
    fireEvent.click(screen.getByTitle('Copy'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Existing answer');
    fireEvent.click(screen.getByRole('button', { name: /New chat/ }));
    expect(screen.getByText('Ask about your legal work')).toBeInTheDocument();
  });

  it('envoie une question avec Entrée et affiche une réponse de secours en erreur', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mocks.send.mockRejectedValue(new Error('offline'));
    render(<AiAssistantView />);
    const input = screen.getByPlaceholderText('Ask a legal question');
    fireEvent.change(input, { target: { value: 'What are the risks?' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
    await waitFor(() => expect(mocks.send).toHaveBeenCalledWith('conv-new', 'What are the risks?'));
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(screen.getByText('AI unavailable')).toBeInTheDocument();
  });

  it('charge et supprime une conversation avec retours utilisateur', async () => {
    mocks.conversations = [{ id: 'conv-1', title: 'One message', updatedAt: '2026-08-14', _count: { messages: 1 } }];
    mocks.get.mockRejectedValueOnce(new Error('offline'));
    render(<AiAssistantView />);
    fireEvent.click(screen.getByRole('button', { name: 'History: One message' }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Cannot load conversation'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete: One message' }));
    await waitFor(() => expect(mocks.success).toHaveBeenCalledWith('Conversation deleted'));
  });

  it('signale un échec de suppression et affiche le squelette d’historique', async () => {
    mocks.loading = true;
    const { container, rerender } = render(<AiAssistantView />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);

    mocks.loading = false;
    mocks.conversations = [{ id: 'conv-1', title: 'Blocked', updatedAt: '2026-08-14', _count: {} }];
    mocks.remove.mockRejectedValue(new Error('forbidden'));
    rerender(<AiAssistantView />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete: Blocked' }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Cannot delete'));
  });
});

import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useClients, useClient, useCreateClient, useDeleteClient, useUpdateClient } from './useClients';
import { useCase, useCases, useColleagues, useCreateCase, useCreateDeadline, useDeadlines, useDeleteCase, useDeleteDeadline, useMarkDeadlineDone } from './useCases';
import { useDeleteDocument, useDocuments, useFirmMembers } from './useDocuments';
import { useGlobalDeadlines } from './useCalendar';
import { useDashboardStats } from './useDashboardStats';
import { chatApi, useConversations } from './useChat';
import { useUpdateProfile } from './useProfile';
import { useIngestToLexAssist } from './useIngestToLexAssist';

const mocks = vi.hoisted(() => ({
  get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(),
  success: vi.fn(), error: vi.fn(),
}));

vi.mock('../lib/api', () => ({ default: { get: mocks.get, post: mocks.post, patch: mocks.patch, delete: mocks.delete } }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }));

const createHarness = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  return { queryClient, wrapper };
};

describe('React Query data hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockImplementation(async (path) => {
      if (path === '/clients') return { data: [{ id: 'client-1', name: 'Acme' }] };
      if (path === '/clients/client-1') return { data: { id: 'client-1', name: 'Acme' } };
      if (path.startsWith('/cases?')) return { data: { data: [{ id: 'case-1' }], meta: { nextCursor: null, hasMore: false } } };
      if (path === '/cases/case-1') return { data: { id: 'case-1', title: 'Matter' } };
      if (path === '/cases/case-1/deadlines') return { data: [{ id: 'deadline-1' }] };
      if (path.startsWith('/documents?')) return { data: { data: [{ id: 'doc-1' }], meta: { nextCursor: null, hasMore: false } } };
      if (path === '/users') return { data: [{ id: 'user-1' }] };
      if (path === '/users/colleagues') return { data: [{ id: 'user-2' }] };
      if (path === '/calendar/deadlines') return { data: [{ id: 'deadline-1' }] };
      if (path === '/stats/dashboard') return { data: { counts: {} } };
      if (path === '/chat/conversations') return { data: [{ id: 'conversation-1' }] };
      if (path === '/chat/conversations/conversation-1') return { data: { id: 'conversation-1' } };
      throw new Error(`Unexpected GET ${path}`);
    });
    mocks.post.mockResolvedValue({ data: { id: 'created', success: true, message: 'Done' } });
    mocks.patch.mockResolvedValue({ data: { id: 'updated' } });
    mocks.delete.mockResolvedValue({ data: { deleted: true } });
  });

  it('charge les clients et un client individuel', async () => {
    const { wrapper } = createHarness();
    const list = renderHook(() => useClients(), { wrapper });
    const detail = renderHook(() => useClient('client-1'), { wrapper });
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(detail.result.current.isSuccess).toBe(true));
    expect(list.result.current.data[0].name).toBe('Acme');
    expect(detail.result.current.data.id).toBe('client-1');
  });

  it('charge les dossiers, échéances et documents paginés', async () => {
    const { wrapper } = createHarness();
    const cases = renderHook(() => useCases(25), { wrapper });
    const matter = renderHook(() => useCase('case-1'), { wrapper });
    const deadlines = renderHook(() => useDeadlines('case-1'), { wrapper });
    const documents = renderHook(() => useDocuments(20, 'CONTRACT', 'case-1', ' evidence '), { wrapper });
    await waitFor(() => expect(cases.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(matter.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(deadlines.result.current.isSuccess).toBe(true));
    await waitFor(() => expect(documents.result.current.isSuccess).toBe(true));
    expect(cases.result.current.data).toEqual({ cases: [{ id: 'case-1' }], hasMore: false });
    expect(documents.result.current.data).toEqual({ documents: [{ id: 'doc-1' }], hasMore: false });
    expect(mocks.get).toHaveBeenCalledWith(expect.stringContaining('caseId=case-1'));
    expect(mocks.get).toHaveBeenCalledWith(expect.stringContaining('q=evidence'));
  });

  it('charge les tableaux de bord, calendrier, équipe, collègues et conversations', async () => {
    const { wrapper } = createHarness();
    const hooks = [
      renderHook(() => useGlobalDeadlines(), { wrapper }),
      renderHook(() => useDashboardStats(), { wrapper }),
      renderHook(() => useFirmMembers(), { wrapper }),
      renderHook(() => useColleagues(), { wrapper }),
      renderHook(() => useConversations(), { wrapper }),
    ];
    await Promise.all(hooks.map(({ result }) => waitFor(() => expect(result.current.isSuccess).toBe(true))));
    expect(mocks.get).toHaveBeenCalledWith('/calendar/deadlines');
    expect(mocks.get).toHaveBeenCalledWith('/stats/dashboard');
    expect(mocks.get).toHaveBeenCalledWith('/users/colleagues');
  });

  it('applique et confirme les mutations optimistes des clients', async () => {
    const { queryClient, wrapper } = createHarness();
    queryClient.setQueryData(['clients'], [{ id: 'client-1', name: 'Acme' }]);
    const create = renderHook(() => useCreateClient(), { wrapper });
    const update = renderHook(() => useUpdateClient(), { wrapper });
    const remove = renderHook(() => useDeleteClient(), { wrapper });

    await act(() => create.result.current.mutateAsync({ name: 'Beta' }));
    await act(() => update.result.current.mutateAsync({ id: 'client-1', name: 'Acme Updated' }));
    await act(() => remove.result.current.mutateAsync('client-1'));

    expect(mocks.post).toHaveBeenCalledWith('/clients', { name: 'Beta' });
    expect(mocks.patch).toHaveBeenCalledWith('/clients/client-1', { name: 'Acme Updated' });
    expect(mocks.delete).toHaveBeenCalledWith('/clients/client-1');
    expect(mocks.success).toHaveBeenCalledTimes(3);
  });

  it('restaure les clients après une erreur de mutation', async () => {
    const { queryClient, wrapper } = createHarness();
    queryClient.setQueryData(['clients'], [{ id: 'client-1', name: 'Acme' }]);
    mocks.delete.mockRejectedValueOnce({ response: { data: { message: 'Client linked to a case' } } });
    const remove = renderHook(() => useDeleteClient(), { wrapper });
    await act(async () => { await expect(remove.result.current.mutateAsync('client-1')).rejects.toBeDefined(); });
    expect(queryClient.getQueryData(['clients'])).toEqual([{ id: 'client-1', name: 'Acme' }]);
    expect(mocks.error).toHaveBeenCalledWith('Client linked to a case');
  });

  it('exécute les mutations dossiers, échéances, documents, profil et ingestion', async () => {
    const { wrapper } = createHarness();
    const createCase = renderHook(() => useCreateCase(), { wrapper });
    const deleteCase = renderHook(() => useDeleteCase(), { wrapper });
    const createDeadline = renderHook(() => useCreateDeadline('case-1'), { wrapper });
    const done = renderHook(() => useMarkDeadlineDone('case-1'), { wrapper });
    const deleteDeadline = renderHook(() => useDeleteDeadline(null), { wrapper });
    const deleteDocument = renderHook(() => useDeleteDocument(), { wrapper });
    const profile = renderHook(() => useUpdateProfile(), { wrapper });
    const ingest = renderHook(() => useIngestToLexAssist(), { wrapper });

    await act(() => createCase.result.current.mutateAsync({ title: 'Matter' }));
    await act(() => deleteCase.result.current.mutateAsync('case-1'));
    await act(() => createDeadline.result.current.mutateAsync({ title: 'Hearing' }));
    await act(() => done.result.current.mutateAsync('deadline-1'));
    await act(() => deleteDeadline.result.current.mutateAsync('deadline-1'));
    await act(() => deleteDocument.result.current.mutateAsync('doc-1'));
    await act(() => profile.result.current.mutateAsync({ firstName: 'Alice' }));
    await act(() => ingest.result.current.mutateAsync('doc-1'));

    expect(mocks.post).toHaveBeenCalledWith('/cases/case-1/deadlines', { title: 'Hearing' });
    expect(mocks.delete).toHaveBeenCalledWith('/cases/none/deadlines/deadline-1');
    expect(mocks.patch).toHaveBeenCalledWith('/auth/profile', { firstName: 'Alice' });
    expect(mocks.success).toHaveBeenCalled();
  });

  it('expose les opérations directes de conversation', async () => {
    await expect(chatApi.create()).resolves.toEqual({ id: 'created', success: true, message: 'Done' });
    await expect(chatApi.get('conversation-1')).resolves.toEqual({ id: 'conversation-1' });
    await chatApi.send('conversation-1', 'Bonjour', 'request-1');
    await chatApi.remove('conversation-1');
    expect(mocks.post).toHaveBeenCalledWith('/chat/conversations/conversation-1/messages', { message: 'Bonjour', requestId: 'request-1' });
    expect(mocks.delete).toHaveBeenCalledWith('/chat/conversations/conversation-1');
  });
});

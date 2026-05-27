'use client';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Send, Bot, User, Plus, Loader2, Trash2, BookOpen, Quote } from 'lucide-react';

interface Source {
  documentId: string;
  text: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

export default function DashboardChatPage() {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [openSourcesId, setOpenSourcesId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/chat/conversations').then(r => r.data),
  });

  const { data: activeConv, isLoading: loadingConv } = useQuery({
    queryKey: ['conversation', activeId],
    queryFn: () => api.get(`/chat/conversations/${activeId}`).then(r => r.data),
    enabled: !!activeId,
  });

  const createConv = useMutation({
    mutationFn: () => api.post('/chat/conversations').then(r => r.data),
    onSuccess: (data) => {
      setActiveId(data.id);
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const sendMsg = useMutation({
    mutationFn: (msg: string) =>
      api.post(`/chat/conversations/${activeId}/messages`, { message: msg }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation', activeId] });
      setMessage('');
    },
    onError: () => toast.error('Erreur de communication avec LexAssist'),
  });

  const deleteConv = useMutation({
    mutationFn: (id: string) => api.delete(`/chat/conversations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      if (activeId) setActiveId(null);
      toast.success('Conversation supprimée');
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv, sendMsg.isPending]);

  const handleSend = () => {
    if (!message.trim() || !activeId || sendMsg.isPending) return;
    sendMsg.mutate(message);
  };

  return (
    <div className="flex h-full bg-slate-950">
      {/* Thread list sidebar */}
      <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800">
          <button
            onClick={() => createConv.mutate()}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl py-3 px-4 text-sm transition-all shadow-lg shadow-amber-500/10 active:scale-[0.98]"
          >
            <Plus size={16} /> Nouvelle conversation
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {conversations.map((c: any) => (
            <div
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`group flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all border ${
                activeId === c.id
                  ? 'bg-amber-500/10 border-amber-500/30 text-white'
                  : 'border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-white'
              }`}
            >
              <div className="truncate flex-1">
                <p className="text-sm font-semibold truncate leading-snug">
                  {c.title === 'Nouvelle conversation' ? 'Nouvelle consultation' : c.title}
                </p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <Bot size={12} className="text-amber-500/60" /> {c._count?.messages ?? 0} message(s)
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConv.mutate(c.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="text-center py-16 text-slate-600 px-4">
              <Bot size={28} className="mx-auto text-slate-700 mb-3 animate-pulse" />
              <p className="text-sm font-medium">Aucune conversation active</p>
              <p className="text-xs text-slate-500 mt-1">Cliquez ci-dessus pour lancer LexAssist.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main chat viewport */}
      <section className="flex-1 flex flex-col h-full overflow-hidden">
        {!activeId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 shadow-2xl shadow-amber-500/5">
              <Bot size={40} className="text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">LexAssist IA</h2>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
              Votre assistant juridique augmenté. Posez vos questions et LexAssist scannera vos dossiers, vos pièces, et les documents du cabinet pour vous apporter des réponses sourcées.
            </p>
            <button
              onClick={() => createConv.mutate()}
              className="mt-8 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl py-3 px-8 text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
            >
              Lancer la consultation
            </button>
          </div>
        ) : (
          <>
            {/* Thread messages container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950 custom-scrollbar">
              {loadingConv ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 size={32} className="animate-spin text-amber-500" />
                </div>
              ) : (
                activeConv?.messages?.map((msg: Message) => (
                  <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                        msg.role === 'user'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-900 border border-slate-800'
                      }`}
                    >
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} className="text-amber-500" />}
                    </div>

                    <div className="max-w-2xl space-y-2">
                      <div
                        className={`px-5 py-4 rounded-2xl text-sm leading-relaxed shadow-lg ${
                          msg.role === 'user'
                            ? 'bg-amber-500 text-slate-950 font-semibold'
                            : 'bg-slate-900 border border-slate-850 text-slate-100'
                        }`}
                      >
                        {msg.content}
                      </div>

                      {/* Display RAG sources for AI answers */}
                      {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                        <div className="ml-1">
                          <button
                            onClick={() => setOpenSourcesId(openSourcesId === msg.id ? null : msg.id)}
                            className="text-xs text-amber-500/80 hover:text-amber-400 flex items-center gap-1.5 font-medium transition-colors focus:outline-none"
                          >
                            <BookOpen size={12} />
                            {openSourcesId === msg.id ? 'Masquer les sources' : `Afficher les sources (${msg.sources.length})`}
                          </button>

                          {openSourcesId === msg.id && (
                            <div className="mt-2 space-y-2 border-l-2 border-amber-500/30 pl-3 py-1">
                              {msg.sources.map((src, sIdx) => (
                                <div key={sIdx} className="bg-slate-900/60 rounded-xl p-3 border border-slate-850">
                                  <div className="flex items-center gap-1.5 text-xs text-amber-500/60 font-semibold mb-1">
                                    <Quote size={10} /> Extrait de pièce #{sIdx + 1}
                                  </div>
                                  <p className="text-xs text-slate-400 italic leading-relaxed">
                                    "{src.text}"
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {sendMsg.isPending && (
                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <Bot size={16} className="text-amber-500" />
                  </div>
                  <div className="bg-slate-900 border border-slate-850 px-5 py-4 rounded-2xl flex items-center gap-3 shadow-lg">
                    <Loader2 size={16} className="animate-spin text-amber-500" />
                    <span className="text-sm text-slate-400 font-medium">LexAssist parcourt vos dossiers...</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Prompt submission form */}
            <div className="p-4 bg-slate-900/40 border-t border-slate-800">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-2.5 focus-within:border-amber-500/40 focus-within:ring-1 focus-within:ring-amber-500/20 transition-all shadow-inner">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Posez une question juridique, formulez une stratégie ou interrogez vos pièces..."
                    rows={1}
                    className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm resize-none outline-none px-3 py-2.5 min-h-[40px] max-h-[160px] custom-scrollbar"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!message.trim() || sendMsg.isPending}
                    className="w-11 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:hover:bg-amber-500 text-slate-950 flex items-center justify-center transition-all shrink-0 active:scale-[0.95]"
                  >
                    <Send size={16} />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 text-center mt-2.5 leading-snug">
                  LexAssist formule ses consultations sur la base de vos fichiers indexés dans l'espace sécurisé du cabinet.
                </p>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

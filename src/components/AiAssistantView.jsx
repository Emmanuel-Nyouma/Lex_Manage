import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot, Send, Loader2, Sparkles, FileText, Scale, Info,
  Plus, ShieldCheck, Copy, Check, User, MessageSquare, Trash2, Menu, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import useLexStore from '../store/useLexStore';
import { useConversations, chatApi } from '../hooks/useChat';

const SUGGESTED_PROMPTS = [
  { label: 'Résumer un dossier en cours', icon: FileText },
  { label: 'Rédiger une clause de confidentialité', icon: Scale },
  { label: 'Vérifier les délais procéduraux à venir', icon: Info },
  { label: 'Analyser les risques d\'une affaire', icon: Sparkles },
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

const shortDate = (d) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

/* ─── Typewriter hook: reveals text progressively ────────────────────────── */
const useTypewriter = (text, enabled, onTick) => {
  const [displayed, setDisplayed] = useState(enabled ? '' : text);
  const [done, setDone] = useState(!enabled);

  useEffect(() => {
    if (!enabled) { setDisplayed(text); setDone(true); return; }
    setDisplayed('');
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setDisplayed(text.slice(0, i));
      onTick?.();
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
      }
    }, 14);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, enabled]);

  return { displayed, done };
};

/* ─── Reusable animated bot avatar ───────────────────────────────────────── */
const SIZES = { sm: 'w-9 h-9', md: 'w-10 h-10', lg: 'w-16 h-16' };
const ICON = { sm: 16, md: 22, lg: 30 };

const BotAvatar = ({ size = 'sm', pulse = false, online = false }) => (
  <div className="relative flex-shrink-0">
    {pulse && <span className="absolute inset-0 rounded-xl bg-amber-500/40 animate-ping" />}
    <div className={`relative ${SIZES[size]} rounded-xl bg-gradient-to-tr from-amber-500 via-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/25 ring-1 ring-white/20`}>
      <Bot size={ICON[size]} />
    </div>
    {online && (
      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
    )}
  </div>
);

/* ─── Single message bubble ──────────────────────────────────────────────── */
const MessageBubble = ({ msg, onTick }) => {
  const isUser = msg.sender === 'user';
  const [copied, setCopied] = useState(false);

  const { displayed, done } = useTypewriter(msg.text, !isUser && !!msg.animate, onTick);
  const shown = isUser ? msg.text : displayed;

  const copy = () => {
    navigator.clipboard.writeText(msg.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-3 duration-400`}>
      {isUser ? (
        <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          <User size={16} />
        </div>
      ) : (
        <BotAvatar size="sm" />
      )}

      <div className={`max-w-[80%] sm:max-w-[70%] group ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-5 py-3.5 text-[14px] leading-relaxed shadow-sm whitespace-pre-line ${
          isUser
            ? 'bg-slate-900 dark:bg-amber-600 text-white rounded-tr-md'
            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-md'
        }`}>
          {shown}
          {!isUser && !done && (
            <span className="inline-block w-[2px] h-[1em] -mb-[2px] ml-0.5 bg-amber-500 animate-pulse align-middle" />
          )}
        </div>
        <div className={`flex items-center gap-2 mt-1.5 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            {isUser ? 'Vous' : 'LexAssist'}
          </span>
          {!isUser && done && (
            <button
              onClick={copy}
              className="text-slate-400 hover:text-amber-500 transition-colors opacity-0 group-hover:opacity-100"
              title="Copier"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Conversation history sidebar ───────────────────────────────────────── */
const HistorySidebar = ({ conversations, loading, activeId, onSelect, onNew, onDelete, open, onClose }) => (
  <>
    {/* Mobile overlay */}
    {open && <div className="md:hidden fixed inset-0 bg-slate-900/50 z-30" onClick={onClose} />}

    <aside className={`
      absolute md:relative inset-y-0 left-0 z-40 w-72 flex-shrink-0 flex flex-col
      bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800
      transition-transform duration-300 md:translate-x-0
      ${open ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="p-3 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 dark:bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-amber-700 transition-all shadow-sm"
        >
          <Plus size={16} /> Nouvelle conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">
          Historique
        </p>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-amber-500" size={20} /></div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-10 px-4">
            <MessageSquare className="mx-auto mb-2 text-slate-300 dark:text-slate-700" size={28} />
            <p className="text-xs text-slate-400 italic">Aucune conversation</p>
          </div>
        ) : (
          conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`w-full group flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                activeId === c.id
                  ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'hover:bg-white/60 dark:hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <MessageSquare size={15} className={activeId === c.id ? 'text-amber-500' : 'text-slate-400'} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{c.title}</p>
                <p className="text-[10px] text-slate-400">
                  {c._count?.messages ?? 0} message{(c._count?.messages ?? 0) > 1 ? 's' : ''} · {shortDate(c.updatedAt)}
                </p>
              </div>
              <span
                onClick={(e) => onDelete(e, c.id)}
                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                title="Supprimer"
              >
                <Trash2 size={13} />
              </span>
            </button>
          ))
        )}
      </div>
    </aside>
  </>
);

/* ════════════════════════════════════════════════════════════════════════ */
const AiAssistantView = () => {
  const { currentUser } = useLexStore();
  const queryClient = useQueryClient();
  const { data: conversations = [], isLoading: loadingList } = useConversations();

  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const endRef = useRef(null);

  const firstName = currentUser?.firstName || 'Maître';
  const isEmpty = messages.length === 0;
  const activeTitle = conversations.find((c) => c.id === activeId)?.title;

  const scrollToEnd = useCallback(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), []);
  useEffect(() => { scrollToEnd(); }, [messages, isSending, scrollToEnd]);

  const refreshList = () => queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });

  const openConversation = async (id) => {
    setSidebarOpen(false);
    if (id === activeId) return;
    setActiveId(id);
    setLoadingConv(true);
    try {
      const conv = await chatApi.get(id);
      setMessages((conv.messages || []).map((m) => ({
        id: m.id,
        sender: m.role === 'assistant' ? 'ai' : 'user',
        text: m.content,
        animate: false,
      })));
    } catch {
      toast.error('Impossible de charger la conversation');
    } finally {
      setLoadingConv(false);
    }
  };

  const newChat = () => {
    setActiveId(null);
    setMessages([]);
    setInput('');
    setSidebarOpen(false);
  };

  const handleSend = useCallback(async (text) => {
    const messageText = typeof text === 'string' ? text : input;
    if (!messageText.trim() || isSending) return;

    setInput('');
    setIsSending(true);
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, sender: 'user', text: messageText }]);

    try {
      let convId = activeId;
      if (!convId) {
        const conv = await chatApi.create();
        convId = conv.id;
        setActiveId(convId);
      }
      const res = await chatApi.send(convId, messageText);
      setMessages((prev) => [...prev, {
        id: `a-${Date.now()}`,
        sender: 'ai',
        text: res.message || "Je suis désolé, une erreur est survenue.",
        animate: true,
      }]);
      refreshList();
    } catch {
      setMessages((prev) => [...prev, {
        id: `e-${Date.now()}`,
        sender: 'ai',
        text: "Une erreur est survenue lors de la communication avec l'IA. Veuillez réessayer.",
        animate: true,
      }]);
    } finally {
      setIsSending(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, isSending, activeId]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await chatApi.remove(id);
      if (id === activeId) newChat();
      refreshList();
      toast.success('Conversation supprimée');
    } catch {
      toast.error('Suppression impossible');
    }
  };

  return (
    <div className="h-full flex -mx-4 -my-4 sm:-mx-6 sm:-my-6 relative overflow-hidden">

      {/* History */}
      <HistorySidebar
        conversations={conversations}
        loading={loadingList}
        activeId={activeId}
        onSelect={openConversation}
        onNew={newChat}
        onDelete={handleDelete}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Chat pane */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              aria-label="Historique"
            >
              <Menu size={20} />
            </button>
            <BotAvatar size="md" online />
            <div className="min-w-0">
              <h1 className="font-black text-slate-900 dark:text-white tracking-tight truncate">
                {activeTitle || 'LexAssist AI'}
              </h1>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck size={11} /> Mode RAG sécurisé
              </span>
            </div>
          </div>
          {!isEmpty && (
            <button
              onClick={newChat}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <Plus size={16} /> <span className="hidden sm:inline">Nouvelle</span>
            </button>
          )}
        </div>

        {/* Messages / empty state */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/40">
          {loadingConv ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-amber-500" size={28} />
            </div>
          ) : isEmpty ? (
            <div className="h-full flex flex-col items-center justify-center px-6 max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/20 mb-6 animate-in zoom-in duration-500">
                <Sparkles size={30} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {greeting()}, {firstName}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 mb-8">
                Comment puis-je vous assister sur vos dossiers aujourd'hui ?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {SUGGESTED_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(p.label)}
                    className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-all text-left shadow-sm active:scale-[0.98]"
                  >
                    <span className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center flex-shrink-0">
                      <p.icon size={16} />
                    </span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
              {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} onTick={scrollToEnd} />)}

              {isSending && (
                <div className="flex gap-4 animate-in fade-in duration-300">
                  <BotAvatar size="sm" pulse />
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-md px-5 py-4 shadow-sm flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Analyse en cours…</span>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={isSending ? 'LexAssist analyse…' : 'Posez une question juridique…'}
                disabled={isSending}
                rows={1}
                className="w-full resize-none pl-5 pr-14 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-[14px] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white placeholder:text-slate-400 min-h-[56px] max-h-40"
              />
              <button
                onClick={() => handleSend()}
                disabled={isSending || !input.trim()}
                className="absolute right-3 bottom-3 w-10 h-10 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center shadow-lg shadow-amber-500/20 active:scale-90"
                aria-label="Envoyer"
              >
                {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
            <p className="mt-2 text-[10px] text-center text-slate-400 font-medium">
              LexAssist peut générer des erreurs. Vérifiez toujours les citations juridiques.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantView;

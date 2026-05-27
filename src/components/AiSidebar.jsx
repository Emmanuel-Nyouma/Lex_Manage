import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, FileText, Loader2, Send, Sparkles, MessageSquare, Shield, Info } from 'lucide-react';
import useLexStore from '../store/useLexStore';

const SUGGESTED_PROMPTS = [
  { label: "Summarize current case", icon: FileText },
  { label: "Draft a retainer clause", icon: Sparkles },
  { label: "Check court deadlines", icon: Info },
];

const AiSidebar = ({ 
  isOpen = false, 
  onClose = () => {}, 
  currentView = ""
}) => {
  const { sendAiMessage, isLoading: isChatLoading, error } = useLexStore();
  const [chatHistory, setChatHistory] = useState([
    { id: 1, sender: 'ai', text: "Bonjour Maître, je suis LexAssist. Comment puis-je vous aider aujourd'hui ?", isRich: false }
  ]);
  const chatEndRef = useRef(null);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading, error]);

  const handleSend = React.useCallback(async (text) => {
    const messageText = typeof text === 'string' ? text : chatInput;
    if (!messageText.trim() || isChatLoading) return;
    
    // 1. Add user message locally
    const userMsg = { id: Date.now().toString(), sender: 'user', text: messageText };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput("");

    // 2. Call secure backend relayer via Zustand
    const response = await sendAiMessage(messageText);
    if (response) {
      setChatHistory(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        sender: 'ai', 
        text: response.text,
        isRich: response.text.length > 200 // Threshold for rich display
      }]);
    }
  }, [chatInput, isChatLoading, sendAiMessage]);

  return (
    <div className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-[45] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Bot size={22} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">LexAssist AI</h3>
            <div className="flex items-center gap-1.5">
               <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest">Active</span>
               <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
               <span className="text-[10px] text-slate-400 font-medium">GPT-4 Legal Core</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/30 dark:bg-slate-950/30 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        {chatHistory.length <= 1 && (
          <div className="py-8 px-4 text-center animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100 dark:border-amber-900/20">
              <MessageSquare className="text-amber-600" size={24} />
            </div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-2">How can I help today?</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-[240px] mx-auto">I can analyze pleadings, draft clauses, or check case law precedents.</p>
            
            <div className="space-y-2">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt.label)}
                  className="w-full flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all text-left shadow-sm active:scale-[0.98]"
                >
                  <prompt.icon size={14} className="text-amber-500" />
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shadow-sm ${
              msg.sender === 'user' 
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400' 
                : 'bg-amber-600 text-white'
            }`}>
              {msg.sender === 'user' ? 'YOU' : <Bot size={14} />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] space-y-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-slate-900 dark:bg-amber-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none'
              }`}>
                {msg.isRich ? (
                  <div className="whitespace-pre-line">
                    <span className="font-serif block text-sm">{msg.text}</span>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex gap-2">
                       <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-600 dark:text-slate-300 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 transition-all border border-slate-100 dark:border-slate-800">
                          <FileText size={12} /> Copy
                       </button>
                       <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-600 dark:text-slate-300 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 transition-all border border-slate-100 dark:border-slate-800">
                          <Sparkles size={12} /> Refine
                       </button>
                    </div>
                  </div>
                ) : (
                  msg.text
                )}
              </div>
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase px-1">
                {msg.sender === 'user' ? 'Sent' : 'LexAssist • Just now'}
              </span>
            </div>
          </div>
        ))}
        
        {isChatLoading && (
          <div className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
              <Bot size={14} />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-3">
              <Loader2 size={14} className="animate-spin text-amber-600" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-tight uppercase">Thinking...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-[90%] p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-[11px] font-bold flex items-center gap-2">
            <Info size={14} /> {error}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2 mb-3 px-1">
           <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full border dark:border-slate-700">
              <Shield size={10} className="text-emerald-500" />
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">Secure RAG Mode</span>
           </div>
           <span className="text-[10px] text-slate-300 dark:text-slate-700">|</span>
           <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Context: {currentView}</span>
        </div>
        
        <div className="relative group">
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={isChatLoading ? "Lex is analyzing..." : "Ask a legal question..."}
            disabled={isChatLoading}
            className="w-full pl-4 pr-12 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-[13px] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:focus:border-amber-600 transition-all dark:text-white resize-none h-24 placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
          <button 
            onClick={() => handleSend()}
            disabled={isChatLoading || !chatInput.trim()}
            className="absolute right-2.5 bottom-2.5 w-9 h-9 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center shadow-lg shadow-amber-600/20 active:scale-90"
            title="Send Message"
          >
            {isChatLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        <p className="mt-2 text-[9px] text-center text-slate-400 dark:text-slate-600 font-medium">
          LexAssist may provide hallucinations. Always verify legal citations.
        </p>
      </div>
    </div>
  );
};

export default AiSidebar;
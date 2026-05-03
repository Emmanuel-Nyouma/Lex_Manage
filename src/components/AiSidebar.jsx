import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, FileText, Loader2, Send } from 'lucide-react';

const AiSidebar = ({ isOpen, onClose, currentView, chatHistory, setChatHistory, onSendMessage, isChatLoading, error }) => {
  const chatEndRef = useRef(null);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading, error]);

  const handleSend = () => {
    if (!chatInput.trim() || isChatLoading) return;
    onSendMessage(chatInput);
    setChatInput("");
  };

  return (
    <div className={`fixed inset-y-0 right-0 w-96 bg-white border-l border-slate-200 shadow-2xl transform transition-transform duration-300 z-[45] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">LexAssist AI</h3>
            <p className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live RAG Context
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {chatHistory.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
              msg.sender === 'user' 
                ? 'bg-slate-900 text-white rounded-br-none' 
                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
            }`}>
              {msg.isRich ? (
                <div className="whitespace-pre-line">
                  <span className="font-serif leading-relaxed block">{msg.text}</span>
                  <button className="mt-3 text-xs flex items-center gap-1 text-amber-600 font-medium hover:underline">
                    <FileText size={12} /> Copy to Draft Editor
                  </button>
                </div>
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        {isChatLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-lg p-3 rounded-bl-none shadow-sm flex items-center gap-2 animate-pulse">
              <Loader2 size={16} className="animate-spin text-amber-600" />
              <span className="text-xs text-slate-500">Processing legal query...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="p-2 bg-red-50 border border-red-100 rounded text-red-600 text-[11px] text-center">
            {error}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
           <span>Context: {currentView === 'cases' ? 'Case Repo' : 'General Library'}</span>
        </div>
        <div className="relative">
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={isChatLoading ? "Lex is thinking..." : "Ask about precedents or draft a clause..."}
            disabled={isChatLoading}
            className="w-full pl-3 pr-10 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none h-20 disabled:bg-slate-50 disabled:text-slate-400"
          />
          <button 
            onClick={handleSend}
            disabled={isChatLoading || !chatInput.trim()}
            className="absolute right-2 bottom-2 px-3 py-1.5 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2 text-xs font-medium"
          >
            {isChatLoading ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Lex is thinking...
              </>
            ) : (
              <>
                <Send size={12} />
                Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiSidebar;

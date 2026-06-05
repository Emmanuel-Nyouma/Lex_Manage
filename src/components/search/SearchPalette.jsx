import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, FileText, Briefcase, Users, X, Loader2, Command, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../lib/api';

export const SearchPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ cases: [], documents: [], members: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Flatten results for easy keyboard navigation
  const flatResults = useMemo(() => [
    ...(results.cases || []).map(r => ({ ...r, type: 'case' })),
    ...(results.documents || []).map(r => ({ ...r, type: 'doc' })),
    ...(results.members || []).map(r => ({ ...r, type: 'member' }))
  ], [results]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults({ cases: [], documents: [], members: [] });
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  const handleResultClick = useCallback((type, id) => {
    onClose();
    if (type === 'case') navigate(`/cases/${id}`);
    else if (type === 'member') navigate(`/company-settings`);
    else navigate(`/documents`);
  }, [navigate, onClose]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      
      if (!isOpen) return;

      if (e.key === 'Escape') onClose();
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < flatResults.length - 1 ? prev + 1 : prev));
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      }
      
      if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        const selected = flatResults[selectedIndex];
        handleResultClick(selected.type, selected.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, flatResults, selectedIndex, handleResultClick]);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults({ cases: [], documents: [], members: [] });
        return;
      }

      setIsSearching(true);
      try {
        const { data } = await apiClient.get(`/search/global?q=${encodeURIComponent(query)}`);
        setResults(data);
        setSelectedIndex(-1); // Reset selection on new search
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const totalResults = (results.cases?.length || 0) + (results.documents?.length || 0) + (results.members?.length || 0);
  const dialogId = React.useId();

  if (!isOpen) return null;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby={dialogId}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-5 border-b border-slate-100 dark:border-slate-800">
          <Search className="text-slate-500 dark:text-slate-300" size={20} />
          <input 
            id={dialogId}
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher dossiers, documents, équipe..."
            className="flex-1 bg-transparent border-none outline-none text-lg text-slate-900 dark:text-white placeholder:text-slate-500 dark:text-slate-300"
          />
          <div className="flex items-center gap-2">
            {isSearching && <Loader2 size={18} className="animate-spin text-amber-500" />}
            <button onClick={onClose} className="p-1 text-slate-500 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 rounded-md">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
          {totalResults === 0 && query.length >= 2 && !isSearching && (
            <div className="p-10 text-center">
              <p className="text-slate-600 dark:text-slate-300 italic">Aucun résultat pour "{query}"</p>
            </div>
          )}

          {totalResults === 0 && query.length < 2 && (
            <div className="p-10 text-center space-y-4">
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                <Command className="text-slate-300" size={24} />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Tapez au moins 2 caractères pour lancer la recherche globale.</p>
            </div>
          )}

          {/* Group: Cases */}
          {results.cases?.length > 0 && (
            <div className="mb-4">
              <div className="px-3 py-2 text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <Briefcase size={12} /> Dossiers
              </div>
              {results.cases.map((res, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={`case-${res.id}`}
                    onClick={() => handleResultClick('case', res.id)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all text-left group ${
                      isSelected ? 'bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-200 dark:ring-amber-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{res.title}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-amber-600 dark:text-amber-500">{res.clientName}</span>
                        {res.caseNumber && <span className="opacity-50">• {res.caseNumber}</span>}
                      </div>
                    </div>
                    <ArrowRight size={14} className={`text-slate-300 transition-all ${isSelected ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`} />
                  </button>
                );
              })}
            </div>
          )}

          {/* Group: Documents */}
          {results.documents?.length > 0 && (
            <div className="mb-4">
              <div className="px-3 py-2 text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <FileText size={12} /> Documents
              </div>
              {results.documents.map((res, idx) => {
                const globalIdx = (results.cases?.length || 0) + idx;
                const isSelected = selectedIndex === globalIdx;
                return (
                  <button
                    key={`doc-${res.id}`}
                    onClick={() => handleResultClick('doc', res.id)}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all text-left group ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{res.title}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 dark:text-slate-400 mt-0.5">{res.fileName}</div>
                    </div>
                    <ArrowRight size={14} className={`text-slate-300 transition-all ${isSelected ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`} />
                  </button>
                );
              })}
            </div>
          )}

          {/* Group: Team */}
          {results.members?.length > 0 && (
            <div>
              <div className="px-3 py-2 text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <Users size={12} /> Équipe
              </div>
              {results.members.map((res, idx) => {
                const globalIdx = (results.cases?.length || 0) + (results.documents?.length || 0) + idx;
                const isSelected = selectedIndex === globalIdx;
                return (
                  <button
                    key={`member-${res.id}`}
                    onClick={() => handleResultClick('member', res.id)}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all text-left group ${
                      isSelected ? 'bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                      {res.firstName[0]}{res.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{res.firstName} {res.lastName}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 dark:text-slate-400 mt-0.5">{res.role.replace('_', ' ')}</div>
                    </div>
                    <ArrowRight size={14} className={`text-slate-300 transition-all ${isSelected ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-300 flex justify-between items-center px-5">
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><kbd className="bg-white dark:bg-slate-700 px-1 rounded border border-slate-200 dark:border-slate-600">Enter</kbd> pour sélectionner</span>
            <span className="flex items-center gap-1"><kbd className="bg-white dark:bg-slate-700 px-1 rounded border border-slate-200 dark:border-slate-600">Esc</kbd> pour fermer</span>
          </div>
          <span className="font-bold text-amber-600/80">LexManage Intelligence</span>
        </div>
      </div>
      
      {/* Backdrop overlay listener */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};

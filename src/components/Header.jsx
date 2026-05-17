import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Bot, FileText, Briefcase, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const Header = ({ onOpenAi }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const handleNotificationClick = () => {
    toast.info("Vous n'avez pas de nouvelles notifications.");
  };

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase.rpc('search_app', { query_text: query });
        if (error) throw error;
        setResults(data || []);
        setShowResults(true);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close results on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (res) => {
    setShowResults(false);
    setQuery('');
    if (res.type === 'case') navigate(`/cases/${res.id}`);
    else navigate(`/documents`); // Ou vers une vue détail document
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">
      
      {/* Barre de Recherche Globale */}
      <div className="flex items-center flex-1 max-w-xl relative" ref={searchRef}>
        <div className="w-full flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-amber-500/50 transition-all group">
          {isSearching ? (
            <Loader2 size={18} className="text-amber-500 animate-spin mr-2" />
          ) : (
            <Search size={18} className="text-slate-400 mr-2 group-focus-within:text-amber-500 transition-colors" />
          )}
          <input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length > 1 && setShowResults(true)}
            className="bg-transparent border-none focus:outline-none text-sm w-full text-slate-700 dark:text-slate-200 placeholder:text-slate-400" 
            placeholder="Chercher un dossier ou une pièce... (⌘K)" 
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 p-1">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Menu Déroulant des Résultats */}
        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
            <div className="max-h-[400px] overflow-y-auto">
              {results.map((res) => (
                <button
                  key={`${res.type}-${res.id}`}
                  onClick={() => handleResultClick(res)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left border-b border-slate-50 dark:border-slate-800 last:border-0"
                >
                  <div className={`p-2 rounded-lg ${res.type === 'case' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                    {res.type === 'case' ? <Briefcase size={16} /> : <FileText size={16} />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{res.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{res.subtitle}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button onClick={handleNotificationClick} className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
        <button onClick={onOpenAi} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-sm font-bold transition-all shadow-sm">
          <Bot size={18} />
          <span>Assistant IA</span>
        </button>
      </div>
    </header>
  );
};

export default Header;

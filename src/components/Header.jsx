import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Bot, FileText, Briefcase, Loader2, X, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import useLexStore from '../store/useLexStore';
import GlobalTimer from './GlobalTimer';

const Header = ({ onOpenAi }) => {
  const { currentUser } = useLexStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const searchRef = useRef(null);
  const notificationRef = useRef(null);

  const { notifications, unreadCount, markAsRead } = useNotifications();

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

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (res) => {
    setShowResults(false);
    setQuery('');
    if (res.type === 'case') navigate(`/cases/${res.id}`);
    else navigate(`/documents`);
  };

  const handleNotificationRead = async (e, id) => {
    e.stopPropagation();
    await markAsRead(id);
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
        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)} 
            className={`relative p-2 rounded-lg transition-colors ${showNotifications ? 'bg-slate-100 dark:bg-slate-800 text-amber-500' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center animate-in zoom-in">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">{unreadCount} nouvelles</span>}
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={`p-4 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative group ${!notif.is_read ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`p-2 h-fit rounded-lg ${notif.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {notif.priority === 'high' ? <AlertCircle size={16} /> : <Clock size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{notif.title}</span>
                            {!notif.is_read && (
                              <button 
                                onClick={(e) => handleNotificationRead(e, notif.id)}
                                className="p-1 text-slate-400 hover:text-emerald-500 transition-colors opacity-0 group-hover:opacity-100"
                                title="Marquer comme lu"
                              >
                                <Check size={14} />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 mt-2 block italic">
                            {new Date(notif.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell size={20} className="text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">Aucune notification.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
        
        {/* Widget Chronomètre */}
        <GlobalTimer />

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
        <button onClick={onOpenAi} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-sm font-bold transition-all shadow-sm">
          <Bot size={18} />
          <span className="hidden sm:inline">Assistant IA</span>
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

        {/* User Profile Summary */}
        <Link to="/profile" className="flex items-center gap-3 p-1 pr-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group">
          <div className="w-9 h-9 rounded-full bg-slate-900 dark:bg-amber-600 text-white flex items-center justify-center text-xs font-bold border-2 border-white dark:border-slate-800 shadow-sm">
             {currentUser?.first_name?.charAt(0) || currentUser?.last_name?.charAt(0) || '?'}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Maître</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white leading-none">
              {currentUser?.first_name} {currentUser?.last_name}
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Header;

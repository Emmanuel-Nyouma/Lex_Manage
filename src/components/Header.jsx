import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Bot, Check, CheckCheck, Clock, Menu, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import useLexStore from '../store/useLexStore';
import { SearchPalette } from './search/SearchPalette';

// Visual config per notification level (backend: NORMAL | IMPORTANT | URGENT)
const LEVEL_UI = {
  URGENT:    { icon: AlertCircle,   chip: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',     label: 'Urgent' },
  IMPORTANT: { icon: AlertTriangle, chip: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', label: 'Important' },
  NORMAL:    { icon: Info,          chip: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',     label: 'Information' },
};
const levelUi = (level) => LEVEL_UI[level] || LEVEL_UI.NORMAL;

const MOTIF_LABELS = {
  HEARING: 'Audience', INTERNAL_MEETING: 'Réunion interne', DEADLINE: 'Délai procédural',
  DOCUMENT_TO_SIGN: 'Document à signer', NEW_CLIENT: 'Nouveau client', INVOICE_PENDING: 'Facture en attente',
  LEGAL_UPDATE: 'Mise à jour légale', INTERNAL_REMINDER: 'Rappel interne', CONFLICT_DETECTED: "Conflit d'intérêt",
  OTHER: 'Autre',
};

const Header = ({ onOpenAi, onToggleMobileSidebar, isSearchOpen, setIsSearchOpen }) => {
  const { currentUser } = useLexStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);

  const notificationRef = useRef(null);

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationRead = async (e, id) => {
    e.stopPropagation();
    await markAsRead(id);
  };

  // Open the detail dialog for a notification and mark it read
  const openNotification = (notif) => {
    setSelectedNotif(notif);
    setShowNotifications(false);
    if (!notif.isRead) markAsRead(notif.id);
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 shadow-sm gap-4">
      
      {/* Mobile Hamburger Menu */}
      <button 
        onClick={onToggleMobileSidebar}
        className="md:hidden p-3.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu size={24} aria-hidden="true" />
      </button>

      {/* Global Search Button */}
      <div className="flex items-center flex-1 max-w-xl">
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="w-full flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          aria-label="Search cases and documents"
        >
          <Search size={20} aria-hidden="true" />
          <span className="text-sm">Search...</span>
          <span className="ml-auto text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-mono">⌘K</span>
        </button>
      </div>

      <SearchPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />


      <div className="flex items-center gap-2">
        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)} 
            className={`relative p-3.5 rounded-lg transition-colors ${showNotifications ? 'bg-slate-100 dark:bg-slate-800 text-amber-500' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            aria-label="Open notifications"
          >
            <Bell size={24} aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center animate-in zoom-in">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50 ring-1 ring-slate-200 dark:ring-slate-800">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">{unreadCount} new</span>}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    title="Tout marquer comme lu"
                  >
                    <CheckCheck size={14} aria-hidden="true" /> Tout lire
                  </button>
                )}
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => {
                    const ui = levelUi(notif.level);
                    const LevelIcon = ui.icon;
                    return (
                    <div
                      key={notif.id}
                      onClick={() => openNotification(notif)}
                      className={`p-4 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative group cursor-pointer ${!notif.isRead ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`p-2 h-fit rounded-lg ${ui.chip}`}>
                          <LevelIcon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1 gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
                              {!notif.isRead && <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" aria-label="Non lu" />}
                              {notif.title || MOTIF_LABELS[notif.motif] || 'Notification'}
                            </span>
                            {!notif.isRead && (
                              <button
                                onClick={(e) => handleNotificationRead(e, notif.id)}
                                className="p-2 text-slate-500 dark:text-slate-300 hover:text-emerald-500 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 flex-shrink-0"
                                aria-label="Mark notification as read"
                                title="Marquer comme lu"
                              >
                                <Check size={14} aria-hidden="true" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 dark:text-slate-400 leading-relaxed line-clamp-2">{notif.message}</p>
                          <span className="text-[10px] text-slate-500 dark:text-slate-300 mt-2 block italic">
                            {new Date(notif.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell size={20} className="text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 dark:text-slate-400 italic">No notifications.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
        
        <button 
          onClick={onOpenAi} 
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-sm font-bold transition-all shadow-sm ring-1 ring-amber-400/50"
          aria-label="Open LexAssist AI assistant"
        >
          <Bot size={18} aria-hidden="true" />
          <span className="hidden sm:inline">LexAssist AI</span>
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

        {/* User Profile Summary */}
        <Link to="/profile" className="flex items-center gap-3 p-1 pr-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group">
          <div className="w-9 h-9 rounded-full bg-slate-900 dark:bg-amber-600 text-white flex items-center justify-center text-xs font-bold border-2 border-white dark:border-slate-800 shadow-sm transition-transform group-hover:scale-105">
             {currentUser?.firstName?.charAt(0) || currentUser?.lastName?.charAt(0) || '?'}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider leading-none mb-1">Counsel</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white leading-none">
              {currentUser?.firstName} {currentUser?.lastName}
            </div>
          </div>
        </Link>
      </div>

      {/* Notification Detail Dialog */}
      {selectedNotif && (() => {
        const ui = levelUi(selectedNotif.level);
        const LevelIcon = ui.icon;
        return (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setSelectedNotif(null)}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-modal="true"
              className="relative z-10 bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl ${ui.chip}`}>
                    <LevelIcon size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 dark:text-white truncate">
                      {selectedNotif.title || MOTIF_LABELS[selectedNotif.motif] || 'Notification'}
                    </h3>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${ui.chip}`}>
                      {ui.label}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNotif(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Fermer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                  {selectedNotif.message || 'Aucun contenu détaillé.'}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-slate-400">
                  {selectedNotif.motif && (
                    <span className="flex items-center gap-1.5">
                      <Info size={12} /> {MOTIF_LABELS[selectedNotif.motif] || selectedNotif.motif}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} /> {new Date(selectedNotif.createdAt).toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedNotif(null)}
                  className="px-5 py-2.5 bg-slate-900 dark:bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-amber-700 transition-all"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </header>
  );
};

export default Header;



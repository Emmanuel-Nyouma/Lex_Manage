import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Bot, FileText, Briefcase, Loader2, X as XIcon, Check, Clock, Menu, AlertCircle, User, Users } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import useLexStore from '../store/useLexStore';
import { SearchPalette } from './search/SearchPalette';

const Header = ({ onOpenAi, onToggleMobileSidebar }) => {
  const { currentUser } = useLexStore();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const notificationRef = useRef(null);

  const { notifications, unreadCount, markAsRead } = useNotifications();

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

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 shadow-sm gap-4">
      
      {/* Mobile Hamburger Menu */}
      <button 
        onClick={onToggleMobileSidebar}
        className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      {/* Global Search Button */}
      <div className="flex items-center flex-1 max-w-xl">
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="w-full flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        >
          <Search size={18} />
          <span className="text-sm">Search...</span>
          <span className="ml-auto text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 font-mono">⌘K</span>
        </button>
      </div>

      <SearchPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />


      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)} 
            className={`relative p-2 rounded-lg transition-colors ${showNotifications ? 'bg-slate-100 dark:bg-slate-800 text-amber-500' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            aria-label="Open notifications"
          >
            <Bell size={20} aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center animate-in zoom-in">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50 ring-1 ring-slate-200 dark:ring-slate-800">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">{unreadCount} new</span>}
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={`p-4 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative group ${!notif.isRead ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`p-2 h-fit rounded-lg ${notif.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {notif.priority === 'high' ? <AlertCircle size={16} /> : <Clock size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{notif.title}</span>
                            {!notif.isRead && (
                              <button 
                                onClick={(e) => handleNotificationRead(e, notif.id)}
                                className="p-1 text-slate-400 hover:text-emerald-500 transition-colors opacity-0 group-hover:opacity-100"
                                aria-label="Mark notification as read"
                                title="Mark as read"
                              >
                                <Check size={14} aria-hidden="true" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 mt-2 block italic">
                            {new Date(notif.createdAt).toLocaleString()}
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
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">No notifications.</p>
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
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Counsel</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white leading-none">
              {currentUser?.firstName} {currentUser?.lastName}
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Header;

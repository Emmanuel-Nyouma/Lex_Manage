import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Brain, Briefcase, Calendar, Files,
  Settings, Gavel, LogOut, Building2, Bell, Users, UserCheck, Bot, X,
} from 'lucide-react';
import useLexStore from '../store/useLexStore';
import useTranslation from '../hooks/useTranslation';

const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const { logout, currentUser } = useLexStore();
  const { t } = useTranslation();

  const firstName = currentUser?.firstName || '';
  const lastName  = currentUser?.lastName  || '';
  const fullName  = firstName || lastName ? `${firstName} ${lastName}`.trim() : 'User';
  const role      = currentUser?.role || 'LAWYER';
  const isAdmin   = role === 'CABINET_ADMIN' || role === 'SUPER_ADMIN';

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileOpen]);

  const navItems = [
    { to: '/dashboard',  icon: LayoutDashboard, labelKey: 'dashboard'       },
    { to: '/clients',    icon: Users,            labelKey: 'clients'         },
    { to: '/colleagues', icon: UserCheck,         labelKey: 'colleagues_nav'  },
    { to: '/cases',      icon: Briefcase,        labelKey: 'cases'           },
    { to: '/calendar',   icon: Calendar,         labelKey: 'calendar'        },
    { to: '/documents',  icon: Files,            labelKey: 'documents'       },
    ...(isAdmin ? [
      { to: '/company-settings',    icon: Building2, labelKey: 'firm_management' },
      { to: '/notification-center', icon: Bell,      labelKey: 'notifications'   },
    ] : []),
    { to: '/settings', icon: Settings, labelKey: 'settings' },
  ];

  const handleNavClick = () => { if (onCloseMobile) onCloseMobile(); };

  return (
    <>
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col
        bg-slate-900 text-slate-300 border-r border-slate-800
        transition-transform duration-300 ease-in-out h-full shadow-2xl md:shadow-none
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-slate-950 border-b border-slate-800/50">
          <div className="flex items-center">
            <Gavel className="text-amber-500 mr-2" size={24} aria-hidden="true" />
            <span className="text-white font-black text-lg tracking-wider">
              LEX<span className="text-amber-500 font-light">MANAGE</span>
            </span>
          </div>
          <button
            onClick={onCloseMobile}
            className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            aria-label={t.close}
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 overflow-y-auto custom-scrollbar scrollbar-none md:scrollbar-thin">
          {/* LexAssist AI — highlighted entry */}
          <div className="px-3 pb-3 mb-2 border-b border-slate-800/60">
            <NavLink
              to="/lex-assist"
              onClick={handleNavClick}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all
                ${isActive
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800/60 text-amber-400 hover:bg-slate-800'
                }
              `}
            >
              <Bot size={18} aria-hidden="true" />
              LexAssist AI
              <Brain size={14} className="ml-auto opacity-60" aria-hidden="true" />
            </NavLink>
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              className={({ isActive }) => `
                flex items-center px-6 py-3 text-sm font-medium transition-all border-l-4
                ${isActive
                  ? 'bg-slate-800 text-white border-amber-500'
                  : 'text-slate-500 dark:text-slate-300 hover:bg-slate-800 hover:text-white border-transparent'
                }
              `}
            >
              <item.icon size={18} className="mr-3" aria-hidden="true" />
              {t[item.labelKey] || item.labelKey}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          <NavLink
            to="/profile"
            onClick={handleNavClick}
            className={({ isActive }) => `
              flex-1 flex items-center gap-3 p-2 rounded-lg transition-colors
              ${isActive ? 'bg-slate-800' : 'hover:bg-slate-800'}
            `}
          >
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-slate-900 text-xs font-bold shrink-0">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{fullName}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-300 truncate capitalize">{role}</p>
            </div>
          </NavLink>

          <button
            onClick={logout}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            aria-label={t.logout}
            title={t.logout}
          >
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

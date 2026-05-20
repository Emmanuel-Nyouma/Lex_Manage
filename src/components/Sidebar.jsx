import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Calendar, 
  Files, 
  ShieldCheck, 
  Settings,
  Gavel,
  LogOut,
  Building2,
  Users
} from 'lucide-react';
import useLexStore from '../store/useLexStore';

const Sidebar = () => {
  const { session, logout, currentUser } = useLexStore();
  const user = session?.user;

  const firstName = currentUser?.first_name || '';
  const lastName = currentUser?.last_name || '';
  const fullName = firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Utilisateur';
  const role = currentUser?.role || 'Avocat';
  const isAdmin = role === 'admin';

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/clients', icon: Users, label: 'Clients' },
    { to: '/cases', icon: Briefcase, label: 'Dossiers' },
    { to: '/calendar', icon: Calendar, label: 'Calendrier' },
    { to: '/documents', icon: Files, label: 'Documents' },
    { to: '/admin', icon: ShieldCheck, label: 'Administration' },
    ...(isAdmin ? [{ to: '/company-settings', icon: Building2, label: 'Gestion Cabinet' }] : []),
    { to: '/settings', icon: Settings, label: 'Paramètres' },
  ];

  return (
    <aside className="hidden md:flex w-72 flex-col bg-slate-900 text-slate-300 border-r border-slate-800">
      <div className="h-16 flex items-center px-6 bg-slate-950">
        <Gavel className="text-amber-500 mr-2" size={24} />
        <span className="text-white font-bold text-lg tracking-wide">LEX<span className="text-slate-400 font-light">MANAGE</span></span>
      </div>

      <nav className="flex-1 py-6 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex items-center px-6 py-3 text-sm font-medium transition-all border-l-4
              ${isActive 
                ? 'bg-slate-800 text-white border-amber-500' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white border-transparent'
              }
            `}
          >
            <item.icon size={18} className="mr-3" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
        <NavLink 
          to="/profile"
          className={({ isActive }) => `
            flex-1 flex items-center gap-3 p-2 rounded-lg transition-colors
            ${isActive ? 'bg-slate-800' : 'hover:bg-slate-800'}
          `}
        >
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-slate-900 text-xs font-bold">
             {fullName.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">{fullName}</p>
            <p className="text-[10px] text-slate-400 truncate capitalize">{role}</p>
          </div>
        </NavLink>

        <button 
          onClick={logout}
          className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          title="Déconnexion"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Brain,
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

const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const { logout, currentUser } = useLexStore();

  const firstName = currentUser?.firstName || '';
  const lastName = currentUser?.lastName || '';
  const fullName = firstName || lastName ? `${firstName} ${lastName}`.trim() : 'User';
  const role = currentUser?.role || 'LAWYER';
  const isAdmin = role === 'CABINET_ADMIN';

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/cases', icon: Briefcase, label: 'Cases' },
    { to: '/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/documents', icon: Files, label: 'Documents' },
    { to: '/admin', icon: ShieldCheck, label: 'Administration' },
    ...(isAdmin ? [{ to: '/company-settings', icon: Building2, label: 'Firm Management' }] : []),
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleNavClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/80 z-40 backdrop-blur-sm transition-opacity" 
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-slate-300 border-r border-slate-800 transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 bg-slate-950">
          <div className="flex items-center">
            <Gavel className="text-amber-500 mr-2" size={24} aria-hidden="true" />
            <span className="text-white font-bold text-lg tracking-wide">LEX<span className="text-slate-400 font-light">MANAGE</span></span>
          </div>
          {isMobileOpen && (
            <button onClick={onCloseMobile} className="md:hidden text-slate-400 hover:text-white" aria-label="Close menu">
              <span className="text-2xl">&times;</span>
            </button>
          )}
        </div>

        <nav className="flex-1 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              className={({ isActive }) => `
                flex items-center px-6 py-3 text-sm font-medium transition-all border-l-4
                ${isActive 
                  ? 'bg-slate-800 text-white border-amber-500' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white border-transparent'
                }
              `}
            >
              <item.icon size={18} className="mr-3" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

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
              <p className="text-[10px] text-slate-400 truncate capitalize">{role}</p>
            </div>
          </NavLink>

          <button 
            onClick={logout}
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

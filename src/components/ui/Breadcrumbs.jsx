import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const routeNames = {
  '/dashboard': 'Dashboard',
  '/cases': 'Case Management',
  '/calendar': 'Calendar',
  '/documents': 'Documents',
  '/admin': 'Administration',
  '/company-settings': 'Company Settings',
  '/profile': 'Profile',
  '/settings': 'Settings',
};

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center space-x-2 text-xs font-bold text-slate-500">
        <li>
          <Link to="/" className="hover:text-amber-600 transition-colors">Home</Link>
        </li>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const label = routeNames[to] || value.charAt(0).toUpperCase() + value.slice(1);

          return (
            <li key={to} className="flex items-center">
              <ChevronRight size={14} className="mx-2 text-slate-300" />
              {last ? (
                <span className="text-slate-900 dark:text-white" aria-current="page">{label}</span>
              ) : (
                <Link to={to} className="hover:text-amber-600 transition-colors">{label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

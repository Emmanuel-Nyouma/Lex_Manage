import React from 'react';
import { AlertCircle, Clock, CheckCircle, Trash2, Info } from 'lucide-react';

const badgeSemantics = {
  'OPEN': { variant: 'warning', icon: AlertCircle },
  'IN_PROGRESS': { variant: 'info', icon: Clock },
  'CLOSED': { variant: 'success', icon: CheckCircle },
  'DELETE': { variant: 'error', icon: Trash2 },
};

export const Badge = ({ children, variant = 'neutral', status, className = '' }) => {
  const variants = {
    neutral: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };

  const semantic = status ? badgeSemantics[status] : null;
  const activeVariant = semantic ? semantic.variant : variant;
  const Icon = semantic ? semantic.icon : null;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${variants[activeVariant]} ${className}`}>
      {Icon && <Icon size={10} />}
      {children}
    </span>
  );
};

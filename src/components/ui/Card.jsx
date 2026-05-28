import React from 'react';

export const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 ${className}`}>
    {children}
  </div>
);

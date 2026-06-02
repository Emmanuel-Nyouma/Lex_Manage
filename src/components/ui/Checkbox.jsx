import React, { forwardRef } from 'react';

export const Checkbox = forwardRef(({ label, className = '', ...props }, ref) => {
  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${className}`}>
      <input
        type="checkbox"
        ref={ref}
        className="w-6 h-6 rounded border-slate-300 text-amber-600 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-800"
        {...props}
      />
      {label && <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{label}</span>}
    </label>
  );
});

Checkbox.displayName = 'Checkbox';

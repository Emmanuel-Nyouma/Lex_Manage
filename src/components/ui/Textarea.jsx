import React, { forwardRef } from 'react';

export const Textarea = forwardRef(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={`w-full px-4 py-2.5 bg-white dark:bg-slate-900 border ${
          error ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
        } rounded-lg text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:text-white resize-none ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

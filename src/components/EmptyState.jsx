import React from 'react';
import { Button } from './UI';

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className = "" 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl ${className}`}>
      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mb-6">
        {Icon && <Icon size={32} />}
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-8">
        {description}
      </p>
      {actionLabel && (
        <Button onClick={onAction} icon={Icon}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;

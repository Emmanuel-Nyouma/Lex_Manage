import React from 'react';

const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl animate-in fade-in zoom-in-95 duration-500">
      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mb-6">
        {Icon && <Icon size={32} />}
      </div>
      
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 text-sm leading-relaxed">
        {description}
      </p>

      {action && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;



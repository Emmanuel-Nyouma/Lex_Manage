import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui';

const ConfirmDialog = ({
  isOpen,
  title = "Are you sure?",
  description,
  destructiveText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      role="dialog"
      aria-labelledby="confirm-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="text-red-600 dark:text-red-500" size={24} />
          </div>
          <div>
            <h2 id="confirm-dialog-title" className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {title}
            </h2>
          </div>
        </div>
        
        {description && (
          <p className="text-slate-600 dark:text-slate-300 dark:text-slate-400 text-sm mb-6 font-medium">
            {description}
          </p>
        )}
        
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} className="font-bold">
            {cancelText}
          </Button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm"
          >
            {destructiveText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

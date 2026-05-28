import React from 'react';
import { X } from 'lucide-react';
import { Card } from './ui';

export const PdfPreviewModal = ({ isOpen, onClose, fileUrl, fileName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{fileName}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 w-full bg-slate-100 dark:bg-slate-900">
          <iframe
            src={fileUrl}
            className="w-full h-full"
            title="PDF Preview"
          />
        </div>
      </Card>
    </div>
  );
};

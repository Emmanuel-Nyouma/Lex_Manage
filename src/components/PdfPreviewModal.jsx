import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Printer, Download } from 'lucide-react';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

export const PdfPreviewModal = ({ isOpen, onClose, fileUrl, fileName }) => {
  const [zoom, setZoom] = useState(100);
  const dialogId = React.useId();

  useKeyboardNavigation(onClose);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogId}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <h3 id={dialogId} className="font-bold text-sm text-slate-900 dark:text-white truncate">{fileName}</h3>
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Zoom Out" onClick={() => setZoom(z => Math.max(50, z - 10))}>
              <ZoomOut size={16} />
            </button>
            <span className="text-xs font-medium text-slate-600 w-10 text-center">{zoom}%</span>
            <button className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Zoom In" onClick={() => setZoom(z => Math.min(200, z + 10))}>
              <ZoomIn size={16} />
            </button>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
            <button className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Print" onClick={() => window.print()}>
              <Printer size={16} />
            </button>
            <a href={fileUrl} download={fileName} className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Download">
              <Download size={16} />
            </a>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 rounded-lg transition-colors ml-1"
              aria-label="Close preview"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="flex-1 w-full bg-slate-100 dark:bg-slate-900 overflow-auto">
          <iframe
            src={fileUrl}
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            className="w-full h-full"
            title="PDF Preview"
          />
        </div>
      </div>
    </div>
  );
};

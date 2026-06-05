import React, { useState } from 'react';
import { AlertCircle, X, ChevronDown, ChevronUp, Bug } from 'lucide-react';
import useLexStore from '../store/useLexStore';

const ErrorHandler = ({ error }) => {
  const { setError } = useLexStore();
  const [showDetails, setShowDetails] = useState(false);

  if (!error) return null;

  // Extract stack or details if error is an object
  const errorTitle = typeof error === 'string' ? 'System Error' : (error.name || 'System Error');
  const errorMessage = typeof error === 'string' ? error : (error.message || 'An unexpected error occurred');
  const errorStack = error.stack || null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-right-4 duration-300 max-w-md w-full px-4 sm:px-0">
      <div className="bg-white dark:bg-slate-900 border-l-4 border-red-600 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-4 flex items-start gap-3">
          <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg text-red-600 flex-shrink-0">
            <AlertCircle size={20} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">{errorTitle}</p>
              <button 
                onClick={() => setError(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                aria-label="Close error message"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              {errorMessage}
            </p>
            
            {(errorStack || typeof error === 'object') && (
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-red-600 transition-colors uppercase tracking-widest"
              >
                <Bug size={12} />
                {showDetails ? 'Hide Technical Details' : 'Show Technical Details'}
                {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
          </div>
        </div>

        {showDetails && (
          <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400 overflow-auto max-h-40 scrollbar-thin">
              {errorStack ? (
                <pre className="whitespace-pre-wrap">{errorStack}</pre>
              ) : (
                <pre>{JSON.stringify(error, null, 2)}</pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorHandler;

import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import useLexStore from '../store/useLexStore';

const ErrorHandler = ({ error }) => {
  const { setError } = useLexStore();

  if (!error) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-red-600 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 min-w-[320px]">
        <AlertCircle size={20} className="flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold">System Error</p>
          <p className="text-xs opacity-90">{error}</p>
        </div>
        <button 
          onClick={() => setError(null)}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default ErrorHandler;



import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-600 mb-6">
            <AlertTriangle size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Oups ! Une erreur est survenue</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
            L'interface a rencontré un problème inattendu.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-slate-950 rounded-xl font-bold shadow-lg hover:bg-amber-600 transition-all"
          >
            <RefreshCcw size={18} />
            Recharger LexManage
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;

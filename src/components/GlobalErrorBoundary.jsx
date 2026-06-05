import React from 'react';
import { AlertTriangle, RefreshCcw, X, Bug, ChevronDown, ChevronUp } from 'lucide-react';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical interface error captured:", error, errorInfo);
  }

  handleReset = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-3xl flex items-center justify-center text-red-600 shadow-inner rotate-3">
              <AlertTriangle size={48} />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center text-red-500 shadow-sm">
              <X size={16} />
            </div>
          </div>
          
          <div className="max-w-md space-y-4">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Interface Error
            </h1>
            
            <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              We encountered a critical problem rendering this view. Your legal data is safe, but the interface needs a fresh start.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button 
                onClick={this.handleReset}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 dark:bg-amber-600 text-white rounded-2xl font-bold shadow-xl hover:scale-105 transition-all active:scale-95"
              >
                <RefreshCcw size={18} />
                Restart Application
              </button>
              
              <button 
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <Bug size={18} />
                {this.state.showDetails ? 'Hide Details' : 'View Details'}
              </button>
            </div>

            {this.state.showDetails && (
              <div className="mt-8 animate-in slide-in-from-top-4 duration-300">
                <div className="bg-slate-900 rounded-2xl p-5 text-left border border-slate-800 shadow-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Technical Trace</span>
                    <span className="text-[10px] font-mono text-red-400">DEBUG_MODE</span>
                  </div>
                  <pre className="text-xs font-mono text-slate-400 overflow-auto max-h-60 scrollbar-thin scrollbar-thumb-slate-800">
                    {this.state.error?.stack || this.state.error?.toString()}
                  </pre>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-12 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            LexManage Security Engine v1.0
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default GlobalErrorBoundary;

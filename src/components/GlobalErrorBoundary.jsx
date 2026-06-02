import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Met à jour l'état pour que le prochain rendu affiche l'UI de secours.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Vous pouvez aussi loguer l'erreur vers un service de rapport d'erreurs
    console.error("Erreur capturée par l'ErrorBoundary:", error, errorInfo);
  }

  handleReset = () => {
    // Recharger l'application pour repartir sur un état propre
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center text-amber-600 mb-6 animate-pulse">
            <AlertTriangle size={40} />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Oups ! Un petit grain de sable...
          </h1>
          
          <p className="text-slate-600 dark:text-slate-300 dark:text-slate-400 mb-8 max-w-md">
            Un problème est survenu dans l'interface. Pas de panique, vos dossiers juridiques sont en sécurité sur nos serveurs.
          </p>

          <button 
            onClick={this.handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-slate-950 rounded-xl font-bold shadow-lg hover:bg-amber-600 transition-all active:scale-95"
          >
            <RefreshCcw size={18} />
            Recharger l'application
          </button>

          {import.meta.env.DEV && (
            <div className="mt-8 p-4 bg-slate-200 dark:bg-slate-800 rounded-lg text-xs text-left overflow-auto max-w-full font-mono text-red-500">
              <p className="font-bold mb-2 underline">Détails techniques (Dev uniquement) :</p>
              {this.state.error?.toString()}
            </div>
          )}
        </div>
      );
    }

    return this.props.children; 
  }
}

export default GlobalErrorBoundary;



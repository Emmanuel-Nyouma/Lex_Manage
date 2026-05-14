import React, { useState } from 'react';
import { 
  Plus, 
  Filter, 
  ChevronRight,
  Loader2,
  Calendar,
  User,
  Gavel
} from 'lucide-react';
import { Button, Badge } from './UI';
import NewCaseDialog from './NewCaseDialog';
import { useCases } from '../hooks/useCases';

const CaseManagementView = () => {
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const { data: cases, isLoading, error } = useCases();

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Erreur de chargement des dossiers : {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestion des Dossiers</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Gérez l'ensemble de vos procédures juridiques.</p>
        </div>
        <Button onClick={() => setIsNewCaseOpen(true)} icon={Plus} className="w-full sm:w-auto">
          Nouveau Dossier
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <Badge variant="info">Total ({cases?.length || 0})</Badge>
          <Button variant="secondary" size="sm" icon={Filter}>Filtrer</Button>
        </div>

        {/* VUE TABLEAU (Desktop >= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Dossier</th>
                <th className="px-6 py-4 font-semibold">Client</th>
                <th className="px-6 py-4 font-semibold">Statut</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {cases?.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 dark:text-white">{c.title}</div>
                    <div className="text-xs text-slate-500">{c.jurisdiction || 'Sans juridiction'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{c.client_name}</td>
                  <td className="px-6 py-4">
                    <Badge variant={c.status === 'en cours' ? 'warning' : 'info'}>{c.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-amber-500 transition-colors">
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* VUE CARTES (Mobile < md) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {cases?.map((c) => (
            <div key={c.id} className="p-4 space-y-3 active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 dark:text-white">{c.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Gavel size={12} /> {c.jurisdiction || 'N/A'}
                  </div>
                </div>
                <Badge variant={c.status === 'en cours' ? 'warning' : 'info'}>{c.status}</Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <User size={14} /> {c.client_name}
                </div>
                {c.next_hearing_date && (
                  <div className="flex items-center gap-2 text-amber-600 font-medium">
                    <Calendar size={14} /> {new Date(c.next_hearing_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {cases?.length === 0 && (
          <div className="px-6 py-12 text-center text-slate-500">
            Aucun dossier trouvé.
          </div>
        )}
      </div>

      <NewCaseDialog isOpen={isNewCaseOpen} onClose={() => setIsNewCaseOpen(false)} />
    </div>
  );
};

export default CaseManagementView;

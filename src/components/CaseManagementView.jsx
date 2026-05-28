import React, { useState } from 'react';
import { 
  Plus, 
  Filter, 
  ChevronRight,
  Loader2,
  Calendar,
  User,
  Gavel,
  Briefcase
} from 'lucide-react';
import { Button, Badge } from './UI';
import NewCaseDialog from './NewCaseDialog';
import CaseDrawer from './CaseDrawer';
import { useCases } from '../hooks/useCases';
import useLexStore from '../store/useLexStore';

const CaseManagementView = () => {
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const { data: cases, isLoading, error } = useCases();
  const { callGemini } = useLexStore();

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
        Error loading cases: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Case Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage all your ongoing legal proceedings.</p>
        </div>
        <Button onClick={() => setIsNewCaseOpen(true)} icon={Plus} className="w-full sm:w-auto shadow-lg shadow-amber-500/20">
          New Case
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <Badge variant="info" className="px-3">Total ({cases?.length || 0})</Badge>
          </div>
          <Button variant="secondary" size="sm" icon={Filter}>Filter</Button>
        </div>

        {/* VUE TABLEAU (Desktop >= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Case</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Assigned To</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {cases?.map((c) => (
                <tr 
                  key={c.id} 
                  onClick={() => setSelectedCase(c)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">{c.title}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                       <Gavel size={10} /> {c.courtName || 'Jurisdiction not defined'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">{c.clientName}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                         {c.assignee?.firstName?.[0] || '?'}{c.assignee?.lastName?.[0] || ''}
                       </div>
                       <span className="text-xs text-slate-500 font-medium">{c.assignee?.firstName || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={c.status === 'OPEN' ? 'warning' : 'info'}>{c.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 group-hover:text-amber-500 transition-all group-hover:translate-x-1">
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
            <div 
              key={c.id} 
              onClick={() => setSelectedCase(c)}
              className="p-4 space-y-3 active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 dark:text-white">{c.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium uppercase tracking-tight">
                    <Gavel size={10} /> {c.courtName || 'N/A'}
                  </div>
                </div>
                <Badge variant={c.status === 'OPEN' ? 'warning' : 'info'}>{c.status}</Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                  <User size={14} /> {c.clientName}
                </div>
              </div>
            </div>
          ))}
        </div>

        {cases?.length === 0 && (
          <div className="px-6 py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
               <Briefcase size={32} />
            </div>
            <p className="text-slate-500 font-medium">No cases found.</p>
            <Button onClick={() => setIsNewCaseOpen(true)} variant="secondary" size="sm">Create the first case</Button>
          </div>
        )}
      </div>

      <NewCaseDialog isOpen={isNewCaseOpen} onClose={() => setIsNewCaseOpen(false)} />
      
      <CaseDrawer 
        activeCase={selectedCase} 
        onClose={() => setSelectedCase(null)} 
        onCallGemini={callGemini}
      />
    </div>
  );
};

export default CaseManagementView;

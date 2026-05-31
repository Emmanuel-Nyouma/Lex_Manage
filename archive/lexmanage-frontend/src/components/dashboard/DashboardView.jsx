// src/components/dashboard/DashboardView.jsx - Complete interactive dashboard
import React, { useState } from 'react';
import MetricsCards from './MetricsCards';
import CaseAnalytics from './CaseAnalytics';
import { Briefcase, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

const DashboardView = ({ currentUser, tenant, cases }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'analytics'
  const [filters, setFilters] = useState({});

  const updateCaseStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/cases/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast.success('Dossier mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    }
  });

  const handleMetricClick = (type, value) => {
    if (type === 'active') {
      setFilters({ status: 'IN_PROGRESS' }); // Simple filter implementation
      setViewMode('overview');
    }
  };

  const filteredCases = cases.filter(c => {
    if (filters.status && c.status !== filters.status) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
          <p className="text-slate-400 text-sm mt-1">
            Bienvenue, Maître <span className="text-amber-500">{currentUser?.firstName} {currentUser?.lastName}</span> · {tenant?.name}
          </p>
        </div>
        <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1.5 rounded-full flex items-center gap-2">
          <Clock size={12} /> {new Date().toLocaleDateString('fr-FR', { dateStyle: 'long' })}
        </span>
      </div>

      {/* Metrics Cards */}
      <MetricsCards 
        cases={cases} 
        onMetricClick={handleMetricClick}
      />

      {/* View Toggle */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setViewMode('overview')}
          className={`px-4 py-2 rounded-lg text-sm ${
            viewMode === 'overview' 
              ? 'bg-blue-600 text-white' 
              : 'bg-slate-800 text-slate-300'
          }`}
        >
          Vue d'ensemble
        </button>
        <button
          onClick={() => setViewMode('analytics')}
          className={`px-4 py-2 rounded-lg text-sm ${
            viewMode === 'analytics' 
              ? 'bg-blue-600 text-white' 
              : 'bg-slate-800 text-slate-300'
          }`}
        >
          Analytique
        </button>
      </div>

      {/* Main Content */}
      {viewMode === 'overview' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-white flex items-center gap-2"><Briefcase size={16} className="text-amber-500" /> Dossiers récents</h2>
            <button onClick={() => router.push('/dashboard/cases')} className="text-xs text-amber-500 hover:text-amber-400">Tout voir →</button>
          </div>
          <div className="divide-y divide-slate-800">
            {filteredCases.slice(0, 5).map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-white">{c.title}</p>
                  <p className="text-xs text-slate-500">Client : {c.clientName}</p>
                </div>
                <select
                  defaultValue={c.status}
                  onChange={(e) => updateCaseStatus.mutate({ id: c.id, status: e.target.value })}
                  className="bg-slate-800 text-xs px-2 py-1 rounded-full font-medium text-slate-300 border-none focus:ring-0 cursor-pointer"
                >
                  <option value="OPEN">Ouvert</option>
                  <option value="IN_PROGRESS">En cours</option>
                  <option value="PENDING">En attente</option>
                  <option value="CLOSED">Fermé</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <CaseAnalytics 
          cases={cases}
          onChartClick={handleMetricClick}
        />
      )}
    </div>
  );
};

export default DashboardView;

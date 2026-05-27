'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Settings, Building, ShieldCheck, BarChart3, 
  Activity, Globe, Calendar, Loader2
} from 'lucide-react';

export default function SettingsPage() {
  // Queries
  const { data: tenant, isLoading: loadingTenant } = useQuery({
    queryKey: ['my-tenant'],
    queryFn: () => api.get('/tenants/me').then(r => r.data),
  });

  const { data: auditLogs = [], isLoading: loadingAudit } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => api.get('/audit').then(r => r.data),
    refetchInterval: 10000, // Refresh logs every 10 seconds!
  });

  const stats = [
    { label: 'Collaborateurs inscrits', value: tenant?._count?.users ?? '—' },
    { label: 'Dossiers ouverts', value: tenant?._count?.cases ?? '—' },
    { label: 'Documents indexés', value: tenant?._count?.documents ?? '—' },
  ];

  return (
    <main className="flex-1 p-6 space-y-8 overflow-y-auto bg-slate-950">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="text-amber-500" size={24} /> Configuration du cabinet
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Visualisez les détails de l'organisation, le statut de vos services SaaS et les journaux de sécurité.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Cabinet Meta & Subscription */}
        <div className="lg:col-span-1 space-y-6">
          {/* Tenant Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Building size={16} className="text-amber-500" /> Mon Cabinet
            </h3>
            {loadingTenant ? (
              <Loader2 size={16} className="animate-spin text-amber-500" />
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Raison sociale</label>
                  <p className="text-sm text-white font-semibold">{tenant?.name}</p>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Identifiant unique (Slug)</label>
                  <p className="text-xs text-amber-500 font-mono">{tenant?.slug}</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Calendar size={12} /> Créé le</span>
                  <span>{tenant ? new Date(tenant.createdAt).toLocaleDateString('fr-FR') : '—'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Subscription Tier */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={16} className="text-amber-500" /> Formule & Licence
            </h3>
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {tenant?.plan || 'ENTREPRISE'}
                </span>
                <h4 className="text-base font-bold text-white mt-2">LexManage Law-SaaS</h4>
                <p className="text-xs text-slate-400 mt-1 leading-normal">
                  Accès illimité à LexAssist, l'OCR cloud, l'indexation de pièces et le cryptage fort de dossiers.
                </p>
              </div>
            </div>
          </div>

          {/* Cabinet statistics */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 size={16} className="text-amber-500" /> Métriques d'usage
            </h3>
            <div className="divide-y divide-slate-800/60 text-xs">
              {stats.map(st => (
                <div key={st.label} className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-400 font-medium">{st.label}</span>
                  <span className="text-white font-bold">{st.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Security Audit Trail */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-[520px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity size={16} className="text-amber-500" /> Journal d'audit de sécurité
              </h3>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Globe size={10} /> Temps réel actif
              </span>
            </div>

            {loadingAudit ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-amber-500" />
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                Aucune activité enregistrée pour le moment.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl flex items-start justify-between text-xs hover:border-slate-800 transition-all">
                    <div className="space-y-1 pr-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-amber-500/10 text-amber-500 font-semibold px-2 py-0.5 rounded text-[10px] uppercase font-mono">
                          {log.action.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400 font-semibold">
                          {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Anonyme'}
                        </span>
                      </div>
                      <p className="text-slate-500">
                        Cible : <span className="text-slate-300 font-medium">{log.entity}</span> ({log.entityId.slice(0, 8)})
                      </p>
                      {log.ipAddress && (
                        <p className="text-[10px] text-slate-600 font-mono">IP: {log.ipAddress}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 font-medium whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString('fr-FR', { dateStyle: 'short' })}{' '}
                      {new Date(log.createdAt).toLocaleTimeString('fr-FR', { timeStyle: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

'use client';
import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import api from '@/lib/api';
import { Briefcase, Users, FileText, MessageSquare, TrendingUp, Clock } from 'lucide-react';

const STATS_CARDS = [
  { key: 'cases', label: 'Dossiers actifs', icon: Briefcase, color: 'text-blue-400' },
  { key: 'users', label: 'Collaborateurs', icon: Users, color: 'text-emerald-400' },
  { key: 'documents', label: 'Documents', icon: FileText, color: 'text-amber-400' },
  { key: 'conversations', label: 'Conversations IA', icon: MessageSquare, color: 'text-purple-400' },
];

export default function DashboardPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  const { data: tenant } = useQuery({
    queryKey: ['my-tenant'],
    queryFn: () => api.get('/tenants/me').then(r => r.data),
    enabled: isAuthenticated,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => api.get('/cases').then(r => r.data),
    enabled: isAuthenticated,
  });

  const stats = {
    cases: cases.filter((c: any) => c.status === 'OPEN' || c.status === 'IN_PROGRESS').length,
    users: tenant?._count?.users ?? '—',
    documents: tenant?._count?.documents ?? '—',
    conversations: '—',
  };

  const recentCases = cases.slice(0, 5);
  const statusColors: Record<string, string> = {
    OPEN: 'bg-green-500/20 text-green-400',
    IN_PROGRESS: 'bg-blue-500/20 text-blue-400',
    PENDING: 'bg-amber-500/20 text-amber-400',
    CLOSED: 'bg-slate-500/20 text-slate-400',
  };

  return (
    <main className="flex-1 p-6 space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
          <p className="text-slate-400 text-sm mt-1">
            Bienvenue, Maître <span className="text-amber-500">{user?.firstName} {user?.lastName}</span> · {tenant?.name}
          </p>
        </div>
        <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1.5 rounded-full flex items-center gap-2">
          <Clock size={12} /> {new Date().toLocaleDateString('fr-FR', { dateStyle: 'long' })}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS_CARDS.map(card => (
          <div key={card.key} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <card.icon size={20} className={card.color} />
              <TrendingUp size={14} className="text-slate-600" />
            </div>
            <div className="text-2xl font-bold text-white">{stats[card.key as keyof typeof stats]}</div>
            <div className="text-xs text-slate-400 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Cases */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold text-white flex items-center gap-2"><Briefcase size={16} className="text-amber-500" /> Dossiers récents</h2>
          <button onClick={() => router.push('/dashboard/cases')} className="text-xs text-amber-500 hover:text-amber-400">Tout voir →</button>
        </div>
        <div className="divide-y divide-slate-800">
          {recentCases.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">Aucun dossier pour l'instant.</div>
          ) : recentCases.map((c: any) => (
            <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-white">{c.title}</p>
                <p className="text-xs text-slate-500">Client : {c.clientName}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[c.status] || 'bg-slate-500/20 text-slate-400'}`}>
                {c.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Briefcase, 
  Clock, 
  Calendar, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Badge } from './UI';
import { useCases } from '../hooks/useCases';
import { exportToCSV } from '../utils/export';

const data = [
  { day: 'Lun', hours: 6.5 },
  { day: 'Mar', hours: 8.2 },
  { day: 'Mer', hours: 4.8 },
  { day: 'Jeu', hours: 9.1 },
  { day: 'Ven', hours: 7.4 },
  { day: 'Sam', hours: 2.5 },
  { day: 'Dim', hours: 0 },
];

const colorMap = {
  amber: "text-amber-500",
  blue: "text-blue-500",
  purple: "text-purple-500",
  red: "text-red-500"
};

const StatCard = ({ icon: Icon, label, value, trend, color }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800 ${colorMap[color] || "text-slate-500"}`}>
        <Icon size={24} />
      </div>
      {trend && (
        <Badge variant="success" className="bg-emerald-50 text-emerald-600 border-none">
          <TrendingUp size={12} className="mr-1" /> {trend}
        </Badge>
      )}
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  </div>
);

const DashboardView = () => {
  const { data: cases } = useCases();
  const activeCasesData = cases?.filter(c => c.status === 'en cours') || [];
  const activeCasesCount = activeCasesData.length;

  const handleExport = () => {
    const dataToExport = activeCasesData.map(c => ({
      Titre: c.title,
      Client: c.client_name,
      Juridiction: c.jurisdiction,
      Statut: c.status,
      "Date de création": new Date(c.created_at).toLocaleDateString()
    }));
    exportToCSV(dataToExport, `LexManage_Dossiers_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bonjour, Maître</h1>
          <p className="text-slate-500 dark:text-slate-400">Voici un aperçu de l'activité de votre cabinet aujourd'hui.</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm"
        >
          <TrendingUp size={16} className="rotate-90" />
          Exporter (CSV)
        </button>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Briefcase} 
          label="Dossiers Actifs" 
          value={activeCasesCount} 
          trend="+2" 
          color="amber" 
        />
        <StatCard 
          icon={Clock} 
          label="Heures Facturées" 
          value="38.5h" 
          trend="+12%" 
          color="blue" 
        />
        <StatCard 
          icon={Calendar} 
          label="Audiences (7j)" 
          value="4" 
          color="purple" 
        />
        <StatCard 
          icon={AlertCircle} 
          label="Prescriptions imminentes" 
          value="1" 
          color="red" 
        />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Workload Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-slate-900 dark:text-white">Charge de travail (7 derniers jours)</h3>
            <select className="text-xs bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-2 outline-none">
              <option>Cette semaine</option>
              <option>Semaine dernière</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.hours > 8 ? '#f59e0b' : '#3b82f6'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity / Feed */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6">Activités Récentes</h3>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-2 h-2 mt-2 rounded-full bg-amber-500 shrink-0"></div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Nouveau document versé</p>
                  <p className="text-xs text-slate-500 italic">Affaire Dupont vs État • Il y a 2h</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors border-t border-slate-100 dark:border-slate-800 pt-4">
            Voir tout l'historique
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;

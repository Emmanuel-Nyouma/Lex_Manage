import React from 'react';
import { 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Briefcase, 
  AlertCircle, 
  Clock,
  FileText,
  Database
} from 'lucide-react';
import { Card, Badge } from './UI';

const DashboardView = ({ currentUser, cases, onCaseSelect, onNavigate, t }) => {
  const MOCK_METRICS = [
    { label: t.active_cases, value: '42', trend: '+12%', color: 'text-emerald-600' },
    { label: t.avg_resolution, value: '74 Days', trend: '-5%', color: 'text-emerald-600' },
    { label: t.billable_hours, value: '312.5', trend: '+8.4%', color: 'text-emerald-600' },
    { label: t.success_rate, value: '94.2%', trend: '+1.1%', color: 'text-emerald-600' },
  ];

  const MOCK_ACTIVITY = [
    { id: 1, user: 'Sarah Jenkins', action: 'uploaded a pleading', target: 'Estate of H. Sterling', time: '14 mins ago', icon: 'FileText' },
    { id: 2, user: 'System', action: 'court date changed', target: 'TechCorp v. DataInc', time: '1 hour ago', icon: 'CalendarIcon' },
    { id: 3, user: 'Michael Ross', action: 'added a note', target: 'Rivera Merger', time: '3 hours ago', icon: 'FileText' },
    { id: 4, user: 'System', action: 'RAG sync complete', target: 'Federal Precedents', time: '5 hours ago', icon: 'Database' },
  ];

  const ICON_MAP = { FileText, CalendarIcon, Database };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.dashboard}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t.welcome}, {currentUser?.name || "Partner"}.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 shadow-sm">
            <CalendarIcon size={16} /> {t.today}: Oct 24
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_METRICS.map((metric, idx) => (
          <Card key={idx} className="p-4 flex flex-col justify-between dark:bg-slate-800 dark:border-slate-700">
            <div className="flex justify-between items-start mb-2">
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{metric.label}</span>
              <TrendingUp size={16} className="text-slate-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{metric.value}</div>
              <div className={`text-xs font-medium mt-1 ${metric.color}`}>
                {metric.trend} <span className="text-slate-400 dark:text-slate-500 font-normal">vs last month</span>
              </div>
            </div>
            <div className="h-1 w-full bg-slate-100 dark:bg-slate-700 mt-3 rounded-full overflow-hidden">
              <div className="h-full bg-slate-800 dark:bg-amber-500" style={{ width: `${Math.random() * 40 + 40}%` }}></div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-full dark:bg-slate-800 dark:border-slate-700">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Briefcase size={18} className="text-amber-600" /> {t.priority_cases}
              </h3>
              <button 
                onClick={() => onNavigate('cases')}
                className="text-sm text-amber-600 hover:text-amber-700 font-medium hover:underline"
              >
                {t.view_all}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">{t.case_name}</th>
                    <th className="px-4 py-3">{t.client}</th>
                    <th className="px-4 py-3">{t.deadline}</th>
                    <th className="px-4 py-3">{t.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {cases.slice(0, 4).map((c) => (
                    <tr 
                      key={c.id} 
                      onClick={() => onCaseSelect(c)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{c.name}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{c.client}</td>
                      <td className="px-4 py-3">
                        {new Date(c.deadline) < new Date('2023-11-01') ? (
                          <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                            <AlertCircle size={12} /> {c.deadline}
                          </span>
                        ) : (
                          <span className="text-slate-600 dark:text-slate-400">{c.deadline}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={c.status === 'Active' ? 'success' : c.status === 'In Court' ? 'warning' : 'default'}>
                          {c.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="h-full dark:bg-slate-800 dark:border-slate-700">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Clock size={18} className="text-amber-600" /> {t.firm_activity}
              </h3>
            </div>
            <div className="p-4 space-y-6">
              {MOCK_ACTIVITY.map((act) => {
                const Icon = ICON_MAP[act.icon] || FileText;
                return (
                  <div key={act.id} className="flex gap-3">
                    <div className="mt-1">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                        <Icon size={14} />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-800 dark:text-slate-200">
                        <span className="font-semibold">{act.user}</span> {act.action}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-0.5">{act.target}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{act.time}</p>
                    </div>
                  </div>
                );
              })}
              <div className="pt-2">
                 <button className="w-full py-2 text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                   Load older activity
                 </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;

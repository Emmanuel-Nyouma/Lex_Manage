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
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { Badge } from './UI';
import { exportToCSV } from '../utils/export';
import useLexStore from '../store/useLexStore';
import { useCases, useDeadlines } from '../hooks/useCases';
import { useNotifications } from '../hooks/useNotifications';

const StatCard = ({ icon: Icon, label, value, trend, color }) => {
  const colorMap = {
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-500",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-500",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-500",
    red: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-500",
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorMap[color] || colorMap.amber}`}>
          <Icon size={24} />
        </div>
        {trend && (
          <Badge variant={trend.includes('Action') ? 'warning' : 'success'} className="text-[10px]">
            {trend}
          </Badge>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
};

const data = [
  { day: 'Mon', hours: 6 },
  { day: 'Tue', hours: 9 },
  { day: 'Wed', hours: 4 },
  { day: 'Thu', hours: 10 },
  { day: 'Fri', hours: 7 },
  { day: 'Sat', hours: 2 },
  { day: 'Sun', hours: 0 },
];

const DashboardView = () => {
  const [isMounted, setIsMounted] = React.useState(false);
  const { currentUser } = useLexStore();
  const { data: cases } = useCases();
  const { notifications } = useNotifications();
  
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const firstName = currentUser?.firstName || '';
  const greetingName = firstName ? `, Counsel ${firstName}` : ', Counsel';
  
  const activeCasesData = cases?.filter(c => c.status === 'OPEN' || c.status === 'en cours') || [];
  const activeCasesCount = activeCasesData.length;

  const upcomingDeadlines = notifications.filter(n => n.type === 'DEADLINE_REMINDER' && !n.isRead).slice(0, 4);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Hello{greetingName}</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Here is an overview of your firm's activity today.</p>
        </div>
        <button 
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 dark:shadow-none"
        >
          <TrendingUp size={16} className="rotate-90" />
          Export Report
        </button>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Briefcase} 
          label="Active Cases" 
          value={activeCasesCount} 
          trend="+2" 
          color="amber" 
        />
        <StatCard 
          icon={Clock} 
          label="Ongoing Deadlines" 
          value="12" 
          trend="Action required" 
          color="blue" 
        />
        <StatCard 
          icon={Calendar} 
          label="Hearings (7d)" 
          value="4" 
          color="purple" 
        />
        <StatCard 
          icon={AlertCircle} 
          label="Emergencies" 
          value={upcomingDeadlines.length} 
          color="red" 
        />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Workload Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-500" /> Weekly Workload
              </h3>
            </div>
            <div className="h-[280px] w-full">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="hours" radius={[4, 4, 0, 0]} barSize={32}>
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.hours > 8 ? '#f59e0b' : '#3b82f6'} fillOpacity={0.9} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* New Section: Upcoming Deadlines List */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Clock size={18} className="text-amber-500" /> Upcoming Deadlines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingDeadlines.length > 0 ? upcomingDeadlines.map((notif) => (
                <div key={notif.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-amber-200 dark:hover:border-amber-900/50 transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="warning" className="text-[10px]">{notif.priority}</Badge>
                    <span className="text-[10px] font-mono text-slate-400">REMINDER</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-relaxed">{notif.message.split('(Ref:')[0]}</p>
                </div>
              )) : (
                <div className="col-span-2 py-8 text-center bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-sm text-slate-400 italic">No critical deadlines in the short term.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity / Feed */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
          <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
             <AlertCircle size={18} className="text-amber-500" /> Activity Log
          </h3>
          <div className="space-y-6">
            {notifications.slice(0, 6).map((notif) => (
              <div key={notif.id} className="flex gap-4 relative group">
                <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${notif.isRead ? 'bg-slate-200 dark:bg-slate-700' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`}></div>
                <div className="space-y-1">
                  <p className={`text-xs font-bold ${notif.isRead ? 'text-slate-500' : 'text-slate-900 dark:text-white'}`}>{notif.title}</p>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{notif.message.split('(Ref:')[0]}</p>
                  <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter pt-1">{new Date(notif.createdAt).toLocaleTimeString()} • TODAY</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-amber-600 transition-all border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-center gap-2">
            SEE ALL NOTIFICATIONS <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;

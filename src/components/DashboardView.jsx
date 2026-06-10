import React, { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Briefcase, Clock, FileText, Users, TrendingUp, TrendingDown,
  Sparkles, AlertTriangle, Scale, Activity, ChevronRight,
  Zap, ShieldAlert, CalendarClock, Loader2, RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useLexStore from '../store/useLexStore';
import { useDashboardStats } from '../hooks/useDashboardStats';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.floor(h / 24)} d ago`;
};

const daysUntil = (dateStr) => {
  const d = Math.ceil((new Date(dateStr) - Date.now()) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  return `In ${d} days`;
};

const ACTION_LABEL = {
  CREATE:     'created',
  UPDATE:     'updated',
  DELETE:     'deleted',
  DEACTIVATE: 'deactivated',
};
const ENTITY_LABEL = {
  Case:     'case',
  Document: 'document',
  User:     'user',
  Client:   'client',
  Deadline: 'deadline',
};

/* ─── Constants ───────────────────────────────────────────────────────────── */
const COLOR = {
  amber:   { soft: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',    stroke: '#f59e0b' },
  blue:    { soft: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',         stroke: '#3b82f6' },
  violet:  { soft: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400', stroke: '#a855f7' },
  emerald: { soft: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400', stroke: '#10b981' },
};

const tooltipStyle = {
  borderRadius: '12px', border: 'none',
  boxShadow: '0 8px 24px -6px rgb(0 0 0 / 0.15)', fontSize: '12px', fontWeight: 600,
};

/* ─── Sub-components ──────────────────────────────────────────────────────── */
const Sparkline = ({ data, stroke }) => (
  <ResponsiveContainer width="100%" height={40}>
    <LineChart data={data.map((v, i) => ({ i, v }))}>
      <Line type="monotone" dataKey="v" stroke={stroke} strokeWidth={2} dot={false} />
    </LineChart>
  </ResponsiveContainer>
);

const KpiCard = ({ label, value, delta, icon: Icon, color, spark, index }) => {
  const c  = COLOR[color];
  const up = delta >= 0;
  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-2xl ${c.soft}`}><Icon size={20} /></div>
        <span className={`flex items-center gap-0.5 text-[11px] font-black px-2 py-1 rounded-lg ${
          up ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/20'
        }`}>
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {up ? '+' : ''}{delta}
        </span>
      </div>
      <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">{value}</p>
      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight mt-1.5">{label}</p>
      <div className="mt-2 -mx-1"><Sparkline data={spark} stroke={c.stroke} /></div>
    </div>
  );
};

const Panel = ({ title, icon: Icon, accent = 'text-amber-500', children, className = '', action }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm ${className}`}>
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
        <Icon size={18} className={accent} /> {title}
      </h3>
      {action}
    </div>
    {children}
  </div>
);

const EmptyState = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-400">
    <Sparkles size={22} className="opacity-30" />
    <p className="text-xs font-bold">{label}</p>
  </div>
);

/* ─── AI Insights derived from real data ─────────────────────────────────── */
const deriveInsights = (stats) => {
  if (!stats) return [];
  const insights = [];
  const { counts, byLawyer, upcomingDeadlines } = stats;

  // Overloaded lawyer
  if (byLawyer?.length > 0) {
    const top = byLawyer[0];
    const avg = byLawyer.reduce((s, l) => s + l.cases, 0) / byLawyer.length;
    if (top.cases > avg * 2) {
      insights.push({
        id: 'overload', severity: 'warning', Icon: ShieldAlert,
        title: 'Overload Detected',
        text: `${top.name} is handling ${top.cases} active cases vs. a firm average of ${Math.round(avg)}. Risk of overload on upcoming deadlines.`,
        tag: 'Team Load',
      });
    }
  }

  // Urgent upcoming deadlines
  const urgentCount = upcomingDeadlines?.filter((d) => {
    const days = Math.ceil((new Date(d.dueAt) - Date.now()) / 86400000);
    return days <= 7;
  }).length ?? 0;
  if (urgentCount > 0) {
    insights.push({
      id: 'deadlines', severity: 'danger', Icon: AlertTriangle,
      title: `${urgentCount} Deadline${urgentCount > 1 ? 's' : ''} Within 7 Days`,
      text: `${urgentCount} case${urgentCount > 1 ? 's have' : ' has'} an imminent deadline. Review and file before the due date.`,
      tag: 'Deadlines',
    });
  }

  // Document growth
  if (counts?.totalDocuments > 0 && stats.deltas?.totalDocuments > 0) {
    const pct = Math.round((stats.deltas.totalDocuments / (counts.totalDocuments - stats.deltas.totalDocuments || 1)) * 100);
    if (pct >= 5) {
      insights.push({
        id: 'docs', severity: 'success', Icon: TrendingUp,
        title: 'Document Activity Rising',
        text: `${stats.deltas.totalDocuments} new document${stats.deltas.totalDocuments > 1 ? 's' : ''} added this month (+${pct}%). The firm's knowledge base is growing.`,
        tag: 'Performance',
      });
    }
  }

  // Fallback when everything is healthy
  if (insights.length === 0) {
    insights.push({
      id: 'ok', severity: 'success', Icon: TrendingUp,
      title: 'Firm Running Smoothly',
      text: `${counts?.activeCases ?? 0} active cases, ${counts?.pendingDeadlines ?? 0} upcoming deadlines. No critical issues detected.`,
      tag: 'Status',
    });
  }

  return insights;
};

const SEVERITY_STYLE = {
  warning: { ring: 'border-amber-200 dark:border-amber-900/40',    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',    icon: 'text-amber-500' },
  danger:  { ring: 'border-rose-200 dark:border-rose-900/40',      chip: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',        icon: 'text-rose-500'  },
  success: { ring: 'border-emerald-200 dark:border-emerald-900/40', chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: 'text-emerald-500' },
};

/* ════════════════════════════════════════════════════════════════════════════ */
const DashboardView = () => {
  const { currentUser } = useLexStore();
  const navigate        = useNavigate();
  const { data: stats, isLoading, isError, refetch, isFetching } = useDashboardStats();

  const insights   = useMemo(() => deriveInsights(stats), [stats]);
  const totalCases = useMemo(() => stats?.byStatus?.reduce((a, b) => a + b.value, 0) ?? 0, [stats]);

  /* ── skeleton helper ── */
  const Skeleton = ({ className }) => (
    <div className={`bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse ${className}`} />
  );

  if (isLoading) {
    return (
      <div className="space-y-8 pb-12">
        <div className="flex items-end justify-between">
          <div className="space-y-2"><Skeleton className="h-6 w-32" /><Skeleton className="h-10 w-56" /><Skeleton className="h-4 w-64" /></div>
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-3xl" />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Skeleton className="h-80 xl:col-span-2 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle size={36} className="text-rose-400" />
        <p className="text-sm font-bold text-slate-500">Failed to load dashboard data.</p>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const { counts, deltas, byStatus, byLawyer, upcomingDeadlines, weeklyActivity, recentActivity } = stats;

  const kpis = [
    { id: 'cases',     label: 'Active Cases',       value: counts.activeCases,      delta: deltas.activeCases,      icon: Briefcase,    color: 'amber',   spark: weeklyActivity.map((w) => w.cases)     },
    { id: 'deadlines', label: 'Upcoming Deadlines', value: counts.pendingDeadlines, delta: deltas.pendingDeadlines, icon: CalendarClock, color: 'blue',    spark: weeklyActivity.map((w) => w.deadlines) },
    { id: 'docs',      label: 'Total Documents',    value: counts.totalDocuments,   delta: deltas.totalDocuments,   icon: FileText,     color: 'violet',  spark: weeklyActivity.map((_, i) => Math.max(0, counts.totalDocuments - (weeklyActivity.length - 1 - i) * Math.ceil(deltas.totalDocuments / 8 || 1))) },
    { id: 'clients',   label: 'Active Clients',     value: counts.totalClients,     delta: deltas.totalClients,     icon: Users,        color: 'emerald', spark: weeklyActivity.map((_, i) => Math.max(0, counts.totalClients - (weeklyActivity.length - 1 - i) * Math.abs(Math.ceil(deltas.totalClients / 8 || 0)))) },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{greeting()},</p>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {currentUser?.firstName || 'Counselor'} {currentUser?.lastName || ''}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Here is your firm's status for today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
            title="Refresh"
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-sm">
            <Activity size={14} className="text-emerald-500" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </header>

      {/* AI Insights */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
            <Sparkles size={16} />
          </div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">AI Analysis</h2>
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
            Lex Analyst
          </span>
          <span className="text-[10px] text-slate-400 ml-auto hidden sm:block">Based on live data</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((ins, i) => {
            const s = SEVERITY_STYLE[ins.severity];
            return (
              <div
                key={ins.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border ${s.ring} p-4 shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-4 duration-500`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`flex items-center gap-2 ${s.icon}`}>
                    <ins.Icon size={18} />
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">{ins.title}</h4>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${s.chip}`}>{ins.tag}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{ins.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => <KpiCard key={k.id} {...k} index={i} />)}
      </section>

      {/* Bento row 1: Activity chart + Status donut */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Panel title="Firm Activity" icon={TrendingUp} accent="text-blue-500" className="xl:col-span-2"
          action={<span className="text-[11px] font-bold text-slate-400">Last 8 weeks</span>}
        >
          {weeklyActivity.every((w) => w.cases === 0 && w.deadlines === 0) ? (
            <EmptyState label="No activity recorded yet" />
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyActivity} margin={{ left: -20, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="gCases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gDeadlines" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.4} />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="cases"     name="Cases"     stroke="#f59e0b" strokeWidth={2.5} fill="url(#gCases)"     />
                  <Area type="monotone" dataKey="deadlines" name="Deadlines" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gDeadlines)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Distribution" icon={Scale} accent="text-violet-500">
          {byStatus.length === 0 ? (
            <EmptyState label="No cases yet" />
          ) : (
            <>
              <div className="h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={58} outerRadius={85} paddingAngle={3} stroke="none">
                      {byStatus.map((e) => <Cell key={e.name} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{totalCases}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cases</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {byStatus.map((s) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">{s.name}</span>
                    <span className="text-[11px] font-black text-slate-900 dark:text-white ml-auto">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Panel>
      </section>

      {/* Bento row 2: Deadlines + Lawyers + Recent activity */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Critical deadlines */}
        <Panel title="Upcoming Deadlines" icon={Zap} accent="text-rose-500"
          action={
            <button
              onClick={() => navigate('/calendar')}
              className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5 hover:gap-1 transition-all"
            >
              View all <ChevronRight size={13} />
            </button>
          }
        >
          {upcomingDeadlines.length === 0 ? (
            <EmptyState label="No upcoming deadlines" />
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800 transition-all cursor-pointer">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    d.priority === 'URGENT' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/20'
                    : d.priority === 'HIGH'   ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/20'
                    : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20'
                  }`}>
                    <Clock size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{d.title}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{d.case?.title ?? '—'}</p>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 whitespace-nowrap">{daysUntil(d.dueAt)}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Workload by member */}
        <Panel title="Workload by Member" icon={Users} accent="text-blue-500">
          {byLawyer.length === 0 ? (
            <EmptyState label="No workload data" />
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byLawyer} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.4} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={64} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5f9', opacity: 0.5 }} />
                  <Bar dataKey="cases" name="Cases" radius={[0, 6, 6, 0]} barSize={18}>
                    {byLawyer.map((_, i) => (
                      <Cell key={i} fill={i === 0 && byLawyer[0].cases > (byLawyer.reduce((s, l) => s + l.cases, 0) / byLawyer.length) * 2 ? '#f43f5e' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        {/* Recent activity */}
        <Panel title="Recent Activity" icon={Activity} accent="text-emerald-500">
          {recentActivity.length === 0 ? (
            <EmptyState label="No activity yet" />
          ) : (
            <div className="space-y-4">
              {recentActivity.map((a) => {
                const who  = a.user ? `${a.user.firstName} ${a.user.lastName}`.trim() : 'System';
                const what = `${ACTION_LABEL[a.action] ?? a.action} a ${ENTITY_LABEL[a.entity] ?? a.entity}`;
                const name = a.details?.after?.title ?? a.details?.before?.title ?? a.entityId.slice(0, 8);
                return (
                  <div key={a.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 dark:text-slate-400 flex-shrink-0">
                      {who.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                        <span className="font-black text-slate-900 dark:text-white">{who}</span>{' '}
                        {what}{' '}
                        <span className="font-bold text-amber-600 dark:text-amber-400 truncate">{name}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(a.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </section>
    </div>
  );
};

export default DashboardView;

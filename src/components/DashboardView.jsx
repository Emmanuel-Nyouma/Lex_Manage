import React from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Briefcase, Clock, FileText, Users, TrendingUp, TrendingDown,
  Sparkles, AlertTriangle, ArrowUpRight, CheckCircle2, Scale,
  Activity, ChevronRight, Zap, ShieldAlert, CalendarClock,
} from 'lucide-react';
import useLexStore from '../store/useLexStore';

/* ════════════════════════════════════════════════════════════════════════
   ⚠️ PROTOTYPE — toutes les données ci-dessous sont FICTIVES (mock).
   À remplacer par les hooks réels (useStats / useAiInsights) au câblage.
═══════════════════════════════════════════════════════════════════════════ */

const MOCK = {
  kpis: [
    { id: 'cases',     label: 'Dossiers actifs',     value: 47,  delta: +12, icon: Briefcase, color: 'amber',
      spark: [30, 32, 31, 35, 38, 40, 44, 47] },
    { id: 'deadlines', label: 'Échéances à venir',   value: 18,  delta: +5,  icon: CalendarClock, color: 'blue',
      spark: [10, 12, 11, 14, 13, 15, 16, 18] },
    { id: 'docs',      label: 'Documents analysés',  value: 312, delta: +23, icon: FileText, color: 'violet',
      spark: [180, 200, 220, 245, 260, 280, 300, 312] },
    { id: 'clients',   label: 'Clients actifs',      value: 29,  delta: -2,  icon: Users, color: 'emerald',
      spark: [31, 31, 30, 30, 31, 30, 30, 29] },
  ],

  insights: [
    {
      id: 1, severity: 'warning', icon: ShieldAlert,
      title: 'Surcharge détectée',
      text: 'Me Diallo porte 12 dossiers actifs contre une moyenne de 4 dans le cabinet. Risque de surcharge sur les délais à venir.',
      tag: 'Charge équipe',
    },
    {
      id: 2, severity: 'danger', icon: AlertTriangle,
      title: '3 audiences sous 7 jours',
      text: '3 dossiers ont une audience imminente sans pièce déposée. Action recommandée avant le 10 juin.',
      tag: 'Échéances',
    },
    {
      id: 3, severity: 'success', icon: TrendingUp,
      title: 'Productivité en hausse',
      text: 'Le volume de documents traités a augmenté de 23 % cette semaine. Le délai moyen de clôture passe de 42 à 36 jours.',
      tag: 'Performance',
    },
  ],

  activity: [
    { week: 'S-7', dossiers: 4, delais: 6 },
    { week: 'S-6', dossiers: 6, delais: 5 },
    { week: 'S-5', dossiers: 5, delais: 8 },
    { week: 'S-4', dossiers: 8, delais: 7 },
    { week: 'S-3', dossiers: 7, delais: 10 },
    { week: 'S-2', dossiers: 11, delais: 9 },
    { week: 'S-1', dossiers: 9, delais: 12 },
    { week: 'S',   dossiers: 13, delais: 11 },
  ],

  byStatus: [
    { name: 'Ouverts',     value: 22, color: '#f59e0b' },
    { name: 'En cours',    value: 15, color: '#3b82f6' },
    { name: 'En attente',  value: 6,  color: '#a855f7' },
    { name: 'Clôturés',    value: 9,  color: '#10b981' },
  ],

  byLawyer: [
    { name: 'Diallo',  dossiers: 12 },
    { name: 'Traoré',  dossiers: 8 },
    { name: 'Koné',    dossiers: 6 },
    { name: 'Bensaïd', dossiers: 5 },
    { name: 'Mensah',  dossiers: 4 },
  ],

  deadlines: [
    { id: 1, title: 'Dépôt conclusions — Aff. Kouassi', when: 'Dans 2 jours', priority: 'URGENT', case: 'Kouassi c/ État' },
    { id: 2, title: 'Audience plaidoirie — Aff. Sarr',  when: 'Dans 4 jours', priority: 'HIGH',   case: 'Sarr Industries' },
    { id: 3, title: 'Signature protocole — Aff. Diop',  when: 'Dans 6 jours', priority: 'MEDIUM', case: 'Diop & Fils' },
  ],

  recent: [
    { id: 1, who: 'Awa Traoré',   what: 'a clôturé le dossier', target: 'Mensah c/ Banque Atlantique', when: 'Il y a 12 min' },
    { id: 2, who: 'Karim Bensaïd', what: 'a téléversé 4 pièces sur', target: 'Sarr Industries', when: 'Il y a 1 h' },
    { id: 3, who: 'Système',       what: 'a programmé un rappel pour', target: 'Audience Kouassi', when: 'Il y a 3 h' },
    { id: 4, who: 'Fatou Koné',    what: 'a créé le dossier', target: 'SCI Les Palmiers', when: 'Il y a 5 h' },
  ],
};

const COLOR = {
  amber:   { soft: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',   stroke: '#f59e0b' },
  blue:    { soft: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',        stroke: '#3b82f6' },
  violet:  { soft: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400', stroke: '#a855f7' },
  emerald: { soft: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400', stroke: '#10b981' },
};

const SEVERITY = {
  warning: { ring: 'border-amber-200 dark:border-amber-900/40',  chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',   icon: 'text-amber-500' },
  danger:  { ring: 'border-rose-200 dark:border-rose-900/40',    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',       icon: 'text-rose-500' },
  success: { ring: 'border-emerald-200 dark:border-emerald-900/40', chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: 'text-emerald-500' },
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

/* ─── Sparkline ──────────────────────────────────────────────────────────── */
const Sparkline = ({ data, stroke }) => (
  <ResponsiveContainer width="100%" height={40}>
    <LineChart data={data.map((v, i) => ({ i, v }))}>
      <Line type="monotone" dataKey="v" stroke={stroke} strokeWidth={2} dot={false} />
    </LineChart>
  </ResponsiveContainer>
);

/* ─── KPI card ───────────────────────────────────────────────────────────── */
const KpiCard = ({ kpi, index }) => {
  const Icon = kpi.icon;
  const c = COLOR[kpi.color];
  const up = kpi.delta >= 0;
  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-2xl ${c.soft}`}>
          <Icon size={20} />
        </div>
        <span className={`flex items-center gap-0.5 text-[11px] font-black px-2 py-1 rounded-lg ${
          up ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/20'
        }`}>
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {up ? '+' : ''}{kpi.delta}
        </span>
      </div>
      <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">{kpi.value}</p>
      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight mt-1.5">{kpi.label}</p>
      <div className="mt-2 -mx-1">
        <Sparkline data={kpi.spark} stroke={c.stroke} />
      </div>
    </div>
  );
};

/* ─── AI Insight card ────────────────────────────────────────────────────── */
const InsightCard = ({ insight, index }) => {
  const s = SEVERITY[insight.severity];
  const Icon = insight.icon;
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border ${s.ring} p-4 shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-4 duration-500`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center gap-2 ${s.icon}`}>
          <Icon size={18} />
          <h4 className="font-black text-sm text-slate-900 dark:text-white">{insight.title}</h4>
        </div>
        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${s.chip}`}>
          {insight.tag}
        </span>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{insight.text}</p>
    </div>
  );
};

/* ─── Chart card wrapper ─────────────────────────────────────────────────── */
const Panel = ({ title, icon: _Icon, accent = 'text-amber-500', children, className = '', action }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm ${className}`}>
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
        <_Icon size={18} className={accent} /> {title}
      </h3>
      {action}
    </div>
    {children}
  </div>
);

const tooltipStyle = {
  borderRadius: '12px', border: 'none',
  boxShadow: '0 8px 24px -6px rgb(0 0 0 / 0.15)', fontSize: '12px', fontWeight: 600,
};

/* ════════════════════════════════════════════════════════════════════════ */
const DashboardView = () => {
  const { currentUser } = useLexStore();
  const totalCases = MOCK.byStatus.reduce((a, b) => a + b.value, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">

      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{greeting()},</p>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {currentUser?.firstName || 'Maître'} {currentUser?.lastName || ''}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Voici l'état de votre cabinet aujourd'hui.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-sm">
          <Activity size={14} className="text-emerald-500" />
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </header>

      {/* ── AI Insights (analyste proactif) ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
            <Sparkles size={16} />
          </div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Analyse IA
          </h2>
          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
            Lex Analyst
          </span>
          <span className="text-[10px] text-slate-400 ml-auto hidden sm:block">Généré il y a quelques instants</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MOCK.insights.map((ins, i) => <InsightCard key={ins.id} insight={ins} index={i} />)}
        </div>
      </section>

      {/* ── KPI row ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK.kpis.map((k, i) => <KpiCard key={k.id} kpi={k} index={i} />)}
      </section>

      {/* ── Bento row 1: Activity + Status donut ── */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Panel title="Activité du cabinet" icon={TrendingUp} accent="text-blue-500" className="xl:col-span-2"
          action={<span className="text-[11px] font-bold text-slate-400">8 dernières semaines</span>}>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK.activity} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gDossiers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDelais" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.4} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="dossiers" name="Dossiers" stroke="#f59e0b" strokeWidth={2.5} fill="url(#gDossiers)" />
                <Area type="monotone" dataKey="delais" name="Délais" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gDelais)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Répartition" icon={Scale} accent="text-violet-500">
          <div className="h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={MOCK.byStatus} dataKey="value" nameKey="name" innerRadius={58} outerRadius={85} paddingAngle={3} stroke="none">
                  {MOCK.byStatus.map((e) => <Cell key={e.name} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-slate-900 dark:text-white">{totalCases}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dossiers</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {MOCK.byStatus.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{s.name}</span>
                <span className="text-[11px] font-black text-slate-900 dark:text-white ml-auto">{s.value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      {/* ── Bento row 2: Deadlines + Lawyers + Activity ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Critical deadlines */}
        <Panel title="Échéances critiques" icon={Zap} accent="text-rose-500"
          action={<button className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5 hover:gap-1 transition-all">Tout voir <ChevronRight size={13} /></button>}>
          <div className="space-y-3">
            {MOCK.deadlines.map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800 transition-all group cursor-pointer">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  d.priority === 'URGENT' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/20'
                  : d.priority === 'HIGH' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/20'
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20'
                }`}>
                  <Clock size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{d.title}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{d.case}</p>
                </div>
                <span className="text-[10px] font-black text-slate-400 whitespace-nowrap">{d.when}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Workload by lawyer */}
        <Panel title="Charge par avocat" icon={Users} accent="text-blue-500">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK.byLawyer} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.4} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={60} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5f9', opacity: 0.5 }} />
                <Bar dataKey="dossiers" name="Dossiers" radius={[0, 6, 6, 0]} barSize={18}>
                  {MOCK.byLawyer.map((e, i) => <Cell key={i} fill={i === 0 ? '#f43f5e' : '#3b82f6'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Recent activity */}
        <Panel title="Activité récente" icon={Activity} accent="text-emerald-500">
          <div className="space-y-4">
            {MOCK.recent.map((a) => (
              <div key={a.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 dark:text-slate-400 flex-shrink-0">
                  {a.who.split(' ').map(w => w[0]).slice(0, 2).join('')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                    <span className="font-black text-slate-900 dark:text-white">{a.who}</span> {a.what}{' '}
                    <span className="font-bold text-amber-600 dark:text-amber-400">{a.target}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{a.when}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      {/* Prototype banner */}
      <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400 dark:text-slate-600 bg-slate-100/50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl py-2.5">
        <Sparkles size={12} /> Prototype — données fictives. Le câblage backend (stats réelles + insights IA) viendra ensuite.
      </div>
    </div>
  );
};

export default DashboardView;

import React, { useState, useMemo } from 'react';
import {
  Users, Search, Mail, Briefcase, ChevronDown, ChevronUp,
  Shield, Scale, User, Star, Loader2, AlertCircle,
} from 'lucide-react';
import useTranslation from '../hooks/useTranslation';
import { useColleagues } from '../hooks/useCases';
import useLexStore from '../store/useLexStore';

/* ─── Role config ─────────────────────────────────────────────────────────── */
const ROLES = {
  CABINET_ADMIN: {
    label: { en: 'Admin',       fr: 'Admin'      },
    icon: Shield,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    dot:   'bg-purple-500',
  },
  SUPER_ADMIN: {
    label: { en: 'Super Admin', fr: 'Super Admin' },
    icon: Star,
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    dot:   'bg-red-500',
  },
  LAWYER: {
    label: { en: 'Lawyer',      fr: 'Avocat'      },
    icon: Scale,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    dot:   'bg-blue-500',
  },
  PARALEGAL: {
    label: { en: 'Paralegal',   fr: 'Juriste'     },
    icon: User,
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    dot:   'bg-teal-500',
  },
};

const PRIORITY_COLOR = {
  URGENT:    'text-rose-600 dark:text-rose-400',
  HIGH:      'text-amber-600 dark:text-amber-400',
  MEDIUM:    'text-blue-600 dark:text-blue-400',
  LOW:       'text-slate-500 dark:text-slate-400',
};

const STATUS_COLOR = {
  OPEN:        'bg-amber-400',
  IN_PROGRESS: 'bg-blue-400',
  PENDING:     'bg-purple-400',
  CLOSED:      'bg-emerald-400',
  ARCHIVED:    'bg-slate-400',
};

/* ─── Avatar ──────────────────────────────────────────────────────────────── */
const Avatar = ({ name, size = 'lg' }) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const PALETTE = [
    'from-amber-400 to-orange-500',
    'from-blue-400 to-indigo-500',
    'from-teal-400 to-emerald-500',
    'from-purple-400 to-violet-500',
    'from-rose-400 to-pink-500',
    'from-cyan-400 to-sky-500',
  ];
  const gradient = PALETTE[(name.charCodeAt(0) || 0) % PALETTE.length];
  const sz = size === 'lg' ? 'w-16 h-16 text-xl' : 'w-10 h-10 text-sm';

  return (
    <div className={`${sz} rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black shadow-lg flex-shrink-0`}>
      {initials || '?'}
    </div>
  );
};

/* ─── Colleague card ──────────────────────────────────────────────────────── */
const ColleagueCard = ({ colleague, t, language, isSelf }) => {
  const [expanded, setExpanded] = useState(false);
  const role = ROLES[colleague.role] || ROLES.LAWYER;
  const RoleIcon = role.icon;
  const fullName = `${colleague.firstName} ${colleague.lastName}`.trim();
  const caseCount = colleague.cases?.length ?? 0;
  const caseLabel = caseCount === 1 ? t.colleagues_cases : t.colleagues_cases_pl;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden ${
      isSelf ? 'border-amber-300 dark:border-amber-700 ring-1 ring-amber-300/50' : 'border-slate-200 dark:border-slate-800'
    }`}>
      {/* Card header */}
      <div className="p-6 pb-4">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar name={fullName} size="lg" />
            {isSelf && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                <Star size={8} className="text-white" fill="white" />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
                {fullName}
              </h3>
              {isSelf && (
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  You
                </span>
              )}
            </div>

            {/* Role badge */}
            <span className={`inline-flex items-center gap-1.5 mt-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg ${role.color}`}>
              <RoleIcon size={11} />
              {role.label[language] ?? role.label.en}
            </span>
          </div>
        </div>

        {/* Email */}
        <a
          href={`mailto:${colleague.email}`}
          className="mt-4 flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group w-fit"
        >
          <Mail size={13} className="flex-shrink-0 group-hover:text-amber-500" />
          <span className="truncate">{colleague.email}</span>
        </a>
      </div>

      {/* Divider */}
      <div className="mx-6 border-t border-slate-100 dark:border-slate-800" />

      {/* Cases section */}
      <div className="p-4 px-6">
        <button
          onClick={() => caseCount > 0 && setExpanded((e) => !e)}
          className={`w-full flex items-center justify-between group ${caseCount > 0 ? 'cursor-pointer' : 'cursor-default'}`}
          disabled={caseCount === 0}
        >
          <div className="flex items-center gap-2">
            <Briefcase size={14} className={caseCount > 0 ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'} />
            <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">
              {t.colleagues_cases_label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${
              caseCount === 0
                ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                : caseCount >= 8
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {caseCount} {caseLabel}
            </span>
            {caseCount > 0 && (
              expanded
                ? <ChevronUp size={14} className="text-slate-400" />
                : <ChevronDown size={14} className="text-slate-400" />
            )}
          </div>
        </button>

        {caseCount === 0 && (
          <p className="text-[11px] text-slate-400 italic mt-2">{t.colleagues_no_cases}</p>
        )}

        {expanded && caseCount > 0 && (
          <ul className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            {colleague.cases.map((c) => (
              <li key={c.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${STATUS_COLOR[c.status] || 'bg-slate-400'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate">{c.title}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-wide mt-0.5 ${PRIORITY_COLOR[c.priority] || 'text-slate-400'}`}>
                    {c.priority} · {c.status.replace('_', ' ')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════ */
const ColleaguesView = () => {
  const { t, language }   = useTranslation();
  const { currentUser }   = useLexStore();
  const { data: colleagues = [], isLoading, isError } = useColleagues();

  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const roleOptions = useMemo(() => {
    const seen = new Set(colleagues.map((c) => c.role));
    return ['ALL', ...Object.keys(ROLES).filter((r) => seen.has(r))];
  }, [colleagues]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return colleagues.filter((c) => {
      const name = `${c.firstName} ${c.lastName}`.toLowerCase();
      const matchSearch = !q || name.includes(q) || c.email?.toLowerCase().includes(q);
      const matchRole   = roleFilter === 'ALL' || c.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [colleagues, search, roleFilter]);

  const totalCases = colleagues.reduce((acc, c) => acc + (c.cases?.length ?? 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Users size={16} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {t.colleagues_title}
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            {t.colleagues_subtitle}
          </p>
        </div>

        {/* Summary pills */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-sm">
            <Users size={14} className="text-blue-500" />
            {colleagues.length} {colleagues.length === 1 ? 'member' : 'members'}
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-sm">
            <Briefcase size={14} className="text-amber-500" />
            {totalCases} active {totalCases === 1 ? 'case' : 'cases'}
          </div>
        </div>
      </header>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.colleagues_search}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white placeholder:text-slate-400"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {roleOptions.map((r) => {
            const cfg   = ROLES[r];
            const label = r === 'ALL'
              ? t.colleagues_filter_all
              : (cfg?.label[language] ?? cfg?.label.en ?? r);
            return (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-4 py-2.5 rounded-2xl text-[12px] font-bold transition-all border ${
                  roleFilter === r
                    ? 'bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-500/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* States */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <p className="text-sm font-bold text-slate-400">Loading colleagues…</p>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <AlertCircle size={32} className="text-rose-400" />
          <p className="text-sm font-bold text-rose-500">Failed to load colleagues.</p>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Users size={36} className="text-slate-300 dark:text-slate-700" />
          <p className="text-sm font-bold text-slate-400 italic">{t.colleagues_empty}</p>
        </div>
      )}

      {/* Grid */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((col) => (
            <ColleagueCard
              key={col.id}
              colleague={col}
              t={t}
              language={language}
              isSelf={col.id === currentUser?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ColleaguesView;

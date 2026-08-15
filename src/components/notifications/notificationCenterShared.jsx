import React, { useId } from 'react';
import { LEVEL_CONFIG, STATUS_CONFIG } from './notificationCenterData';

// ─── Small shared helpers ────────────────────────────────────────────────────

const LevelBadge = ({ level }) => {
  const cfg = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.NORMAL;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${cfg.color}`}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${cfg.color}`}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
};

const NField = ({ label, required, id, ...props }) => {
  const generatedId = useId();
  const fieldId = id || generatedId;
  return (
    <div>
      <label htmlFor={fieldId} className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
        {label}
      </label>
      <input
        id={fieldId}
        required={required}
        className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white placeholder:text-slate-400"
        {...props}
      />
    </div>
  );
};

const NSelect = ({ label, children, id, ...props }) => {
  const generatedId = useId();
  const fieldId = id || generatedId;
  return (
    <div>
      <label htmlFor={fieldId} className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
        {label}
      </label>
      <select
        id={fieldId}
        className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white appearance-none"
        {...props}
      >
        {children}
      </select>
    </div>
  );
};

const Detail = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">{value}</div>
  </div>
);

const Empty = ({ icon: _Icon, text }) => (
  <div className="text-center py-16 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
    <_Icon className="text-slate-300 dark:text-slate-700 mx-auto mb-3" size={36} />
    <p className="text-slate-400 italic text-sm">{text}</p>
  </div>
);

export {
  LevelBadge,
  StatusBadge,
  NField,
  NSelect,
  Detail,
  Empty,
};

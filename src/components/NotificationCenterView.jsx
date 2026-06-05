import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, History, BookTemplate, CalendarClock, Plus, Trash2, Loader2,
  Send, Check, Info, AlertTriangle, AlertOctagon, ChevronDown,
  Users, Briefcase, X, Clock, CheckCircle2, XCircle, RefreshCw,
  Copy, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api';
import { Card, Badge, Button } from './ui';
import { MOTIF_OPTIONS, LEVEL_MAP, MOTIF_LEVEL_CONSTRAINTS, ROLE_OPTIONS } from '../lib/schemas/notification.schema';
import { useCases } from '../hooks/useCases';
import useLexStore from '../store/useLexStore';
import SendNotificationDialog from './SendNotificationDialog';

// ─── Constants ───────────────────────────────────────────────────────────────

const LEVEL_CONFIG = {
  NORMAL:    { label: 'Normal',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',   icon: Info },
  IMPORTANT: { label: 'Important', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: AlertTriangle },
  URGENT:    { label: 'Urgent',    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',       icon: AlertOctagon },
};

const STATUS_CONFIG = {
  PENDING:   { label: 'Scheduled', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  SENT:      { label: 'Sent',      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelled', color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',  icon: XCircle },
};

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

const motifLabel = (m) => MOTIF_OPTIONS.find(o => o.value === m)?.label ?? m;

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function countdown(scheduledAt) {
  const diff = new Date(scheduledAt) - Date.now();
  if (diff <= 0) return 'imminente';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `dans ${d}j ${h}h`;
  if (h > 0) return `dans ${h}h ${m}m`;
  return `dans ${m} min`;
}

// ─── Tab: History ────────────────────────────────────────────────────────────

const HistoryTab = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get('/notifications/history');
      setHistory(data);
    } catch { toast.error('Failed to load history'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-amber-500" size={28} />
    </div>
  );

  if (!history.length) return (
    <Empty icon={History} text="No notifications sent yet." />
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          {history.length} notification{history.length > 1 ? 's' : ''} envoyée{history.length > 1 ? 's' : ''}
        </p>
        <button onClick={load} className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-500 transition-colors">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {history.map((n) => {
        const isOpen = expanded === n.id;
        return (
          <div
            key={n.id}
            className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden"
          >
            {/* Row */}
            <div
              className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              onClick={() => setExpanded(isOpen ? null : n.id)}
            >
              <LevelBadge level={n.level} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {n.title || motifLabel(n.motif)}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {n.message || '—'}
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{fmtDate(n.createdAt)}</span>
                {n.createdBy && (
                  <span className="text-[10px] text-slate-400">
                    par {n.createdBy.firstName} {n.createdBy.lastName}
                  </span>
                )}
              </div>
              <ChevronDown size={16} className={`text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Expanded detail */}
            {isOpen && (
              <div className="px-5 pb-4 pt-0 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                  <Detail label="Motif"     value={motifLabel(n.motif)} />
                  <Detail label="Level"     value={<LevelBadge level={n.level} />} />
                  <Detail label="Dossier"   value={n.case ? `${n.case.title}` : '—'} />
                  <Detail label="Recipients"
                    value={n.recipientIds?.length ? `${n.recipientIds.length} users` : 'Tout le cabinet'} />
                </div>
                {n.message && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800">
                    {n.message}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Tab: Templates ──────────────────────────────────────────────────────────

const TemplatesTab = ({ onUseTemplate }) => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get('/notifications/templates');
      setTemplates(data);
    } catch { toast.error('Failed to load templates'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/notifications/templates/${id}`);
      toast.success('Template deleted');
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch { toast.error('Failed to delete template'); }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          {templates.length} template{templates.length !== 1 ? 's' : ''}
        </p>
        <Button icon={Plus} onClick={() => setShowForm(v => !v)} className="text-sm">
          {showForm ? 'Cancel' : 'New Template'}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-6 animate-in slide-in-from-top-4 duration-300">
          <TemplateForm onCreated={(t) => { setTemplates(prev => [t, ...prev]); setShowForm(false); }} />
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-amber-500" size={28} /></div>
      ) : templates.length === 0 ? (
        <Empty icon={BookTemplate} text="No templates yet. Create one to speed up your notifications." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onDelete={() => handleDelete(t.id)}
              onUse={() => onUseTemplate(t)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TemplateCard = ({ template: t, onDelete, onUse }) => (
  <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col gap-3 group">
    <div className="flex items-start justify-between gap-2">
      <h4 className="font-black text-slate-900 dark:text-white text-sm leading-tight">{t.name}</h4>
      <button
        onClick={onDelete}
        className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
        title="Delete template"
      >
        <Trash2 size={14} />
      </button>
    </div>

    <div className="flex flex-wrap gap-1.5">
      <LevelBadge level={t.level} />
      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
        {motifLabel(t.motif)}
      </span>
    </div>

    {t.title && <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t.title}</p>}
    {t.message && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{t.message}</p>}

    {t.recipientRoles?.length > 0 && (
      <div className="flex items-center gap-1 text-[10px] text-slate-400">
        <Users size={11} /> {t.recipientRoles.join(', ')}
      </div>
    )}

    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
      <span className="text-[10px] text-slate-400">
        {t.createdBy ? `${t.createdBy.firstName} ${t.createdBy.lastName}` : '—'}
      </span>
      <Button
        icon={Send}
        onClick={onUse}
        className="text-[11px] py-1.5 px-3 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
      >
        Use
      </Button>
    </div>
  </Card>
);

const TemplateForm = ({ onCreated }) => {
  const [form, setForm] = useState({
    name: '', level: 'NORMAL', motif: 'INTERNAL_REMINDER',
    title: '', message: '', recipientRoles: [],
  });
  const [isSaving, setIsSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleRole = (r) => set('recipientRoles',
    form.recipientRoles.includes(r)
      ? form.recipientRoles.filter(x => x !== r)
      : [...form.recipientRoles, r]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Template name is required'); return; }
    setIsSaving(true);
    try {
      const { data } = await apiClient.post('/notifications/templates', form);
      toast.success('Template created');
      onCreated(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create template');
    } finally { setIsSaving(false); }
  };

  return (
    <Card className="p-6 border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-900/5">
      <h4 className="font-black text-slate-900 dark:text-white mb-5 flex items-center gap-2">
        <BookTemplate size={16} className="text-amber-500" /> New Template
      </h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NField label="Template name *" placeholder="ex: Rappel audience" value={form.name} onChange={e => set('name', e.target.value)} required />
          <NField label="Subject" placeholder="ex: Audience reportée" value={form.title} onChange={e => set('title', e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NSelect label="Level" value={form.level} onChange={e => set('level', e.target.value)}>
            <option value="NORMAL">Normal</option>
            <option value="IMPORTANT">Important</option>
            <option value="URGENT">Urgent</option>
          </NSelect>
          <NSelect label="Motif" value={form.motif} onChange={e => set('motif', e.target.value)}>
            {MOTIF_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </NSelect>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Message</label>
          <textarea
            rows={3}
            placeholder="Message par défaut du template…"
            value={form.message}
            onChange={e => set('message', e.target.value)}
            className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white resize-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Default Recipients</label>
          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => toggleRole(r.value)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                  form.recipientRoles.includes(r.value)
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={isSaving} icon={Check}>Save Template</Button>
        </div>
      </form>
    </Card>
  );
};

// ─── Tab: Scheduled ──────────────────────────────────────────────────────────

const ScheduledTab = () => {
  const [scheduled, setScheduled] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [cancelling, setCancelling] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get('/notifications/scheduled');
      setScheduled(data);
    } catch { toast.error('Failed to load scheduled notifications'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (id) => {
    setCancelling(id);
    try {
      await apiClient.delete(`/notifications/scheduled/${id}`);
      toast.success('Scheduled notification cancelled');
      setScheduled(prev => prev.map(s => s.id === id ? { ...s, status: 'CANCELLED' } : s));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally { setCancelling(null); }
  };

  const pending   = scheduled.filter(s => s.status === 'PENDING');
  const past      = scheduled.filter(s => s.status !== 'PENDING');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          {pending.length} en attente · {past.length} passées
        </p>
        <Button icon={Plus} onClick={() => setShowForm(v => !v)} className="text-sm">
          {showForm ? 'Cancel' : 'Schedule Notification'}
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 animate-in slide-in-from-top-4 duration-300">
          <ScheduleForm
            onCreated={(s) => { setScheduled(prev => [s, ...prev]); setShowForm(false); }}
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-amber-500" size={28} /></div>
      ) : scheduled.length === 0 ? (
        <Empty icon={CalendarClock} text="No scheduled notifications. Schedule one to send automatically at a future date." />
      ) : (
        <div className="space-y-3">
          {/* Pending first */}
          {pending.length > 0 && (
            <>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">⏳ Pending</p>
              {pending.map(s => (
                <ScheduledRow key={s.id} item={s} onCancel={handleCancel} cancelling={cancelling === s.id} />
              ))}
            </>
          )}

          {past.length > 0 && (
            <>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mt-6">Archive</p>
              {past.map(s => (
                <ScheduledRow key={s.id} item={s} onCancel={null} cancelling={false} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

const ScheduledRow = ({ item: s, onCancel, cancelling }) => (
  <div className="flex items-center gap-4 px-5 py-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50">
    <LevelBadge level={s.level} />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
        {s.title || motifLabel(s.motif)}
      </p>
      <div className="flex items-center gap-3 mt-0.5">
        {s.case && (
          <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <Briefcase size={10} /> {s.case.title}
          </span>
        )}
        {s.recipientRoles?.length > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <Users size={10} /> {s.recipientRoles.join(', ')}
          </span>
        )}
      </div>
    </div>

    <div className="flex flex-col items-end gap-1 shrink-0">
      <StatusBadge status={s.status} />
      <span className="text-[11px] text-slate-400">{fmtDate(s.scheduledAt)}</span>
      {s.status === 'PENDING' && (
        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{countdown(s.scheduledAt)}</span>
      )}
    </div>

    {onCancel && s.status === 'PENDING' && (
      <button
        onClick={() => onCancel(s.id)}
        disabled={cancelling}
        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-40"
        title="Cancel"
      >
        {cancelling ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
      </button>
    )}
  </div>
);

const ScheduleForm = ({ onCreated }) => {
  const { data: casesData } = useCases();
  const cases = Array.isArray(casesData?.data) ? casesData.data : (Array.isArray(casesData) ? casesData : []);

  // Default to tomorrow at 09:00
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(9, 0, 0, 0);
  const toInputVal = (d) => d.toISOString().slice(0, 16);

  const [form, setForm] = useState({
    level: 'IMPORTANT', motif: 'HEARING', title: '', message: '',
    recipientRoles: [], scheduledAt: toInputVal(tomorrow), caseId: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleRole = (r) => set('recipientRoles',
    form.recipientRoles.includes(r)
      ? form.recipientRoles.filter(x => x !== r)
      : [...form.recipientRoles, r]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        caseId: form.caseId || undefined,
      };
      const { data } = await apiClient.post('/notifications/scheduled', payload);
      toast.success('Notification scheduled');
      onCreated(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule notification');
    } finally { setIsSaving(false); }
  };

  return (
    <Card className="p-6 border-blue-200 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-900/5">
      <h4 className="font-black text-slate-900 dark:text-white mb-5 flex items-center gap-2">
        <CalendarClock size={16} className="text-blue-500" /> Schedule a Notification
      </h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NSelect label="Level" value={form.level} onChange={e => set('level', e.target.value)}>
            <option value="NORMAL">Normal</option>
            <option value="IMPORTANT">Important</option>
            <option value="URGENT">Urgent</option>
          </NSelect>
          <NSelect label="Motif" value={form.motif} onChange={e => set('motif', e.target.value)}>
            {MOTIF_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </NSelect>
          {/* Date/time picker */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
              Send at *
            </label>
            <input
              type="datetime-local"
              required
              value={form.scheduledAt}
              onChange={e => set('scheduledAt', e.target.value)}
              min={toInputVal(new Date())}
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NField label="Subject" placeholder="ex: Rappel audience du 12/06" value={form.title} onChange={e => set('title', e.target.value)} />
          <NSelect label="Related Case (optional)" value={form.caseId} onChange={e => set('caseId', e.target.value)}>
            <option value="">— No specific case —</option>
            {cases.map(c => <option key={c.id} value={c.id}>{c.title} ({c.clientName})</option>)}
          </NSelect>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Message</label>
          <textarea
            rows={3}
            placeholder="Détails de la notification…"
            value={form.message}
            onChange={e => set('message', e.target.value)}
            className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white resize-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Recipients</label>
          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => toggleRole(r.value)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                  form.recipientRoles.includes(r.value)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {r.label}
              </button>
            ))}
            <span className="text-[10px] text-slate-400 self-center ml-1 italic">
              (vide = tout le cabinet)
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={isSaving} icon={CalendarClock}>Schedule</Button>
        </div>
      </form>
    </Card>
  );
};

// ─── Micro UI helpers ────────────────────────────────────────────────────────

const NField = ({ label, required, ...props }) => (
  <div>
    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
      {label}
    </label>
    <input
      required={required}
      className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white placeholder:text-slate-400"
      {...props}
    />
  </div>
);

const NSelect = ({ label, children, ...props }) => (
  <div>
    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
      {label}
    </label>
    <select
      className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white appearance-none"
      {...props}
    >
      {children}
    </select>
  </div>
);

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

// ─── Main page ───────────────────────────────────────────────────────────────

const TABS = [
  { id: 'history',   label: 'History',    icon: History      },
  { id: 'templates', label: 'Templates',  icon: BookTemplate },
  { id: 'scheduled', label: 'Scheduled',  icon: CalendarClock},
];

const NotificationCenterView = () => {
  const { currentUser } = useLexStore();
  const [activeTab, setActiveTab] = useState('history');
  const [pendingTemplate, setPendingTemplate] = useState(null);
  const [isSendOpen, setIsSendOpen] = useState(false);

  const isAdmin = currentUser?.role === 'CABINET_ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-slate-500">
      <Bell size={48} className="mb-4 text-slate-300" />
      <p className="font-bold text-slate-900 dark:text-white text-lg">Restricted Access</p>
      <p className="text-sm">Only firm administrators can access this section.</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Notification Center</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
          History · Reusable templates · Scheduled sends
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 w-fit">
        {TABS.map(({ id, label, icon: _Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === id
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <_Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'history'   && <HistoryTab />}
        {activeTab === 'templates' && (
          <TemplatesTab
            onUseTemplate={(t) => {
              setPendingTemplate(t);
              setIsSendOpen(true);
            }}
          />
        )}
        {activeTab === 'scheduled' && <ScheduledTab />}
      </div>

      {/* Send dialog — receives a preloaded template from the "Use" button */}
      <SendNotificationDialog
        isOpen={isSendOpen}
        onClose={() => { setIsSendOpen(false); setPendingTemplate(null); }}
        preloadTemplate={pendingTemplate}
      />
    </div>
  );
};

export default NotificationCenterView;
export { LEVEL_CONFIG };

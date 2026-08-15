import React, { useState, useEffect, useCallback } from 'react';
import { CalendarClock, Plus, Trash2, Loader2, Briefcase, Users, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../lib/api';
import { Card, Button, PageSkeleton } from '../ui';
import { MOTIF_OPTIONS, ROLE_OPTIONS } from '../../lib/schemas/notification.schema';
import { useCases } from '../../hooks/useCases';
import { LevelBadge, StatusBadge, NField, NSelect, Empty } from './notificationCenterShared';
import { motifLabel, fmtDate, countdown } from './notificationCenterData';

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

  const handleDelete = async (id) => {
    setCancelling(id);
    try {
      await apiClient.delete(`/notifications/scheduled/${id}/permanent`);
      toast.success('Scheduled notification deleted');
      setScheduled(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
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
          <PageSkeleton variant="table" className="py-2" />
      ) : scheduled.length === 0 ? (
        <Empty icon={CalendarClock} text="No scheduled notifications. Schedule one to send automatically at a future date." />
      ) : (
        <div className="space-y-3">
          {/* Pending first */}
          {pending.length > 0 && (
            <>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">⏳ Pending</p>
              {pending.map(s => (
                <ScheduledRow key={s.id} item={s} onCancel={handleCancel} onDelete={handleDelete} cancelling={cancelling === s.id} />
              ))}
            </>
          )}

          {past.length > 0 && (
            <>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mt-6">Archive</p>
              {past.map(s => (
                <ScheduledRow key={s.id} item={s} onCancel={null} onDelete={handleDelete} cancelling={cancelling === s.id} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

const ScheduledRow = ({ item: s, onCancel, onDelete, cancelling }) => (
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

    <div className="flex items-center gap-1 shrink-0">
      {onCancel && s.status === 'PENDING' && (
        <button
          onClick={() => onCancel(s.id)}
          disabled={cancelling}
          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all disabled:opacity-40"
          title="Cancel (keep in archive)"
        >
          {cancelling ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
        </button>
      )}
      {onDelete && (
        <button
          onClick={() => onDelete(s.id)}
          disabled={cancelling}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-40"
          title="Delete permanently"
        >
          {cancelling ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
        </button>
      )}
    </div>
  </div>
);

const ScheduleForm = ({ onCreated }) => {
  const { data: casesData } = useCases(100);
  const cases = casesData?.cases ?? [];

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

export default ScheduledTab;

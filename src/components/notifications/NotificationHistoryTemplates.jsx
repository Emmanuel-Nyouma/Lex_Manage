import React, { useState, useEffect, useCallback } from 'react';
import { History, BookTemplate, Plus, Trash2, Loader2, Send, Check, Users, RefreshCw, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../lib/api';
import { Card, Button, PageSkeleton } from '../ui';
import { MOTIF_OPTIONS, ROLE_OPTIONS } from '../../lib/schemas/notification.schema';
import { LevelBadge, NField, NSelect, Detail, Empty } from './notificationCenterShared';
import { motifLabel, fmtDate } from './notificationCenterData';

// ─── Tab: History ────────────────────────────────────────────────────────────

const HistoryTab = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get('/notifications/history');
      setHistory(data);
    } catch { toast.error('Failed to load history'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setDeleting(id);
    try {
      await apiClient.delete(`/notifications/history/${id}`);
      toast.success('Notification deleted');
      setHistory(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete notification');
    } finally { setDeleting(null); }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <PageSkeleton variant="table" className="w-full max-w-3xl" />
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
        <button type="button" onClick={load} className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-500 transition-colors">
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
            <div className="flex items-center px-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <button
                type="button"
                className="flex flex-1 min-w-0 items-center gap-4 px-2 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 rounded-lg"
                onClick={() => setExpanded(isOpen ? null : n.id)}
                aria-expanded={isOpen}
                aria-controls={`history-detail-${n.id}`}
                aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${n.title || motifLabel(n.motif)}`}
              >
                <LevelBadge level={n.level} />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-slate-900 dark:text-white truncate">
                    {n.title || motifLabel(n.motif)}
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {n.message || '—'}
                  </span>
                </span>
                <span className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{fmtDate(n.createdAt)}</span>
                  {n.createdBy && (
                    <span className="text-[10px] text-slate-400">
                      par {n.createdBy.firstName} {n.createdBy.lastName}
                    </span>
                  )}
                </span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <button
                type="button"
                onClick={(e) => handleDelete(e, n.id)}
                disabled={deleting === n.id}
                aria-label={`Delete ${n.title || motifLabel(n.motif)}`}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all shrink-0 disabled:opacity-40"
                title="Delete notification"
              >
                {deleting === n.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              </button>
            </div>

            {/* Expanded detail */}
            {isOpen && (
              <div id={`history-detail-${n.id}`} className="px-5 pb-4 pt-0 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-3 animate-in slide-in-from-top-2 duration-200">
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
        <PageSkeleton variant="table" className="py-2" />
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
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${t.name}`}
        className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
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
          <label htmlFor="template-message" className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Message</label>
          <textarea
            id="template-message"
            rows={3}
            placeholder="Message par défaut du template…"
            value={form.message}
            onChange={e => set('message', e.target.value)}
            className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white resize-none"
          />
        </div>

        <div>
          <span id="template-recipients-label" className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Default Recipients</span>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="template-recipients-label">
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

export { HistoryTab, TemplatesTab };

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bell, Send, X, Info, AlertTriangle, AlertOctagon, ChevronLeft, ChevronRight, Check, Users, Briefcase, BookTemplate, Loader2 } from 'lucide-react';
import { Card, Button, Input } from './ui';
import { toast } from 'sonner';
import apiClient from '../lib/api';
import { CreateNotificationSchema, MOTIF_OPTIONS, MOTIF_LEVEL_CONSTRAINTS, LEVEL_MAP, ROLE_OPTIONS } from '../lib/schemas/notification.schema';
import { useCases } from '../hooks/useCases';

const LEVEL_NUM_MAP = { NORMAL: 1, IMPORTANT: 2, URGENT: 3 };

const SendNotificationDialog = ({ isOpen, onClose, preloadTemplate = null }) => {
  const [step, setStep] = useState(1);
  const [isSending, setIsSending] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const { data: casesData } = useCases();
  const cases = Array.isArray(casesData?.data) ? casesData.data : (Array.isArray(casesData) ? casesData : []);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(CreateNotificationSchema),
    defaultValues: { levelNum: 1, level: 'NORMAL', motif: 'INTERNAL_REMINDER', title: '', message: '', recipientRoles: [], caseId: '' }
  });

  const watchLevelNum = watch('levelNum');
  const watchMotif = watch('motif');
  const watchRecipientRoles = watch('recipientRoles');
  const watchCaseId = watch('caseId');

  useEffect(() => {
    setValue('level', LEVEL_MAP[watchLevelNum]);
  }, [watchLevelNum, setValue]);

  // Load templates lazily when picker is opened
  const openTemplatePicker = async () => {
    if (!templates.length) {
      setLoadingTemplates(true);
      try {
        const { data } = await apiClient.get('/notifications/templates');
        setTemplates(data);
      } catch { toast.error('Failed to load templates'); }
      finally { setLoadingTemplates(false); }
    }
    setShowTemplatePicker(true);
  };

  // Apply a template to the form
  const applyTemplate = useCallback((tpl) => {
    const levelNum = LEVEL_NUM_MAP[tpl.level] ?? 1;
    setValue('levelNum', levelNum);
    setValue('level', tpl.level);
    setValue('motif', tpl.motif);
    setValue('title', tpl.title ?? '');
    setValue('message', tpl.message ?? '');
    setValue('recipientRoles', tpl.recipientRoles ?? []);
    setShowTemplatePicker(false);
    toast.success(`Template "${tpl.name}" applied`);
  }, [setValue]);

  // Apply preloaded template from NotificationCenter
  useEffect(() => {
    if (preloadTemplate && isOpen) {
      applyTemplate(preloadTemplate);
    }
  }, [preloadTemplate, isOpen, applyTemplate]);

  const handleMotifChange = (motif) => {
    setValue('motif', motif);
    const minLevel = MOTIF_LEVEL_CONSTRAINTS[motif] || 1;
    if (watchLevelNum < minLevel) {
      setValue('levelNum', minLevel);
      toast.info(`Le niveau a été automatiquement ajusté à ${minLevel} pour le motif sélectionné.`);
    }
  };

  const toggleRole = (role) => {
    const current = watchRecipientRoles || [];
    if (current.includes(role)) {
      setValue('recipientRoles', current.filter(r => r !== role));
    } else {
      setValue('recipientRoles', [...current, role]);
    }
  };

  const onSubmit = async (data) => {
    setIsSending(true);
    try {
      const { levelNum: _levelNum, ...rawPayload } = data;
      
      // Clean payload: Remove empty strings and handle caseId
      const payload = {
        level: rawPayload.level,
        motif: rawPayload.motif,
        title: rawPayload.title?.trim() || undefined,
        message: rawPayload.message?.trim() || undefined,
        recipientRoles: rawPayload.recipientRoles?.length > 0 ? rawPayload.recipientRoles : undefined,
        caseId: rawPayload.caseId || undefined
      };
      
      await apiClient.post('/notifications', payload);
      toast.success("Notification envoyée");
      onClose();
      setStep(1);
    } catch (e) {
      console.error("Notification send error:", e.response?.data || e.message);
      toast.error("Erreur d'envoi: " + (e.response?.data?.message || "Vérifiez les champs"));
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-lg p-6 shadow-2xl border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-amber-600">
              <Bell size={20} />
            </div>
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Notification — Étape {step}/4</h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Template picker trigger */}
            <button
              onClick={openTemplatePicker}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 dark:hover:text-amber-400 transition-all"
              title="Load from template"
            >
              {loadingTemplates ? <Loader2 size={13} className="animate-spin" /> : <BookTemplate size={13} />}
              Templates
            </button>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><X size={18} /></button>
          </div>
        </div>

        {/* Template picker dropdown */}
        {showTemplatePicker && (
          <div className="mb-5 animate-in slide-in-from-top-2 duration-200">
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-900/10 p-3 space-y-2 max-h-48 overflow-y-auto">
              {templates.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-3">No templates available. Create some in the Notification Center.</p>
              ) : templates.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="w-full text-left p-2.5 rounded-lg border border-transparent hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all flex items-center justify-between gap-3 group"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-[10px] text-slate-400">{t.level} · {t.motif}</p>
                  </div>
                  <Check size={13} className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowTemplatePicker(false)}
              className="mt-1 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">1. Niveau d'urgence</p>
            {[1, 2, 3].map(l => (
              <button 
                key={l} 
                type="button"
                onClick={() => setValue('levelNum', l)} 
                className={`w-full p-4 border rounded-2xl flex items-center justify-between transition-all ${watchLevelNum === l ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10 ring-2 ring-amber-200 dark:ring-amber-800/50' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${l === 1 ? 'bg-blue-100 text-blue-600' : l === 2 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                    {l === 1 ? <Info size={20} /> : l === 2 ? <AlertTriangle size={20} /> : <AlertOctagon size={20} />}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">Niveau {l}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase">{l === 1 ? 'Information classique' : l === 2 ? 'Rappel important' : 'Alerte critique / Email'}</p>
                  </div>
                </div>
                {watchLevelNum === l && <Check size={20} className="text-amber-500" />}
              </button>
            ))}
            <Button className="w-full mt-4 h-12 rounded-xl font-bold" onClick={() => setStep(2)}>Continuer <ChevronRight size={16} className="ml-2" /></Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">2. Motif de l'alerte</p>
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
              {MOTIF_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => handleMotifChange(o.value)}
                  className={`p-4 text-left border rounded-xl text-xs font-bold transition-all flex items-center justify-between ${watchMotif === o.value ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'}`}
                >
                  {o.label}
                  {MOTIF_LEVEL_CONSTRAINTS[o.value] > 1 && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded uppercase tracking-wider">
                      Min Lvl {MOTIF_LEVEL_CONSTRAINTS[o.value]}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="secondary" className="flex-1 h-12 rounded-xl" onClick={() => setStep(1)}><ChevronLeft size={16} className="mr-2" /> Précédent</Button>
              <Button className="flex-1 h-12 rounded-xl font-bold" onClick={() => setStep(3)}>Suivant <ChevronRight size={16} className="ml-2" /></Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Users size={16} /> 3. Destinataires (Par Rôle)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => toggleRole(r.value)}
                    className={`p-3 text-left border rounded-xl text-[11px] font-bold transition-all flex items-center justify-between ${watchRecipientRoles?.includes(r.value) ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'}`}
                  >
                    {r.label}
                    {watchRecipientRoles?.includes(r.value) && <Check size={14} />}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2 italic">* Laissez vide pour envoyer à tout le cabinet.</p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Briefcase size={16} /> Dossier lié (Optionnel)
              </p>
              <select 
                value={watchCaseId}
                onChange={(e) => setValue('caseId', e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">Aucun dossier spécifique</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{c.title} ({c.clientName})</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="secondary" className="flex-1 h-12 rounded-xl" onClick={() => setStep(2)}><ChevronLeft size={16} className="mr-2" /> Précédent</Button>
              <Button className="flex-1 h-12 rounded-xl font-bold" onClick={() => setStep(4)}>Dernière étape <ChevronRight size={16} className="ml-2" /></Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">4. Message final</p>
            <Input {...register('title')} label="Sujet de l'alerte" placeholder="Ex: Audience reportée..." />
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Contenu détaillé</label>
              <textarea 
                {...register('message')} 
                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl min-h-[140px] focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all text-sm dark:text-white placeholder:text-slate-400" 
                placeholder="Expliquez précisément ce qui nécessite l'attention..." 
              />
              {errors.message && <p className="text-red-500 text-[10px] font-bold px-1">{errors.message.message}</p>}
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1 h-12 rounded-xl" onClick={() => setStep(3)}><ChevronLeft size={16} className="mr-2" /> Précédent</Button>
              <Button type="submit" className="flex-1 h-12 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-700" isLoading={isSending}>Diffuser l'alerte <Send size={16} className="ml-2" /></Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
export default SendNotificationDialog;

import React, { useState } from 'react';
import { X, Calendar, AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { Button, Input, Card, FocusTrap } from './ui';
import { useCases } from '../hooks/useCases';
import { toast } from 'sonner';
import apiClient from '../lib/api';

const NewEventDialog = ({ isOpen, onClose }) => {
  const { data: casesData } = useCases(100);
  const cases = casesData?.cases || [];
  
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [caseId, setCaseId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hook for creation (using a dummy caseId initially or a selected one)
  // const createDeadline = useCreateDeadline(caseId);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !date) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    setIsSubmitting(true);
    try {
      // Use "none" as a special case ID for global events
      const targetCaseId = caseId || "none";
      
      await apiClient.post(`/cases/${targetCaseId}/deadlines`, {
        title,
        dueAt: new Date(date).toISOString(),
        priority
      });

      toast.success("Événement ajouté au calendrier");
      onClose();
      // Reset form
      setTitle("");
      setDate("");
      setPriority("MEDIUM");
      setCaseId("");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la création de l'événement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      <FocusTrap isActive={isOpen} onClose={onClose}>
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative z-10 border border-slate-200 dark:border-slate-800">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
            <div className="flex items-center gap-2">
              <Calendar className="text-amber-500" size={20} />
              <h2 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">Nouvelle Échéance</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <Input 
              label="Titre de l'échéance"
              placeholder="Ex: Dépôt de mémoire, Audience..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />

            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Date d'échéance"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Priorité</label>
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:text-white"
                >
                  <option value="LOW">Basse</option>
                  <option value="MEDIUM">Moyenne</option>
                  <option value="HIGH">Haute</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Dossier Associé (Optionnel)</label>
              <select 
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:text-white"
              >
                <option value="">Aucun dossier particulier</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{c.title} ({c.clientName})</option>
                ))}
              </select>
            </div>

            <div className="pt-4 flex gap-3">
              <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button 
                type="submit" 
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold"
                isLoading={isSubmitting}
              >
                Create Event
              </Button>
            </div>
          </form>
        </div>
      </FocusTrap>
    </div>
  );
};

export default NewEventDialog;

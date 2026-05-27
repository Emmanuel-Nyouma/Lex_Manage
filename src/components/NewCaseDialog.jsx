import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Check, FileText, User, Calendar as CalendarIcon, Gavel, Hash } from 'lucide-react';
import { Button, Input } from './UI';
import { useCreateCase } from '../hooks/useCases';

const caseSchema = z.object({
  title: z.string().min(3, "Le titre doit faire au moins 3 caractères"),
  clientName: z.string().min(2, "Le nom du client est requis"),
  courtName: z.string().optional().or(z.literal('')),
  caseNumber: z.string().optional().or(z.literal('')),
  status: z.string().default("OPEN"),
  description: z.string().optional(),
});

const NewCaseDialog = ({ isOpen, onClose }) => {
  const createCase = useCreateCase();

  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors } 
  } = useForm({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      status: "OPEN",
    }
  });

  // Gestion de la fermeture avec Echap
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const onSubmit = async (data) => {
    createCase.mutate(data, {
      onSuccess: () => {
        reset();
        onClose();
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="px-6 py-5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 shadow-sm">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Ouvrir un nouveau dossier</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Créez une nouvelle fiche dans le référentiel sécurisé du cabinet.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Titre */}
            <div className="md:col-span-2">
              <Input 
                {...register("title")}
                label="Objet / Titre du Dossier"
                placeholder="ex: Litige Foncier Famille Kamdem"
                icon={FileText}
                error={errors.title?.message}
              />
            </div>

            {/* Client */}
            <div>
              <Input 
                {...register("clientName")}
                label="Nom du Client"
                placeholder="ex: Emmanuel Kamdem"
                icon={User}
                error={errors.clientName?.message}
              />
            </div>

            {/* Case Number */}
            <div>
              <Input 
                {...register("caseNumber")}
                label="N° de Dossier / Référence"
                placeholder="ex: LEX-2026-001"
                icon={Hash}
                error={errors.caseNumber?.message}
              />
            </div>

            {/* Juridiction */}
            <div>
              <Input 
                {...register("courtName")}
                label="Juridiction / Tribunal"
                placeholder="ex: Tribunal de Grande Instance de Douala"
                icon={Gavel}
                error={errors.courtName?.message}
              />
            </div>

            {/* Statut */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Statut Initial</label>
              <div className="relative">
                 <select 
                   {...register("status")}
                   className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:text-white appearance-none cursor-pointer"
                 >
                   <option value="OPEN">Ouvert (Open)</option>
                   <option value="IN_PROGRESS">En cours (In Progress)</option>
                   <option value="PENDING">En attente (Pending)</option>
                 </select>
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Check size={14} />
                 </div>
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description / Notes Stratégiques</label>
              <textarea 
                {...register("description")}
                placeholder="Détails confidentiels sur l'objet du litige..."
                rows={3}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:text-white resize-none"
              ></textarea>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700">
            <Button type="button" variant="secondary" onClick={onClose} className="font-bold">
              Annuler
            </Button>
            <Button 
              type="submit"
              isLoading={createCase.isPending}
              icon={Check}
              className="px-8 font-bold"
            >
              Ouvrir le dossier
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewCaseDialog;

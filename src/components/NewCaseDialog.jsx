import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Check, FileText, User, Calendar as CalendarIcon, Gavel } from 'lucide-react';
import { Button, Input } from './UI';
import { useCreateCase } from '../hooks/useCases';

const caseSchema = z.object({
  title: z.string().min(3, "Le titre doit faire au moins 3 caractères"),
  client_name: z.string().min(2, "Le nom du client est requis"),
  jurisdiction: z.string().optional(),
  status: z.string().default("en cours"),
  next_hearing_date: z.string().optional().or(z.literal('')),
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
      status: "en cours",
      next_hearing_date: ""
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
    // Nettoyage des dates vides pour Supabase
    const payload = {
      ...data,
      next_hearing_date: data.next_hearing_date || null
    };

    createCase.mutate(payload, {
      onSuccess: () => {
        reset();
        onClose();
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ouvrir un nouveau dossier</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Créez une nouvelle fiche dans le référentiel du cabinet.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
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
                label="Référence / Titre du Dossier"
                placeholder="ex: Affaire Dupont vs État"
                icon={FileText}
                error={errors.title?.message}
              />
            </div>

            {/* Client */}
            <div>
              <Input 
                {...register("client_name")}
                label="Nom du Client"
                placeholder="ex: Jean Dupont"
                icon={User}
                error={errors.client_name?.message}
              />
            </div>

            {/* Juridiction */}
            <div>
              <Input 
                {...register("jurisdiction")}
                label="Juridiction"
                placeholder="ex: TGI Paris"
                icon={Gavel}
                error={errors.jurisdiction?.message}
              />
            </div>

            {/* Prochaine Échéance */}
            <div>
              <Input 
                {...register("next_hearing_date")}
                label="Prochaine Audience"
                type="date"
                icon={CalendarIcon}
                error={errors.next_hearing_date?.message}
              />
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Statut Initial</label>
              <select 
                {...register("status")}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:text-white"
              >
                <option value="en cours">En cours</option>
                <option value="en attente">En attente</option>
                <option value="clos">Clos</option>
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description / Notes</label>
              <textarea 
                {...register("description")}
                placeholder="Décrivez brièvement l'objet du litige..."
                rows={3}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:text-white resize-none"
              ></textarea>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              type="submit"
              isLoading={createCase.isPending}
              icon={Check}
            >
              Créer le dossier
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewCaseDialog;

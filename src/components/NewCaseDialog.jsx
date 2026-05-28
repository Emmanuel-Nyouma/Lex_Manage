import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Check, FileText, User, Calendar as CalendarIcon, Gavel, Hash } from 'lucide-react';
import { Button, Input } from './UI';
import { useCreateCase } from '../hooks/useCases';

const caseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  clientName: z.string().min(2, "Client name is required"),
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

  // Handle close with Escape
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const onSubmit = async (data) => {
    // Structure data to match backend CreateCaseDto
    const payload = {
      title: data.title,
      clientName: data.clientName,
      description: data.description,
      courtName: data.courtName,
      caseNumber: data.caseNumber,
      // Status is handled by backend default or update, so not in CreateCaseDto
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
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="px-6 py-5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 shadow-sm">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Open New Case</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Create a new file in the firm's secure repository.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Title */}
            <div className="md:col-span-2">
              <Input 
                {...register("title")}
                label="Subject / Case Title"
                placeholder="ex: Commercial Dispute - Smith Corp"
                icon={FileText}
                error={errors.title?.message}
              />
            </div>

            {/* Client */}
            <div>
              <Input 
                {...register("clientName")}
                label="Client Name"
                placeholder="ex: John Smith"
                icon={User}
                error={errors.clientName?.message}
              />
            </div>

            {/* Case Number */}
            <div>
              <Input 
                {...register("caseNumber")}
                label="Case Number / Reference"
                placeholder="ex: LEX-2026-001"
                icon={Hash}
                error={errors.caseNumber?.message}
              />
            </div>

            {/* Jurisdiction */}
            <div>
              <Input 
                {...register("courtName")}
                label="Jurisdiction / Court"
                placeholder="ex: Supreme Court of Justice"
                icon={Gavel}
                error={errors.courtName?.message}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Initial Status</label>
              <div className="relative">
                 <select 
                   {...register("status")}
                   className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:text-white appearance-none cursor-pointer"
                 >
                   <option value="OPEN">Open</option>
                   <option value="IN_PROGRESS">In Progress</option>
                   <option value="PENDING">Pending</option>
                 </select>
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Check size={14} />
                 </div>
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description / Strategic Notes</label>
              <textarea 
                {...register("description")}
                placeholder="Confidential details about the dispute..."
                rows={3}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:text-white resize-none"
              ></textarea>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700">
            <Button type="button" variant="secondary" onClick={onClose} className="font-bold">
              Cancel
            </Button>
            <Button 
              type="submit"
              isLoading={createCase.isPending}
              icon={Check}
              className="px-8 font-bold"
            >
              Open Case
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewCaseDialog;

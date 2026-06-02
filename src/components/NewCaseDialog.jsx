import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Check, FileText, User, Calendar as CalendarIcon, Gavel, Hash, Upload, Loader2, Paperclip } from 'lucide-react';
import { Button, Input } from './ui';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useCreateCase } from '../hooks/useCases';
import { useDropzone } from 'react-dropzone';
import { uploadLegalDocument } from '../lib/documentService';
import useLexStore from '../store/useLexStore';
import { toast } from 'sonner';

import { CreateCaseSchema } from '../lib/schemas/case.schema';

const NewCaseDialog = ({ isOpen, onClose }) => {
  const { currentUser } = useLexStore();
  const createCase = useCreateCase();
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const dialogId = React.useId();
  const titleId = `${dialogId}-title`;

  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors } 
  } = useForm({
    resolver: zodResolver(CreateCaseSchema),
    defaultValues: {
      status: "OPEN",
    }
  });

  const onDrop = useCallback((acceptedFiles) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    setIsUploading(true);
    try {
      // 1. Create the case first to get the ID
      const payload = {
        title: data.title,
        clientName: data.clientName,
        description: data.description,
        courtName: data.courtName,
        caseNumber: data.caseNumber,
      };
      
      const newCase = await createCase.mutateAsync(payload);

      // 2. Upload documents if any and link them to the case
      if (files.length > 0) {
        for (const file of files) {
          await uploadLegalDocument(file, currentUser, 'Pièces', newCase.id);
        }
        toast.success(`${files.length} document(s) associés au dossier`);
      }

      setFiles([]);
      reset();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la création du dossier ou de l'upload");
    } finally {
      setIsUploading(false);
    }
  };

  useKeyboardNavigation(onClose, handleSubmit(onSubmit));

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700"
      >
        
        {/* Header */}
        <div className="px-6 py-5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 shadow-sm">
              <FileText size={22} aria-hidden="true" />
            </div>
            <div>
              <h2 id={titleId} className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Open New Case</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 dark:text-slate-400 font-medium">Create a new file in the firm's secure repository.</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-500 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
            aria-label="Close dialog"
          >
            <X size={20} aria-hidden="true" />
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
                helperText="A clear, concise name for tracking this legal matter."
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
                helperText="Primary contact or entity involved."
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
              <label 
                htmlFor={`${dialogId}-status`}
                className="block text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest mb-1.5"
              >
                Initial Status
              </label>
              <div className="relative">
                 <select 
                   {...register("status")}
                   id={`${dialogId}-status`}
                   className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:text-white appearance-none cursor-pointer"
                 >
                   <option value="OPEN">Open</option>
                   <option value="IN_PROGRESS">In Progress</option>
                   <option value="PENDING">Pending</option>
                 </select>
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 dark:text-slate-300">
                    <Check size={14} aria-hidden="true" />
                 </div>
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label 
                htmlFor={`${dialogId}-description`}
                className="block text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest mb-1.5"
              >
                Description / Strategic Notes
              </label>
              <textarea 
                {...register("description")}
                id={`${dialogId}-description`}
                placeholder="Confidential details about the dispute..."
                rows={3}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:text-white resize-none"
              ></textarea>
            </div>

            {/* Document Upload Section */}
            <div className="md:col-span-2 space-y-3">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest">
                Associer des documents (Facultatif)
              </label>
              
              <div 
                {...getRootProps()} 
                className={`p-6 border-2 border-dashed rounded-xl text-center transition-all cursor-pointer ${
                  isDragActive ? 'border-amber-500 bg-amber-50/50' : 'border-slate-200 dark:border-slate-700 hover:border-amber-400'
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                  <Upload size={24} className="text-slate-400" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Glissez-déposez des fichiers ici ou <span className="text-amber-600 font-bold">parcourez</span>
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-tight font-bold">PDF, DOCX supportés</p>
                </div>
              </div>

              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Paperclip size={14} className="text-slate-500" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                        {file.name}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => removeFile(idx)}
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700">
            <Button type="button" variant="secondary" onClick={onClose} className="font-bold">
              Cancel
            </Button>
            <Button 
              type="submit"
              isLoading={createCase.isPending || isUploading}
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



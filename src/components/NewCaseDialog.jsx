import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Check, FileText, User, Gavel, Hash, Upload, Paperclip, ChevronDown, AlertTriangle } from 'lucide-react';
import { Button, Input, Textarea, FocusTrap } from './ui';
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
  const [backendError, setBackendError] = useState(null);
  
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
      priority: "MEDIUM",
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
    setBackendError(null);
    try {
      const payload = {
        title: data.title?.trim(),
        clientName: data.clientName?.trim(),
        description: data.description?.trim() || undefined,
        courtName: data.courtName?.trim() || undefined,
        caseNumber: data.caseNumber?.trim() || undefined,
        status: data.status || "OPEN",
        priority: data.priority || "MEDIUM",
        assigneeId: data.assigneeId || undefined,
      };
      
      const newCase = await createCase.mutateAsync(payload);

      if (files.length > 0) {
        for (const file of files) {
          try {
            await uploadLegalDocument(file, currentUser, 'Pièces', newCase.id);
          } catch (uploadErr) {
            console.error(`Failed to upload ${file.name}:`, uploadErr);
            toast.error(`Could not upload ${file.name}`);
          }
        }
        toast.success(`${files.length} document(s) associated with case`);
      }

      setFiles([]);
      reset();
      onClose();
    } catch (error) {
      console.error("Submission error:", error);
      const msg = error.response?.data?.message || error.message;
      // Handle array error messages from Zod/class-validator
      const errorDetail = Array.isArray(msg) ? msg.join(', ') : (typeof msg === 'object' ? JSON.stringify(msg) : msg);
      setBackendError(errorDetail);
      toast.error("Form submission failed");
    } finally {
      setIsUploading(false);
    }
  };

  useKeyboardNavigation(onClose, handleSubmit(onSubmit));

  if (!isOpen) return null;

  const errorList = Object.values(errors);

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <FocusTrap isActive={isOpen} onClose={onClose}>
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800"
        >
          
          {/* Header */}
          <div className="px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 shadow-sm">
                <FileText size={22} aria-hidden="true" />
              </div>
              <div>
                <h2 id={titleId} className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Open New Case</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Create a new legal file in the secure repository.</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
              aria-label="Close dialog"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          {/* Form Body - Scrollable */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <form id="new-case-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              
              {/* Validation Error Summary */}
              {errorList.length > 0 && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl flex gap-3 animate-in slide-in-from-top-2 duration-300">
                  <AlertTriangle className="text-rose-600 dark:text-rose-400 shrink-0" size={20} />
                  <div>
                    <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200 mb-1">Incomplete Information</h3>
                    <ul className="list-disc list-inside space-y-0.5">
                      {errorList.map((err, idx) => (
                        <li key={idx} className="text-xs text-rose-700 dark:text-rose-300 font-medium">{err.message}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Backend Error Alert */}
              {backendError && (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex gap-3 animate-in shake duration-500">
                   <X className="text-red-600 shrink-0" size={20} />
                   <div>
                     <h3 className="text-sm font-bold text-red-900 dark:text-red-300 mb-1">Server rejected the request</h3>
                     <p className="text-xs text-red-700 dark:text-red-400 font-medium">{backendError}</p>
                   </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Title */}
                <div className="md:col-span-2">
                  <Input 
                    {...register("title")}
                    label="Subject / Case Title"
                    placeholder="ex: Commercial Dispute - Smith Corp"
                    icon={FileText}
                    error={errors.title?.message}
                    required
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
                    required
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
                    required
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
                    required
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                    Initial Status <span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  <div className="relative group">
                    <select 
                      {...register("status")}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:text-white appearance-none cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="PENDING">Pending</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-amber-500">
                        <ChevronDown size={14} aria-hidden="true" />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <Textarea 
                    {...register("description")}
                    label="Description / Strategic Notes"
                    placeholder="Confidential details about the dispute..."
                    rows={3}
                    error={errors.description?.message}
                  />
                </div>

                {/* Document Upload */}
                <div className="md:col-span-2 space-y-3">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                    Attach Documents (Optional)
                  </label>
                  
                  <div 
                    {...getRootProps()} 
                    className={`p-6 border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer ${
                      isDragActive ? 'border-amber-500 bg-amber-50/50' : 'border-slate-200 dark:border-slate-800 hover:border-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-1">
                        <Upload size={24} />
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Drag files here or <span className="text-amber-600 font-bold">browse</span>
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-tight font-bold">PDF, DOCX supported</p>
                    </div>
                  </div>

                  {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {files.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-in zoom-in-95">
                          <Paperclip size={14} className="text-amber-500" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">
                            {file.name}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => removeFile(idx)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-rose-500"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Footer - Pinned */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-900/80 shrink-0">
            <Button type="button" variant="secondary" onClick={onClose} className="font-bold">
              Cancel
            </Button>
            <Button 
              form="new-case-form"
              type="submit"
              isLoading={createCase.isPending || isUploading}
              icon={Check}
              className="px-8 bg-slate-900 dark:bg-amber-600 text-white font-black"
            >
              Create Case File
            </Button>
          </div>
        </div>
      </FocusTrap>

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
        }
      `}</style>
    </div>
  );
};

export default NewCaseDialog;

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import { uploadLegalDocument } from '../lib/documentService';
import useLexStore from '../store/useLexStore';

const MAX_SIZE = 50 * 1024 * 1024; // 50 Mo
const CATEGORIES = ['Pièces', 'Correspondances', 'Actes', 'Client', 'Autre'];

const DocumentUpload = ({ onUploadSuccess }) => {
  const { currentUser } = useLexStore();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Pièces');

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach(err => {
          if (err.code === 'file-too-large') {
            toast.error(`${file.name} est trop lourd (max 50 Mo)`);
          } else if (err.code === 'file-invalid-type') {
            toast.error(`${file.name} n'est pas un format accepté (PDF/Word uniquement)`);
          } else {
            toast.error(`Erreur sur ${file.name} : ${err.message}`);
          }
        });
      });
      return;
    }

    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    const toastId = toast.loading(`Analyse de ${acceptedFiles.length} fichier(s)...`);

    try {
      for (const file of acceptedFiles) {
        await uploadLegalDocument(file, currentUser, selectedCategory);
      }
      toast.success("Documents importés et analysés", { id: toastId });
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Échec du traitement", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  }, [currentUser, onUploadSuccess, selectedCategory]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: MAX_SIZE,
    multiple: true,
    disabled: isUploading
  });

  return (
    <div className="space-y-4">
      {/* Sélecteur de catégorie */}
      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Catégorie cible :</div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedCategory === cat ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div 
        {...getRootProps()} 
        className={`
          p-12 border-2 border-dashed rounded-2xl transition-all cursor-pointer text-center
          ${isDragActive ? 'border-amber-500 bg-amber-50/50' : 'border-slate-200 dark:border-slate-800 hover:border-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 mb-4">
            {isUploading ? <Loader2 size={32} className="animate-spin" /> : <Upload size={32} />}
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {isDragActive ? "Lâchez pour importer" : "Cliquez ou glissez vos documents"}
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Les documents seront classés dans <span className="text-amber-600 font-bold">"{selectedCategory}"</span>
          </p>
          <div className="mt-6 flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-1"><Check size={12} /> PDF / DOCX</span>
            <span className="flex items-center gap-1"><Check size={12} /> Max 50 Mo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;

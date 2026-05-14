import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadLegalDocument } from '../lib/documentService';
import useLexStore from '../store/useLexStore';

const MAX_SIZE = 50 * 1024 * 1024; // 50 Mo

const DocumentUpload = ({ onUploadSuccess }) => {
  const { currentUser } = useLexStore();
  const [isUploading, setIsUploading] = useState(false);

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
        await uploadLegalDocument(file, currentUser.id);
      }
      toast.success("Documents importés et analysés", { id: toastId });
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Échec du traitement", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  }, [currentUser, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: MAX_SIZE,
    multiple: true
  });

  return (
    <div 
      {...getRootProps()} 
      className={`
        p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer text-center
        ${isDragActive ? 'border-amber-500 bg-amber-50/50' : 'border-slate-200 hover:border-amber-400 hover:bg-slate-50'}
        ${isUploading ? 'pointer-events-none opacity-50' : ''}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center">
        {isUploading ? <Loader2 className="animate-spin text-amber-500 mb-2" /> : <Upload className="text-slate-400 mb-2" />}
        <p className="text-sm font-medium text-slate-700">
          {isDragActive ? "Lâchez ici" : "Cliquez ou glissez vos documents"}
        </p>
        <p className="text-xs text-slate-500 mt-1">PDF, DOCX (Max 50Mo)</p>
      </div>
    </div>
  );
};

export default DocumentUpload;

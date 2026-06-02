import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import { uploadLegalDocument } from '../lib/documentService';
import useLexStore from '../store/useLexStore';

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
const CATEGORIES = ['Pièces', 'Correspondances', 'Actes', 'Client', 'Autre'];
const CATEGORY_LABELS = {
  'Pièces': 'Evidence',
  'Correspondances': 'Correspondence',
  'Actes': 'Legal Acts',
  'Client': 'Client',
  'Autre': 'Other'
};

const DocumentUpload = ({ onUploadSuccess }) => {
  const { currentUser } = useLexStore();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Pièces');
  const [uploadProgress, setUploadProgress] = useState({});

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    
    // Initialize progress for files
    const initialProgress = acceptedFiles.reduce((acc, file) => {
      acc[file.name] = 0;
      return acc;
    }, {});
    setUploadProgress(initialProgress);

    try {
      for (const file of acceptedFiles) {
        // Simulate progress for visual feedback
        setUploadProgress(prev => ({ ...prev, [file.name]: 20 }));
        
        await uploadLegalDocument(file, currentUser, selectedCategory);
        
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      }
      toast.success("Documents imported and analyzed");
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Processing failed");
    } finally {
      setIsUploading(false);
      setUploadProgress({});
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
        <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Target Category:</div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedCategory === cat ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
            >
              {CATEGORY_LABELS[cat]}
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
            {isDragActive ? "Drop to import" : "Click or drag your documents"}
          </p>
        </div>
      </div>

      {/* Progress Bars */}
      {Object.entries(uploadProgress).map(([fileName, progress]) => (
        <div key={fileName} className="space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
            <span className="truncate max-w-[200px]">{fileName}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
            <div 
              className="bg-amber-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentUpload;



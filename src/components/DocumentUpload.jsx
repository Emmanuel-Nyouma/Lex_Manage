import React, { useCallback, useState, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, ChevronDown, Check, AlertCircle, Shield, Users as UsersIcon, Folder, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { uploadLegalDocument } from '../lib/documentService';
import useLexStore from '../store/useLexStore';
import { DMS_CATEGORIES, ACCESS_ROLES } from '../config/dms.config';

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

const DocumentUpload = ({ onUploadSuccess, existingDocuments = [] }) => {
  const { currentUser } = useLexStore();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(DMS_CATEGORIES[0].id);
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [allowedRoles, setAllowedRoles] = useState(['ALL']);
  const [uploadProgress, setUploadProgress] = useState({});

  const isAdmin = currentUser?.role === 'CABINET_ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  const currentCategoryObj = useMemo(() => 
    DMS_CATEGORIES.find(c => c.id === selectedCategory), 
  [selectedCategory]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    // Check for duplicates
    const duplicates = acceptedFiles.filter(file => 
      existingDocuments.some(doc => doc.file_name === file.name || doc.title === file.name)
    );

    if (duplicates.length > 0) {
      const confirmUpload = window.confirm(
        `Un document avec exactement le même nom existe déjà : ${duplicates.map(d => d.name).join(', ')}. Êtes-vous sûr de vouloir téléverser ?`
      );
      if (!confirmUpload) return;
    }

    setIsUploading(true);
    
    // Initialize progress for files
    const initialProgress = acceptedFiles.reduce((acc, file) => {
      acc[file.name] = 0;
      return acc;
    }, {});
    setUploadProgress(initialProgress);

    try {
      for (const file of acceptedFiles) {
        setUploadProgress(prev => ({ ...prev, [file.name]: 20 }));
        
        // Updated upload service call to include subCategory and allowedRoles
        await uploadLegalDocument(file, currentUser, {
          category: selectedCategory,
          subCategory: selectedSubCategory,
          allowedRoles: allowedRoles.includes('ALL') ? [] : allowedRoles
        });
        
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      }
      toast.success("Documents importés et analysés avec succès");
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Échec du traitement des documents");
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  }, [currentUser, onUploadSuccess, selectedCategory, selectedSubCategory, allowedRoles, existingDocuments]);

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

  const toggleRole = (roleId) => {
    if (roleId === 'ALL') {
      setAllowedRoles(['ALL']);
      return;
    }
    
    setAllowedRoles(prev => {
      const filtered = prev.filter(r => r !== 'ALL');
      if (filtered.includes(roleId)) {
        const next = filtered.filter(r => r !== roleId);
        return next.length === 0 ? ['ALL'] : next;
      }
      return [...filtered, roleId];
    });
  };

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Catégories & Sous-catégories */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
            <Folder size={18} className="text-amber-500" />
            Catégorisation
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Catégorie principale</label>
              <select 
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubCategory('');
                }}
                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
              >
                {DMS_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            {currentCategoryObj?.subCategories.length > 0 && (
              <div className="animate-in slide-in-from-left-2 duration-300">
                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Sous-catégorie</label>
                <div className="flex flex-wrap gap-2">
                  {currentCategoryObj.subCategories.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubCategory(sub.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedSubCategory === sub.id ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contrôle d'Accès (Admin Only) */}
        {isAdmin && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
              <Shield size={18} className="text-amber-500" />
              Contrôle d'Accès
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-wider">Qui peut consulter ce document ?</p>
              <div className="grid grid-cols-2 gap-2">
                {ACCESS_ROLES.map(role => (
                  <button
                    key={role.id}
                    onClick={() => toggleRole(role.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] font-bold transition-all ${allowedRoles.includes(role.id) ? 'bg-amber-100 dark:bg-amber-900/20 border-amber-500 text-amber-700 dark:text-amber-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-amber-300'}`}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${allowedRoles.includes(role.id) ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                      {allowedRoles.includes(role.id) && <Check size={10} strokeWidth={4} />}
                    </div>
                    {role.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Zone */}
      <div 
        {...getRootProps()} 
        className={`
          p-10 border-2 border-dashed rounded-3xl transition-all cursor-pointer text-center
          ${isDragActive ? 'border-amber-500 bg-amber-50/50' : 'border-slate-200 dark:border-slate-800 hover:border-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 mb-4 shadow-inner">
            {isUploading ? <Loader2 size={32} className="animate-spin" /> : <Upload size={32} />}
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {isDragActive ? "Déposez pour importer" : "Cliquez ou glissez vos documents ici"}
          </p>
          <p className="text-xs text-slate-500 mt-2 font-medium">PDF ou DOCX uniquement (max 50 Mo)</p>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3">
        {Object.entries(uploadProgress).map(([fileName, progress]) => (
          <div key={fileName} className="animate-in slide-in-from-bottom-2 duration-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              <span className="truncate flex items-center gap-2">
                <FileText size={14} className="text-slate-400" />
                {fileName}
              </span>
              <span className="text-amber-600">{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentUpload;

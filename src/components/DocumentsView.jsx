import React, { useState, useMemo } from 'react';
import { 
  Files, Search, Folder, FileText, Trash2, Loader2, Sparkles, Plus, ChevronDown, ChevronRight, X
} from 'lucide-react';
import { toast } from 'sonner';
import DocumentUpload from './DocumentUpload';
import { Badge, Card } from './UI';
import { useDocuments, useDeleteDocument } from '../hooks/useDocuments';

const CATEGORIES = ['Pièces', 'Correspondances', 'Actes', 'Client', 'Autre'];

const DocumentsView = () => {
  const { data: documents, isLoading, refetch } = useDocuments();
  const deleteDoc = useDeleteDocument();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(CATEGORIES);

  const handleDelete = async (doc) => {
    if (!window.confirm('Voulez-vous supprimer ce document ?')) return;
    deleteDoc.mutate(doc.id);
  };

  const groupedDocs = useMemo(() => {
    const filtered = (documents || []).filter(doc => 
      (doc.title || doc.fileName).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return CATEGORIES.reduce((acc, cat) => {
      acc[cat] = filtered.filter(d => d.category === cat || (!d.category && cat === 'Autre'));
      return acc;
    }, {});
  }, [documents, searchQuery]);

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
            <Files className="text-amber-500" /> GED Structurée
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gestion électronique des documents et pièces du cabinet.</p>
        </div>
        <button 
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white dark:bg-amber-600 dark:text-white rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-all active:scale-95"
        >
          {showUpload ? <X size={18} /> : <Plus size={18} />}
          {showUpload ? 'Fermer' : 'Importer des pièces'}
        </button>
      </div>

      {showUpload && (
        <div className="animate-in slide-in-from-top-4 duration-300">
          <Card className="p-6 border-amber-200 dark:border-amber-900/30 bg-amber-50/10">
            <DocumentUpload onUploadSuccess={() => { setShowUpload(false); refetch(); }} />
          </Card>
        </div>
      )}

      {/* Barre de Recherche */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={20} />
        <input 
          type="text"
          placeholder="Rechercher une pièce par titre ou nom de fichier..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all shadow-sm font-medium"
        />
      </div>

      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-amber-500" size={48} />
          <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">Accès au coffre-fort numérique...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.map(cat => {
            const docs = groupedDocs[cat] || [];
            const isExpanded = expandedCategories.includes(cat);
            
            if (docs.length === 0 && searchQuery) return null;

            return (
              <div key={cat} className="space-y-2">
                <button 
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center justify-between p-4 bg-slate-100/50 dark:bg-slate-800/30 rounded-2xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                       {isExpanded ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
                    </div>
                    <Folder size={20} className={docs.length > 0 ? "text-amber-500 fill-amber-500/20" : "text-slate-400"} />
                    <span className="font-black text-slate-800 dark:text-slate-200 text-sm tracking-tight">{cat.toUpperCase()}</span>
                    <Badge variant="neutral" className="ml-2 bg-white dark:bg-slate-800">{docs.length}</Badge>
                  </div>
                </button>

                {isExpanded && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 animate-in slide-in-from-top-2 duration-300">
                    {docs.length > 0 ? docs.map(doc => (
                      <div key={doc.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between hover:border-amber-400 dark:hover:border-amber-600 transition-all shadow-sm hover:shadow-xl">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/20 group-hover:text-amber-600 transition-all shadow-inner">
                            <FileText size={24} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate pr-4 group-hover:text-amber-600 transition-colors">{doc.title || doc.fileName}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">{doc.fileType || 'DOC'}</span>
                              <span className="text-[10px] text-slate-400 font-bold">{Math.round(doc.fileSize / 1024 / 1024 * 100) / 100} MB</span>
                              {doc.qdrantId && (
                                <Badge variant="success" className="scale-75 origin-left shadow-sm">IA INDEXÉ</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                          <button className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-xl transition-all">
                            <Sparkles size={18} />
                          </button>
                          <button onClick={() => handleDelete(doc)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 text-sm font-medium italic bg-slate-50/30 dark:bg-slate-950/20">
                        Aucun document disponible dans cette catégorie.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocumentsView;

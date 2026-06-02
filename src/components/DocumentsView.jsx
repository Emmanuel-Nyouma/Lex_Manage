import React, { useState, useMemo } from 'react';
import { 
  Files, Search, Folder, FileText, Trash2, Download, Plus, ChevronDown, ChevronRight, X, Eye
} from 'lucide-react';
import DocumentUpload from './DocumentUpload';
import { Badge, Card, Skeleton } from './ui';
import { useDocuments, useDeleteDocument } from '../hooks/useDocuments';
import { getDocumentSignedUrl } from '../lib/documentService';
import { toast } from 'sonner';
import useLexStore from '../store/useLexStore';
import ConfirmDialog from './ConfirmDialog';

const CATEGORIES = ['Pièces', 'Correspondances', 'Actes', 'Client', 'Autre'];
const CATEGORY_LABELS = {
  'Pièces': 'Evidence',
  'Correspondances': 'Correspondence',
  'Actes': 'Legal Acts',
  'Client': 'Client',
  'Autre': 'Other'
};

const DocumentsView = () => {
  const { currentUser } = useLexStore();
  const { data: documents, isLoading, refetch } = useDocuments();
  const deleteDoc = useDeleteDocument();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(CATEGORIES);
  const [docToDelete, setDocToDelete] = useState(null);

  const isAdmin = currentUser?.role === 'CABINET_ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  const handleView = async (docId) => {
    const url = await getDocumentSignedUrl(docId);
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error("Generating secure link failed");
    }
  };

  const handleDownload = async (docId, fileName) => {
    const url = await getDocumentSignedUrl(docId);
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.error("Download link failed");
    }
  };

  const handleDelete = async (doc) => {
    if (!isAdmin) {
      toast.error("Only administrators can delete documents");
      return;
    }
    setDocToDelete(doc);
  };

  const confirmDelete = () => {
    if (docToDelete) {
      deleteDoc.mutate(docToDelete.id);
      setDocToDelete(null);
    }
  };

  const groupedDocs = useMemo(() => {
    const filtered = (documents || []).filter(doc => 
      (doc.title || doc.file_name).toLowerCase().includes(searchQuery.toLowerCase())
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
            <Files className="text-amber-500" /> Structured DMS
          </h1>
          <p className="text-slate-600 dark:text-slate-300 dark:text-slate-400 font-medium">Electronic management of firm documents and evidence.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white dark:bg-amber-600 dark:text-white rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-all active:scale-95"
          >
            {showUpload ? <X size={18} /> : <Plus size={18} />}
            {showUpload ? 'Close' : 'Import documents'}
          </button>
        )}
      </div>

      {showUpload && isAdmin && (
        <div className="animate-in slide-in-from-top-4 duration-300">
          <Card className="p-6 border-amber-200 dark:border-amber-900/30 bg-amber-50/10">
            <DocumentUpload onUploadSuccess={() => { setShowUpload(false); refetch(); }} />
          </Card>
        </div>
      )}

      {/* Barre de Recherche */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300 group-focus-within:text-amber-500 transition-colors" size={20} />
        <input 
          type="text"
          placeholder="Search for a document by title or file name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all shadow-sm font-medium"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
           {Array(3).fill(0).map((_, i) => (
             <Skeleton key={i} className="h-16 w-full rounded-2xl" />
           ))}
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
                  aria-expanded={isExpanded}
                  className="w-full flex items-center justify-between p-4 bg-slate-100/50 dark:bg-slate-800/30 rounded-2xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                       {isExpanded ? <ChevronDown size={16} className="text-slate-600 dark:text-slate-300" /> : <ChevronRight size={16} className="text-slate-600 dark:text-slate-300" />}
                    </div>
                    <Folder size={20} className={docs.length > 0 ? "text-amber-500 fill-amber-500/20" : "text-slate-500 dark:text-slate-300"} />
                    <span className="font-black text-slate-800 dark:text-slate-200 text-sm tracking-tight">{CATEGORY_LABELS[cat].toUpperCase()}</span>
                    <Badge variant="neutral" className="ml-2 bg-white dark:bg-slate-800">{docs.length}</Badge>
                  </div>
                </button>

                {isExpanded && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 animate-in slide-in-from-top-2 duration-300">
                    {docs.length > 0 ? docs.map(doc => (
                      <div key={doc.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between hover:border-amber-400 dark:hover:border-amber-600 transition-all shadow-sm hover:shadow-xl">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-300 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/20 group-hover:text-amber-600 transition-all shadow-inner">
                            <FileText size={24} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate pr-4 group-hover:text-amber-600 transition-colors">{doc.title || doc.file_name}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-[10px] text-slate-500 dark:text-slate-300 uppercase font-black tracking-tighter bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">{doc.file_type || 'DOC'}</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-300 font-bold">{Math.round(doc.file_size / 1024 / 1024 * 100) / 100} MB</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                          <button 
                            onClick={() => handleView(doc.id)}
                            aria-label="View document"
                            className="p-2.5 text-slate-500 dark:text-slate-300 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-xl transition-all"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => handleDownload(doc.id, doc.file_name)}
                            aria-label="Download document"
                            className="p-2.5 text-slate-500 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                          >
                            <Download size={18} />
                          </button>
                          {isAdmin && (
                            <button 
                              onClick={() => handleDelete(doc)} 
                              aria-label="Delete document"
                              className="p-2.5 text-slate-500 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-300 text-sm font-medium italic bg-slate-50/30 dark:bg-slate-950/20">
                        No documents available in this category.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog 
        isOpen={!!docToDelete}
        title="Delete Document"
        description={`Are you sure you want to permanently delete "${docToDelete?.title || docToDelete?.file_name}"? This action cannot be undone.`}
        destructiveText="Delete Document"
        onConfirm={confirmDelete}
        onCancel={() => setDocToDelete(null)}
      />
    </div>
  );
};

export default DocumentsView;

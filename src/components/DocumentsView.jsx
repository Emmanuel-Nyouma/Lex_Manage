import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Files, Search, Folder, FileText, Trash2, Download, Plus, ChevronDown, ChevronRight, X, Eye, Calendar as CalendarIcon, Filter, RefreshCcw, Brain, Loader2
} from 'lucide-react';
import DocumentUpload from './DocumentUpload';
import { Badge, Card, Skeleton, Button } from './ui';
import { useDocuments, useDeleteDocument } from '../hooks/useDocuments';
import { getDocumentSignedUrl } from '../lib/documentService';
import { toast } from 'sonner';
import useLexStore from '../store/useLexStore';
import ConfirmDialog from './ConfirmDialog';
import { useDmsCategories } from '../hooks/useDmsCategories';
import { useIngestToLexAssist } from '../hooks/useIngestToLexAssist';

const DocumentsView = () => {
  const { currentUser } = useLexStore();
  const DMS_CATEGORIES = useDmsCategories();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('ALL');
  
  const { data, isLoading, refetch, error } = useDocuments(page, 12, searchCategory);
  const documents = data?.data || [];
  const meta = data?.meta;
  
  const deleteDoc = useDeleteDocument();
  const ingestToAi = useIngestToLexAssist();

  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [docToDelete, setDocToDelete] = useState(null);
  
  const searchRef = useRef(null);

  const canUpload = currentUser?.role === 'CABINET_ADMIN' || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'LAWYER';
  const canDelete = currentUser?.role === 'CABINET_ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  // Handle outside click for search popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    if (!canDelete) {
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

  // Note: Searching is now combined with server-side category filtering
  const filteredDocs = useMemo(() => {
    if (!searchQuery) return documents;
    return documents.filter(doc => 
      (doc.title || doc.file_name).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [documents, searchQuery]);

  const groupedDocs = useMemo(() => {
    // If we're filtering by a specific category, we only show that one
    const categoriesToShow = searchCategory === 'ALL'
      ? DMS_CATEGORIES
      : DMS_CATEGORIES.filter(c => c.id === searchCategory);

    const initial = categoriesToShow.reduce((acc, cat) => {
      acc[cat.id] = [];
      return acc;
    }, {});

    return documents.reduce((acc, doc) => {
      const catId = doc.category || 'Autre';
      if (acc[catId]) {
        acc[catId].push(doc);
      } else if (searchCategory === 'ALL') {
        if (!acc['Autre']) acc['Autre'] = [];
        acc['Autre'].push(doc);
      }
      return acc;
    }, initial);
  }, [documents, searchCategory]);

  const toggleCategory = (catId) => {
    setExpandedCategories(prev => 
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const scrollToDocument = (docId, catId) => {
    if (!expandedCategories.includes(catId)) {
      setExpandedCategories(prev => [...prev, catId]);
    }
    setShowSearchPopup(false);
    setTimeout(() => {
      const element = document.getElementById(`doc-${docId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-4', 'ring-amber-500', 'ring-offset-2', 'dark:ring-offset-slate-950');
        setTimeout(() => element.classList.remove('ring-4', 'ring-amber-500', 'ring-offset-2', 'dark:ring-offset-slate-950'), 3000);
      }
    }, 100);
  };

  // Reset to first page when category changes
  useEffect(() => {
    setPage(1);
  }, [searchCategory]);

  if (error) {
    return (
      <div className="p-6 bg-white dark:bg-slate-900 border-l-4 border-red-500 rounded-2xl shadow-sm flex items-start gap-4">
        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-500">
          <RefreshCcw size={24} />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">Error Loading Documents</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{error.message || "Failed to sync with document repository."}</p>
          <Button onClick={() => refetch()} variant="secondary" size="sm" className="mt-4">Retry Sync</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
            <Files className="text-amber-500" /> Document Management System
          </h1>
          <p className="text-slate-600 dark:text-slate-300 dark:text-slate-400 font-medium">Secure repository for legal acts, evidence, and corporate documents.</p>
        </div>
        {canUpload && (
          <button 
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white dark:bg-amber-600 dark:text-white rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-all active:scale-95"
          >
            {showUpload ? <X size={18} /> : <Plus size={18} />}
            {showUpload ? 'Fermer' : 'Importer Documents'}
          </button>
        )}
      </div>

      {showUpload && canUpload && (
        <div className="animate-in slide-in-from-top-4 duration-300">
          <Card className="p-6 border-amber-200 dark:border-amber-900/30 bg-amber-50/10">
            <DocumentUpload 
              existingDocuments={documents}
              onUploadSuccess={() => { setShowUpload(false); refetch(); }} 
            />
          </Card>
        </div>
      )}

      {/* Advanced Search Bar with Category Filter */}
      <div className="flex flex-col md:flex-row gap-4 relative z-40" ref={searchRef}>
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300 group-focus-within:text-amber-500 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Rechercher un document dans cette page..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchPopup(e.target.value.length > 1);
            }}
            onFocus={() => searchQuery.length > 1 && setShowSearchPopup(true)}
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all shadow-sm font-medium"
          />

          {/* Search Results Popup (local page search) */}
          {showSearchPopup && filteredDocs.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
              <div className="p-2">
                <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Résultats sur cette page</p>
                {filteredDocs.slice(0, 10).map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => scrollToDocument(doc.id, doc.category || 'Autre')}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-left group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 group-hover:text-amber-600">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{doc.title || doc.file_name}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">{doc.category || 'AUTRE'}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative inline-block w-full md:w-80">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <select
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
            className="w-full pl-12 pr-10 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm appearance-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all shadow-sm font-medium"
          >
            <option value="ALL">Toutes les catégories</option>
            {DMS_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
           {Array(3).fill(0).map((_, i) => (
             <Skeleton key={i} className="h-16 w-full rounded-2xl" />
           ))}
        </div>
      ) : (
        <div className="space-y-8">
          {DMS_CATEGORIES.map(cat => {
            const docs = groupedDocs[cat.id];
            if (!docs) return null; // If not in current category filter

            const isExpanded = expandedCategories.includes(cat.id) || searchCategory !== 'ALL';
            
            // If we're searching locally, filter the docs displayed in categories
            const categoryDocs = searchQuery 
              ? docs.filter(doc => (doc.title || doc.file_name).toLowerCase().includes(searchQuery.toLowerCase()))
              : docs;

            if (categoryDocs.length === 0 && searchQuery) return null;

            return (
              <div key={cat.id} className="space-y-2">
                <button 
                  onClick={() => toggleCategory(cat.id)}
                  aria-expanded={isExpanded}
                  className="w-full flex items-center justify-between p-4 bg-slate-100/50 dark:bg-slate-800/30 rounded-2xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                       {isExpanded ? <ChevronDown size={16} className="text-slate-600 dark:text-slate-300" /> : <ChevronRight size={16} className="text-slate-600 dark:text-slate-300" />}
                    </div>
                    <Folder size={20} className={categoryDocs.length > 0 ? "text-amber-500 fill-amber-500/20" : "text-slate-500 dark:text-slate-300"} />
                    <span className="font-black text-slate-800 dark:text-slate-200 text-sm tracking-tight">{cat.label.toUpperCase()}</span>
                    <Badge variant="neutral" className="ml-2 bg-white dark:bg-slate-800">{categoryDocs.length}</Badge>
                  </div>
                </button>

                {isExpanded && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pl-4 animate-in slide-in-from-top-2 duration-300">
                    {categoryDocs.length > 0 ? categoryDocs.map(doc => (
                      <div 
                        key={doc.id} 
                        id={`doc-${doc.id}`}
                        className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between hover:border-amber-400 dark:hover:border-amber-600 transition-all shadow-sm hover:shadow-xl"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-300 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/20 group-hover:text-amber-600 transition-all shadow-inner">
                            <FileText size={24} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate pr-4 group-hover:text-amber-600 transition-colors">{doc.title || doc.file_name}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-1.5">
                              <span className="text-[10px] text-slate-500 dark:text-slate-300 uppercase font-black tracking-tighter bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">{doc.file_type?.split('/').pop().toUpperCase() || 'DOC'}</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-300 font-bold flex items-center gap-1">
                                <CalendarIcon size={10} />
                                {new Date(doc.createdAt).toLocaleDateString()}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-300 font-bold">{Math.round(doc.file_size / 1024 / 1024 * 100) / 100} MB</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all translate-x-0 md:translate-x-2 md:group-hover:translate-x-0 flex-shrink-0">
                          {/* Import to LexAssist AI */}
                          <button
                            onClick={() => ingestToAi.mutate(doc.id)}
                            disabled={ingestToAi.isPending && ingestToAi.variables === doc.id}
                            aria-label="Importer dans LexAssist AI"
                            title="Importer dans LexAssist AI"
                            className="p-3 text-slate-500 dark:text-slate-300 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-xl transition-all disabled:opacity-50"
                          >
                            {ingestToAi.isPending && ingestToAi.variables === doc.id
                              ? <Loader2 size={20} className="animate-spin text-purple-500" />
                              : <Brain size={20} />
                            }
                          </button>
                          <button
                            onClick={() => handleView(doc.id)}
                            aria-label="Voir document"
                            className="p-3 text-slate-500 dark:text-slate-300 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-xl transition-all"
                          >
                            <Eye size={20} />
                          </button>
                          <button
                            onClick={() => handleDownload(doc.id, doc.file_name)}
                            aria-label="Télécharger document"
                            className="p-3 text-slate-500 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                          >
                            <Download size={20} />
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(doc)}
                              aria-label="Supprimer document"
                              className="p-3 text-slate-500 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                            >
                              <Trash2 size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-300 text-sm font-medium italic bg-slate-50/30 dark:bg-slate-950/20">
                        Aucun document disponible dans cette catégorie.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          {meta && meta.totalPages > 1 && (
            <div 
              className="flex flex-col sm:flex-row items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 gap-4 mt-8"
              aria-live="polite"
              aria-label="Pagination"
            >
              <div className="flex flex-wrap items-center justify-center gap-2 order-2 sm:order-1">
                <Button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="secondary"
                  size="sm"
                  className="px-4 py-3 sm:py-1 text-xs font-bold min-w-[3rem]"
                >
                  Précédent
                </Button>
                
                <div className="flex items-center gap-1">
                  {[...Array(meta.totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    if (
                      pageNum === 1 || 
                      pageNum === meta.totalPages || 
                      (pageNum >= page - 1 && pageNum <= page + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-10 h-10 rounded-lg text-xs font-black transition-all ${
                            page === pageNum 
                              ? 'bg-slate-900 dark:bg-amber-600 text-white shadow-md' 
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (pageNum === page - 2 || pageNum === page + 2) {
                      return <span key={pageNum} className="text-slate-400 px-1">...</span>;
                    }
                    return null;
                  })}
                </div>

                <Button 
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                  variant="secondary"
                  size="sm"
                  className="px-4 py-3 sm:py-1 text-xs font-bold min-w-[3rem]"
                >
                  Suivant
                </Button>
              </div>
              
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 order-1 sm:order-2">
                Affichage de <span className="text-slate-900 dark:text-white">{Math.min(meta.total, (page - 1) * 12 + 1)}-{Math.min(meta.total, page * 12)}</span> sur <span className="text-slate-900 dark:text-white">{meta.total}</span> documents
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog 
        isOpen={!!docToDelete}
        title="Supprimer Document"
        description={`Êtes-vous sûr de vouloir supprimer définitivement "${docToDelete?.title || docToDelete?.file_name}" ? Cette action est irréversible.`}
        destructiveText="Supprimer Document"
        onConfirm={confirmDelete}
        onCancel={() => setDocToDelete(null)}
      />
    </div>
  );
};

export default DocumentsView;

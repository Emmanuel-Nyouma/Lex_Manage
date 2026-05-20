import React, { useState, useEffect, useMemo } from 'react';
import { 
  Files, Search, Folder, FileText, Trash2, Loader2, Sparkles, MessageSquare, Plus, ChevronDown, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import useLexStore from '../store/useLexStore';
import DocumentUpload from './DocumentUpload';
import { Badge, Card } from './UI';

const CATEGORIES = ['Pièces', 'Correspondances', 'Actes', 'Client', 'Autre'];

const DocumentsView = () => {
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(CATEGORIES);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      toast.error('Échec du chargement des documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm('Voulez-vous supprimer ce document ?')) return;
    try {
      // Soft delete
      const { error } = await supabase
        .from('documents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', doc.id);
      
      if (error) throw error;
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      toast.success('Document déplacé vers la corbeille');
    } catch (error) {
      toast.error('Échec de la suppression');
    }
  };

  const groupedDocs = useMemo(() => {
    const filtered = documents.filter(doc => 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return CATEGORIES.reduce((acc, cat) => {
      acc[cat] = filtered.filter(d => d.category === cat);
      return acc;
    }, {});
  }, [documents, searchQuery]);

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Files className="text-amber-500" /> GED Structurée
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Gestion électronique des documents et pièces du cabinet.</p>
        </div>
        <button 
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-transform"
        >
          {showUpload ? <X size={18} /> : <Plus size={18} />}
          {showUpload ? 'Fermer' : 'Importer des pièces'}
        </button>
      </div>

      {showUpload && (
        <div className="animate-in slide-in-from-top-2 duration-300">
          <Card className="p-6">
            <DocumentUpload onUploadSuccess={() => { setShowUpload(false); fetchDocuments(); }} />
          </Card>
        </div>
      )}

      {/* Barre de Recherche */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Rechercher un document par nom..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all shadow-sm"
        />
      </div>

      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-amber-500" size={40} />
          <p className="text-slate-500 font-medium">Chargement de la bibliothèque...</p>
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
                  className="w-full flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                    <Folder size={20} className={docs.length > 0 ? "text-amber-500 fill-amber-500/20" : "text-slate-400"} />
                    <span className="font-bold text-slate-700 dark:text-slate-200">{cat}</span>
                    <Badge variant="neutral">{docs.length}</Badge>
                  </div>
                </button>

                {isExpanded && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 animate-in slide-in-from-top-1 duration-200">
                    {docs.length > 0 ? docs.map(doc => (
                      <div key={doc.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between hover:border-amber-300 dark:hover:border-amber-900/50 transition-all shadow-sm hover:shadow-md">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors">
                            <FileText size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate pr-4">{doc.name}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] text-slate-400 uppercase font-bold">{doc.type || 'PDF'}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{doc.size || '0 MB'}</span>
                              {doc.gemini_file_uri && (
                                <Badge variant="success" className="scale-75 origin-left">IA active</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-slate-400 hover:text-amber-600 transition-colors">
                            <Sparkles size={16} />
                          </button>
                          <button onClick={() => handleDelete(doc)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl text-slate-400 text-sm italic">
                        Aucun document dans cette catégorie.
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

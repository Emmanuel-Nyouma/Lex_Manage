import React, { useState, useEffect } from 'react';
import { 
  Files, Search, Folder, FileText, Trash2, Loader2, Sparkles, MessageSquare, Plus 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import useLexStore from '../store/useLexStore';
import DocumentUpload from './DocumentUpload';
import { Badge } from './UI';

const DocumentsView = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('All Documents');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  
  const folders = ['All Documents', 'Client Matters', 'Court Rulings', 'Evidence', 'Templates', 'Administrative'];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
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
    try {
      await supabase.storage.from('documents').remove([doc.storage_path]);
      await supabase.from('documents').delete().eq('id', doc.id);
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      toast.success('Document supprimé');
    } catch (error) {
      toast.error('Échec de la suppression');
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedFolder === 'All Documents' || doc.folder === selectedFolder)
  );

  return (
    <div className="h-full flex gap-6 overflow-hidden">
      {/* Sidebar Folders */}
      <div className="w-64 flex-shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col">
        <div className="p-4 border-b dark:border-slate-800 font-bold flex items-center gap-2">
          <Files size={18} className="text-amber-500"/> Référentiel
        </div>
        <div className="p-2 flex-1 space-y-1">
          {folders.map(f => (
            <button key={f} onClick={() => setSelectedFolder(f)} className={`w-full text-left p-2.5 rounded-lg text-sm ${selectedFolder === f ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' : 'text-slate-600 dark:text-slate-400'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{selectedFolder}</h1>
          <button 
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 rounded-lg font-bold text-sm"
          >
            <Plus size={16} /> {showUpload ? 'Fermer' : 'Nouvel Upload'}
          </button>
        </div>

        {showUpload && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            <DocumentUpload onUploadSuccess={() => { setShowUpload(false); fetchDocuments(); }} />
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" /></div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-4">Document</th>
                  <th className="px-6 py-4">Status IA</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {filteredDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <FileText size={18} className="text-slate-400" />
                      <div className="font-medium">{doc.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      {doc.gemini_file_uri ? (
                        <Badge variant="success" className="gap-1"><Sparkles size={12}/> Prêt</Badge>
                      ) : (
                        <Badge variant="neutral">Traitement...</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => handleDelete(doc)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg">
                          <Trash2 size={16} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsView;

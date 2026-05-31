'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import { 
  FileText, Upload, Search, Download, Trash2, Loader2, 
  CheckCircle2, AlertTriangle, Clock, Link2, ExternalLink
} from 'lucide-react';

export default function DocumentsPage() {
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Queries
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.get('/documents').then(r => r.data),
    refetchInterval: 5000, // Poll every 5 seconds to track background OCR & indexing status!
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases'],
    queryFn: () => api.get('/cases').then(r => r.data),
  });

  // Mutations
  const deleteDoc = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document supprimé avec succès');
    },
    onError: () => toast.error('Impossible de supprimer ce document'),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    const toastId = toast.loading("Upload du document et démarrage de l'OCR...");
    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      qc.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document uploadé, traitement OCR démarré dans le cloud.', { id: toastId });
    } catch {
      toast.error("Erreur lors de l'upload du fichier", { id: toastId });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Helpers
  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const filteredDocs = documents.filter((doc: any) =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'INDEXED':
        return (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-medium shrink-0">
            <CheckCircle2 size={12} /> Indexé (LexAssist)
          </span>
        );
      case 'OCR_PENDING':
        return (
          <span className="flex items-center gap-1.5 text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-full font-medium shrink-0 animate-pulse">
            <Loader2 size={12} className="animate-spin" /> OCR en cours...
          </span>
        );
      case 'OCR_DONE':
        return (
          <span className="flex items-center gap-1.5 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full font-medium shrink-0 animate-pulse">
            <Clock size={12} /> Indexation en cours...
          </span>
        );
      case 'ERROR':
        return (
          <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full font-medium shrink-0">
            <AlertTriangle size={12} /> Échec OCR
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full font-medium shrink-0">
            En attente
          </span>
        );
    }
  };

  return (
    <main className="flex-1 p-6 space-y-8 overflow-y-auto bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="text-amber-500" size={24} /> Bibliothèque de documents
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Déposez vos contrats, décisions judiciaires et conclusions. LexAssist s'occupe de l'OCR et de la vectorisation.
          </p>
        </div>
        
        {/* Upload panel */}
        <label className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl py-2.5 px-5 text-sm transition-all shadow-lg shadow-amber-500/10 cursor-pointer duration-200 active:scale-[0.98]">
          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          <span>Importer un document</span>
          <input type="file" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
        </label>
      </div>

      {/* Drag & Drop Visual Box */}
      <label className="border-2 border-dashed border-slate-800 hover:border-amber-500/40 bg-slate-900/20 hover:bg-slate-900/40 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-3 group">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Upload size={22} className="text-amber-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Glissez-déposez un fichier juridique ici</p>
          <p className="text-xs text-slate-500 mt-1">Accepte les formats PDF, Word (DOCX) ou images jusqu'à 50 Mo</p>
        </div>
        <input type="file" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
      </label>

      {/* Search area */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
        <input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Rechercher un document par titre..."
          className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-500 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
        />
      </div>

      {/* Table grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-amber-500" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-16 text-center text-slate-500">
          Aucun document n'a été importé dans la bibliothèque.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider bg-slate-900/60">
                  <th className="p-4 pl-6">Nom du document</th>
                  <th className="p-4">Dossier associé</th>
                  <th className="p-4">Taille</th>
                  <th className="p-4">Collaborateur</th>
                  <th className="p-4">Statut OCR</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {filteredDocs.map((doc: any) => {
                  const linkedCase = cases.find((c: any) => c.id === doc.caseId);
                  return (
                    <tr key={doc.id} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3 max-w-xs md:max-w-sm xl:max-w-md">
                          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <FileText size={16} className="text-amber-500" />
                          </div>
                          <span className="font-semibold text-slate-200 truncate" title={doc.fileName}>{doc.title}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {linkedCase ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                            <Link2 size={10} /> {linkedCase.title}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600 italic">Général (Aucun)</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-400 text-xs font-medium">{formatBytes(doc.fileSize)}</td>
                      <td className="p-4 text-slate-400 text-xs">
                        {doc.uploader ? `${doc.uploader.firstName} ${doc.uploader.lastName}` : 'System'}
                      </td>
                      <td className="p-4">{getStatusBadge(doc.status)}</td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a 
                            href={doc.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-2 bg-slate-950/40 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-amber-500 transition-all"
                            title="Consulter le fichier"
                          >
                            <ExternalLink size={14} />
                          </a>
                          <button
                            onClick={() => deleteDoc.mutate(doc.id)}
                            className="p-2 bg-slate-950/40 hover:bg-red-500/10 border border-slate-800 rounded-xl text-slate-500 hover:text-red-400 transition-all"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}

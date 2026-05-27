'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import api from '@/lib/api';
import { 
  FolderOpen, Plus, Search, X, User, 
  FileText, Upload, Trash2, Download, Loader2
} from 'lucide-react';

const caseSchema = z.object({
  title: z.string().min(2, 'Le titre doit avoir au moins 2 caractères'),
  description: z.string().optional(),
  clientName: z.string().min(2, 'Le nom du client est requis'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  assigneeId: z.string().optional(),
});

type CaseForm = z.infer<typeof caseSchema>;

export default function CasesPage() {
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CaseForm>({
    resolver: zodResolver(caseSchema),
    defaultValues: { priority: 'MEDIUM' },
  });

  // Queries
  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => api.get('/cases').then(r => r.data),
  });

  const { data: collaborators = [] } = useQuery({
    queryKey: ['collaborators'],
    queryFn: () => api.get('/users').then(r => r.data),
  });

  const { data: activeCase, isLoading: loadingCase } = useQuery({
    queryKey: ['case', activeCaseId],
    queryFn: () => api.get(`/cases/${activeCaseId}`).then(r => r.data),
    enabled: !!activeCaseId,
  });

  // Mutations
  const createCase = useMutation({
    mutationFn: (values: CaseForm) => api.post('/cases', values).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cases'] });
      setIsCreateOpen(false);
      reset();
      toast.success('Dossier créé avec succès');
    },
    onError: () => toast.error('Erreur lors de la création du dossier'),
  });

  const updateCaseStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      api.patch(`/cases/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cases'] });
      if (activeCaseId) qc.invalidateQueries({ queryKey: ['case', activeCaseId] });
      toast.success('Statut du dossier mis à jour');
    },
  });

  const deleteCase = useMutation({
    mutationFn: (id: string) => api.delete(`/cases/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cases'] });
      setActiveCaseId(null);
      toast.success('Dossier archivé / supprimé');
    },
  });

  const deleteDoc = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => {
      if (activeCaseId) qc.invalidateQueries({ queryKey: ['case', activeCaseId] });
      toast.success('Pièce supprimée du dossier');
    },
  });

  // Handle Case document uploads
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCaseId) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      await api.post(`/documents/upload?caseId=${activeCaseId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      qc.invalidateQueries({ queryKey: ['case', activeCaseId] });
      toast.success('Pièce juridique ajoutée au dossier !');
    } catch {
      toast.error("Erreur lors de l'upload du document");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = (values: CaseForm) => {
    createCase.mutate(values);
  };

  // Filters
  const filteredCases = cases.filter((c: any) => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    OPEN: 'bg-green-500/10 text-green-400 border border-green-500/20',
    IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    PENDING: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    CLOSED: 'bg-slate-500/10 text-slate-400 border border-slate-800',
  };

  const priorityColors: Record<string, string> = {
    URGENT: 'bg-red-500/20 text-red-400 border border-red-500/30',
    HIGH: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    MEDIUM: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    LOW: 'bg-slate-800 text-slate-400 border border-slate-700',
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden">
      {/* List Panel */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FolderOpen className="text-amber-500" size={24} /> Gestion des dossiers
            </h1>
            <p className="text-slate-400 text-sm mt-1">Gérez vos dossiers juridiques, affectez vos collaborateurs et stockez les pièces justificatives.</p>
          </div>
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl py-2.5 px-5 text-sm transition-all"
          >
            <Plus size={16} /> Nouveau dossier
          </button>
        </div>

        {/* Searching & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-3 relative">
            <Search className="absolute left-3 top-3.5 text-slate-500" size={16} />
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher par titre ou nom de client..." 
              className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="OPEN">Ouvert</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="PENDING">En attente</option>
            <option value="CLOSED">Clôturé</option>
          </select>
        </div>

        {/* List Grid */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 size={32} className="animate-spin text-amber-500" /></div>
        ) : filteredCases.length === 0 ? (
          <div className="flex-1 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-16 text-center text-slate-500">
            Aucun dossier trouvé correspondant aux critères.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredCases.map((c: any) => (
              <div 
                key={c.id} 
                onClick={() => setActiveCaseId(c.id)}
                className={`bg-slate-900 border rounded-2xl p-5 hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between ${
                  activeCaseId === c.id ? 'border-amber-500/50 ring-1 ring-amber-500/20' : 'border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${statusColors[c.status]}`}>
                      {c.status}
                    </span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${priorityColors[c.priority]}`}>
                      {c.priority}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-white truncate mb-1">{c.title}</h3>
                  <p className="text-xs text-slate-500 mb-4">Client : <span className="text-slate-300 font-medium">{c.clientName}</span></p>
                  <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{c.description || 'Aucune description disponible.'}</p>
                </div>

                <div className="border-t border-slate-800/80 mt-5 pt-4 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <User size={12} className="text-amber-500/70" /> 
                    {c.assignee ? `${c.assignee.firstName} ${c.assignee.lastName}` : 'Non assigné'}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText size={12} /> {c._count?.documents ?? 0} pièce(s)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slide-over Case Details Workspace Panel */}
      {activeCaseId && (
        <aside className="w-[500px] border-l border-slate-800 bg-slate-900/95 flex flex-col justify-between h-full shadow-2xl shrink-0">
          {loadingCase ? (
            <div className="flex-1 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-amber-500" /></div>
          ) : activeCase ? (
            <>
              {/* Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight mb-1 truncate max-w-[380px]">{activeCase.title}</h2>
                  <p className="text-xs text-slate-500">Client : <span className="text-slate-400 font-medium">{activeCase.clientName}</span></p>
                </div>
                <button onClick={() => setActiveCaseId(null)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all">
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Descriptif de l'affaire</h4>
                  <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                    {activeCase.description || 'Aucune description juridique rédigée.'}
                  </p>
                </div>

                {/* Operations & Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Priorité</h4>
                    <span className={`inline-block text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full ${priorityColors[activeCase.priority]}`}>
                      {activeCase.priority}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Statut du dossier</h4>
                    <select
                      value={activeCase.status}
                      onChange={e => updateCaseStatus.mutate({ id: activeCase.id, status: e.target.value })}
                      className="bg-slate-950 border border-slate-800 text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer font-semibold"
                    >
                      <option value="OPEN">Ouvert</option>
                      <option value="IN_PROGRESS">En cours</option>
                      <option value="PENDING">En attente</option>
                      <option value="CLOSED">Clôturé</option>
                    </select>
                  </div>
                </div>

                {/* Assignee */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2.5">Avocat ou Collaborateur en charge</h4>
                  <div className="flex items-center gap-3 bg-slate-950/20 border border-slate-850 rounded-xl p-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-slate-950 text-xs">
                      {activeCase.assignee ? activeCase.assignee.firstName[0] + activeCase.assignee.lastName[0] : '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {activeCase.assignee ? `${activeCase.assignee.firstName} ${activeCase.assignee.lastName}` : 'Non assigné'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {activeCase.assignee ? activeCase.assignee.email : 'Affectez un avocat au dossier'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* DMS workspace for the case */}
                <div className="border-t border-slate-800 pt-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pièces juridiques du dossier</h4>
                    <label className="text-xs text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 cursor-pointer">
                      <Upload size={12} /> Ajouter une pièce
                      <input type="file" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
                    </label>
                  </div>

                  {isUploading && (
                    <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex items-center gap-2 text-xs text-slate-400 mb-3">
                      <Loader2 size={12} className="animate-spin text-amber-500" />
                      <span>Upload et OCR de la pièce en cours...</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    {activeCase.documents?.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-4 text-center">Aucun document lié à ce dossier.</p>
                    ) : activeCase.documents?.map((doc: any) => (
                      <div key={doc.id} className="bg-slate-950/60 border border-slate-850 rounded-xl p-3.5 flex items-center justify-between group hover:border-slate-700 transition-all">
                        <div className="overflow-hidden pr-3">
                          <p className="text-xs font-semibold text-slate-200 truncate">{doc.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                            <span>{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span>
                            <span>·</span>
                            <span className="uppercase font-semibold text-amber-500">{doc.status}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a 
                            href={doc.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-500 transition-all"
                          >
                            <Download size={14} />
                          </a>
                          <button 
                            onClick={() => deleteDoc.mutate(doc.id)} 
                            className="p-1 hover:bg-red-500/10 rounded text-slate-500 hover:text-red-400 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-3">
                <button 
                  onClick={() => deleteCase.mutate(activeCase.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={12} /> Supprimer le dossier
                </button>
              </div>
            </>
          ) : null}
        </aside>
      )}

      {/* Create Case Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><FolderOpen size={20} className="text-amber-500" /> Ouvrir un dossier</h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Titre du dossier</label>
                <input {...register('title')} placeholder="Affaire Kamdem c. Sarl BTP" className="w-full bg-slate-850 border border-slate-800 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-amber-500 transition-all" />
                {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Nom du client</label>
                <input {...register('clientName')} placeholder="Sébastien Kamdem" className="w-full bg-slate-850 border border-slate-800 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-amber-500 transition-all" />
                {errors.clientName && <p className="text-xs text-red-400">{errors.clientName.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Priorité</label>
                  <select {...register('priority')} className="w-full bg-slate-850 border border-slate-800 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-amber-500 transition-all">
                    <option value="LOW">Basse</option>
                    <option value="MEDIUM">Moyenne</option>
                    <option value="HIGH">Haute</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Assigner à</label>
                  <select {...register('assigneeId')} className="w-full bg-slate-850 border border-slate-800 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-amber-500 transition-all">
                    <option value="">Sélectionner un avocat</option>
                    {collaborators.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Description / Contexte</label>
                <textarea {...register('description')} rows={3} placeholder="Détails initiaux de l'affaire, litige commercial, etc." className="w-full bg-slate-850 border border-slate-800 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-amber-500 transition-all resize-none" />
              </div>

              <button 
                type="submit" 
                disabled={createCase.isPending}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl py-3 text-sm transition-all flex items-center justify-center gap-2 mt-4"
              >
                {createCase.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Créer le dossier'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { 
  Users, Plus, X, Search, Loader2, Mail
} from 'lucide-react';

const collaboratorSchema = z.object({
  firstName: z.string().min(2, 'Le prénom est requis'),
  lastName: z.string().min(2, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères'),
  role: z.enum(['LAWYER', 'ASSISTANT', 'SECRETARY']),
});

type CollaboratorForm = z.infer<typeof collaboratorSchema>;

export default function CollaboratorsPage() {
  const qc = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CollaboratorForm>({
    resolver: zodResolver(collaboratorSchema),
    defaultValues: { role: 'LAWYER' },
  });

  // Queries
  const { data: collaborators = [], isLoading } = useQuery({
    queryKey: ['collaborators'],
    queryFn: () => api.get('/users').then(r => r.data),
  });

  // Mutations
  const createCollab = useMutation({
    mutationFn: (values: CollaboratorForm) => api.post('/users', values).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collaborators'] });
      setIsAddOpen(false);
      reset();
      toast.success('Collaborateur ajouté au cabinet');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erreur lors de l'ajout");
    },
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      api.patch(`/users/${id}`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collaborators'] });
      toast.success('Statut du collaborateur modifié');
    },
  });

  const onSubmit = (values: CollaboratorForm) => {
    createCollab.mutate(values);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs px-2.5 py-0.5 rounded-full font-bold">Super Admin</span>;
      case 'CABINET_ADMIN':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-2.5 py-0.5 rounded-full font-bold">Associé (Gérant)</span>;
      case 'LAWYER':
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-2.5 py-0.5 rounded-full font-bold">Avocat</span>;
      case 'ASSISTANT':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-0.5 rounded-full font-bold">Paralégal / Assistant</span>;
      case 'SECRETARY':
        return <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs px-2.5 py-0.5 rounded-full font-bold">Secrétariat</span>;
      default:
        return <span className="bg-slate-800 text-slate-400 text-xs px-2.5 py-0.5 rounded-full">{role}</span>;
    }
  };

  const filteredCollabs = collaborators.filter((u: any) =>
    u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAdmin = ['CABINET_ADMIN', 'SUPER_ADMIN'].includes(currentUser?.role || '');

  return (
    <main className="flex-1 p-6 space-y-8 overflow-y-auto bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-amber-500" size={24} /> Équipe & Collaborateurs
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gérez les habilitations, ajoutez de nouveaux avocats ou assistants juridiques au sein de votre cabinet.
          </p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl py-2.5 px-5 text-sm transition-all shadow-lg shadow-amber-500/10 active:scale-[0.98]"
          >
            <Plus size={16} /> Ajouter un collaborateur
          </button>
        )}
      </div>

      {/* Search panel */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
        <input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Rechercher par prénom, nom ou adresse email..."
          className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-500 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
        />
      </div>

      {/* Collaborators list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-amber-500" />
        </div>
      ) : filteredCollabs.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-16 text-center text-slate-500">
          Aucun collaborateur trouvé.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider bg-slate-900/60">
                  <th className="p-4 pl-6">Nom</th>
                  <th className="p-4">Rôle</th>
                  <th className="p-4">Date d'embauche</th>
                  <th className="p-4">Statut</th>
                  {isAdmin && <th className="p-4 pr-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {filteredCollabs.map((col: any) => (
                  <tr key={col.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs shrink-0 shadow-md">
                          {col.firstName[0]}{col.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200">{col.firstName} {col.lastName}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1"><Mail size={10} /> {col.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{getRoleBadge(col.role)}</td>
                    <td className="p-4 text-slate-400 text-xs font-medium">
                      {new Date(col.createdAt).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}
                    </td>
                    <td className="p-4">
                      {col.isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium">
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full font-medium">
                          Inactif
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="p-4 pr-6 text-right">
                        {col.id !== currentUser?.id && (
                          <button
                            onClick={() => toggleStatus.mutate({ id: col.id, isActive: !col.isActive })}
                            className={`p-1.5 rounded-lg border transition-all text-xs font-semibold ${
                              col.isActive
                                ? 'bg-red-500/10 border-red-500/25 text-red-400 hover:bg-red-500/20'
                                : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                          >
                            {col.isActive ? 'Désactiver' : 'Réactiver'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Collaborator Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus size={20} className="text-amber-500" /> Ajouter un membre
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1 text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Prénom</label>
                  <input {...register('firstName')} placeholder="Adama" className="w-full bg-slate-850 border border-slate-800 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-amber-500 transition-all" />
                  {errors.firstName && <p className="text-xs text-red-400">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Nom</label>
                  <input {...register('lastName')} placeholder="Diop" className="w-full bg-slate-850 border border-slate-800 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-amber-500 transition-all" />
                  {errors.lastName && <p className="text-xs text-red-400">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Adresse Email</label>
                <input type="email" {...register('email')} placeholder="a.diop@cabinet.sn" className="w-full bg-slate-850 border border-slate-800 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-amber-500 transition-all" />
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Mot de passe temporaire</label>
                <input type="password" {...register('password')} placeholder="Min. 8 caractères" className="w-full bg-slate-850 border border-slate-800 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-amber-500 transition-all" />
                {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Rôle habilité</label>
                <select {...register('role')} className="w-full bg-slate-850 border border-slate-800 text-white text-sm rounded-lg px-4 py-2.5 outline-none focus:border-amber-500 transition-all">
                  <option value="LAWYER">Avocat</option>
                  <option value="ASSISTANT">Paralégal / Assistant</option>
                  <option value="SECRETARY">Secrétariat</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={createCollab.isPending}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl py-3 text-sm transition-all flex items-center justify-center gap-2 mt-4"
              >
                {createCollab.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Inscrire le collaborateur'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

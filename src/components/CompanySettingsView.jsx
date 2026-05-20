import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Mail, 
  Shield, 
  Copy, 
  Check, 
  Trash2, 
  Loader2, 
  Clock,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import useLexStore from '../store/useLexStore';
import { toast } from 'sonner';
import { Card, Badge } from './UI';

const CompanySettingsView = () => {
  const { currentUser } = useLexStore();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('lawyer');
  const [isInviting, setIsInviting] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastGeneratedLink, setLastGeneratedLink] = useState('');

  // 1. Protection du rôle 'admin'
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchInvitations();
    }
  }, [isAdmin]);

  const fetchInvitations = async () => {
    setIsLoading(true);
    try {
      // On récupère le firm_id strictement depuis le profil DB
      const firmId = currentUser?.firm_id;
      
      if (!firmId) return;

      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .is('accepted_at', null)
        .eq('firm_id', firmId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (err) {
      toast.error('Erreur lors du chargement des invitations');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-in fade-in duration-500">
        <AlertCircle size={48} className="mb-4 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Accès Restreint</h2>
        <p>Seuls les administrateurs du cabinet peuvent accéder à ces paramètres.</p>
      </div>
    );
  }

  const handleInvite = async (e) => {
    e.preventDefault();
    setIsInviting(true);
    setLastGeneratedLink('');

    try {
      const firmId = currentUser?.firm_id;
      
      if (!firmId) throw new Error("Impossible de récupérer l'ID de votre cabinet.");

      const { data, error } = await supabase
        .from('invitations')
        .insert({
          email,
          role,
          firm_id: firmId,
          invited_by: currentUser.id
        })
        .select()
        .single();

      if (error) throw error;

      const inviteLink = `${window.location.origin}/auth?invitation=${data.token}`;
      setLastGeneratedLink(inviteLink);
      toast.success('Invitation créée avec succès !');
      setEmail('');
      fetchInvitations();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsInviting(false);
    }
  };

  const revokeInvitation = async (id) => {
    if (!window.confirm('Voulez-vous vraiment révoquer cette invitation ?')) return;

    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Invitation révoquée');
      fetchInvitations();
    } catch (err) {
      toast.error('Erreur lors de la révocation');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Lien copié dans le presse-papier !');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Paramètres du Cabinet</h1>
        <p className="text-slate-500 dark:text-slate-400">Gérez vos collaborateurs et vos invitations en attente.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne de gauche : Formulaire */}
        <div className="lg:col-span-1">
          <Card className="p-6 h-fit border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
              <UserPlus size={18} className="text-amber-600" /> Nouvel invité
            </h3>
            
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email du collaborateur</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="email" required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maitre.durand@justice.fr"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Rôle attribué</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  >
                    <option value="lawyer">Collaborateur (Avocat)</option>
                    <option value="paralegal">Assistant / Juriste</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isInviting}
                className="w-full py-3 bg-slate-900 dark:bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-amber-700 shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isInviting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Générer le lien
              </button>
            </form>

            {lastGeneratedLink && (
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl animate-in zoom-in-95">
                <p className="text-[10px] font-bold text-amber-800 dark:text-amber-500 uppercase mb-2">Lien d'invitation généré :</p>
                <div className="flex gap-2">
                  <input 
                    readOnly
                    value={lastGeneratedLink}
                    className="flex-1 bg-white dark:bg-slate-950 border border-amber-200 dark:border-amber-800 rounded-lg px-2 py-1.5 text-[10px] text-slate-600 dark:text-slate-300 outline-none"
                  />
                  <button 
                    onClick={() => copyToClipboard(lastGeneratedLink)}
                    className="p-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors"
                  >
                    <Copy size={14} className="text-amber-600" />
                  </button>
                </div>
                <p className="text-[9px] text-amber-700 dark:text-amber-500/70 mt-2 italic">Ce lien permet à votre collaborateur de rejoindre directement votre structure.</p>
              </div>
            )}
          </Card>
        </div>

        {/* Colonne de droite : Liste des invitations */}
        <div className="lg:col-span-2">
          <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Clock size={18} className="text-slate-400" /> Invitations en attente
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-amber-500" size={32} />
              </div>
            ) : invitations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-4 px-2">Collaborateur</th>
                      <th className="pb-4 px-2">Rôle</th>
                      <th className="pb-4 px-2">Généré le</th>
                      <th className="pb-4 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {invitations.map((invite) => (
                      <tr key={invite.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-2">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">{invite.email}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <ExternalLink size={10} /> ID: {invite.token.slice(0, 8)}
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <Badge variant={invite.role === 'lawyer' ? 'info' : 'secondary'}>
                            {invite.role === 'lawyer' ? 'Collaborateur' : 'Assistant'}
                          </Badge>
                        </td>
                        <td className="py-4 px-2 text-xs text-slate-500">
                          {new Date(invite.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-2 text-right">
                          <div className="flex justify-end gap-1">
                            <button 
                              onClick={() => copyToClipboard(`${window.location.origin}/auth?invitation=${invite.token}`)}
                              className="p-2 text-slate-400 hover:text-amber-600 transition-colors rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20"
                              title="Copier le lien"
                            >
                              <Copy size={16} />
                            </button>
                            <button 
                              onClick={() => revokeInvitation(invite.id)}
                              className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Révoquer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="text-slate-300" size={24} />
                </div>
                <p className="text-slate-400 italic text-sm">Aucune invitation active pour le moment.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompanySettingsView;

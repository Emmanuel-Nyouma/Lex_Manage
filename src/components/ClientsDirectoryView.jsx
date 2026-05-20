import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Plus, 
  X, 
  Check,
  Building2,
  User as UserIcon,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import useLexStore from '../store/useLexStore';
import { toast } from 'sonner';
import { Card, Button, Input, Badge } from './UI';

const ClientsDirectoryView = () => {
  const { currentUser } = useLexStore();
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    type_client: 'physique'
  });

  useEffect(() => {
    fetchClients();
  }, [currentUser]);

  const fetchClients = async () => {
    if (!currentUser?.firm_id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('firm_id', currentUser.firm_id)
        .order('name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      toast.error('Erreur lors du chargement des clients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('clients')
        .insert({
          ...newClient,
          firm_id: currentUser.firm_id
        });

      if (error) throw error;
      
      toast.success('Client ajouté avec succès');
      setIsModalOpen(false);
      setNewClient({ name: '', email: '', phone: '', address: '', type_client: 'physique' });
      fetchClients();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="text-amber-500" /> Répertoire Clients
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Gérez les fiches contacts de votre cabinet.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={UserPlus}>
          Nouveau Client
        </Button>
      </div>

      <Card className="p-4 border-slate-200 dark:border-slate-800">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Rechercher un client (nom, email...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-amber-500" size={32} />
          </div>
        ) : filteredClients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-4 px-2">Client</th>
                  <th className="pb-4 px-2">Type</th>
                  <th className="pb-4 px-2">Contact</th>
                  <th className="pb-4 px-2">Adresse</th>
                  <th className="pb-4 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${client.type_client === 'morale' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                          {client.type_client === 'morale' ? <Building2 size={16} /> : <UserIcon size={16} />}
                        </div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{client.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <Badge variant={client.type_client === 'morale' ? 'info' : 'neutral'}>
                        {client.type_client === 'morale' ? 'Société' : 'Particulier'}
                      </Badge>
                    </td>
                    <td className="py-4 px-2">
                      <div className="space-y-1">
                        {client.email && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Mail size={12} /> {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Phone size={12} /> {client.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <p className="text-xs text-slate-500 max-w-[200px] truncate" title={client.address}>
                        {client.address || '--'}
                      </p>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 italic text-sm">
            Aucun client trouvé.
          </div>
        )}
      </Card>

      {/* Modal Création Client */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus size={20} className="text-amber-500" /> Ajouter un client
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateClient} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
                <button 
                  type="button"
                  onClick={() => setNewClient({...newClient, type_client: 'physique'})}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${newClient.type_client === 'physique' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <UserIcon size={14} /> Particulier
                </button>
                <button 
                  type="button"
                  onClick={() => setNewClient({...newClient, type_client: 'morale'})}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${newClient.type_client === 'morale' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Building2 size={14} /> Société
                </button>
              </div>

              <Input 
                label="Nom complet ou Raison sociale" 
                required
                value={newClient.name}
                onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                placeholder="ex: Jean Dupont ou SARL Tech"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Email" 
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  icon={Mail}
                  placeholder="contact@exemple.com"
                />
                <Input 
                  label="Téléphone" 
                  value={newClient.phone}
                  onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                  icon={Phone}
                  placeholder="06..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Adresse</label>
                <textarea 
                  value={newClient.address}
                  onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all dark:text-white min-h-[80px]"
                  placeholder="Adresse postale complète..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button type="submit" className="flex-1" isLoading={isSubmitting} icon={Check}>Enregistrer</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsDirectoryView;

import React, { useState } from 'react';
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
import { toast } from 'sonner';
import { Card, Button, Input, Badge } from './UI';
import { useClients, useCreateClient, useDeleteClient } from '../hooks/useClients';

const ClientsDirectoryView = () => {
  const { data: clients, isLoading, error } = useClients();
  const createClient = useCreateClient();
  const deleteClient = useDeleteClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    type_client: 'physique'
  });

  const handleCreateClient = async (e) => {
    e.preventDefault();
    createClient.mutate(newClient, {
      onSuccess: () => {
        setIsModalOpen(false);
        setNewClient({ name: '', email: '', phone: '', address: '', type_client: 'physique' });
      }
    });
  };

  const handleDeleteClient = async (id) => {
    if (window.confirm("Voulez-vous supprimer ce client ?")) {
      deleteClient.mutate(id);
    }
  };

  const filteredClients = (clients || []).filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <div className="p-8 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold">
        Erreur de chargement du répertoire : {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Users className="text-amber-500" /> Répertoire Clients
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gérez la base de données de contacts de votre cabinet.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={UserPlus} className="shadow-lg shadow-amber-500/20">
          Nouveau Client
        </Button>
      </div>

      <Card className="p-4 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900/50">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Rechercher un client par nom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium"
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-amber-500" size={40} />
            <p className="text-slate-400 font-bold animate-pulse">Accès au répertoire...</p>
          </div>
        ) : filteredClients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-4 px-4">Client</th>
                  <th className="pb-4 px-4">Type</th>
                  <th className="pb-4 px-4">Contact</th>
                  <th className="pb-4 px-4">Adresse</th>
                  <th className="pb-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all cursor-default">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${client.type_client === 'morale' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                          {client.type_client === 'morale' ? <Building2 size={20} /> : <UserIcon size={20} />}
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">{client.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={client.type_client === 'morale' ? 'info' : 'secondary'} className="px-3">
                        {client.type_client === 'morale' ? 'Société' : 'Particulier'}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1.5">
                        {client.email && (
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                            <Mail size={13} className="text-slate-400" /> {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                            <Phone size={13} className="text-slate-400" /> {client.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-xs text-slate-500 max-w-[240px] truncate font-medium" title={client.address}>
                        {client.address || '--'}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right">
                       <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClient(client.id)}
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
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
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
               <UserIcon size={32} />
            </div>
            <p className="text-slate-500 font-medium italic">Aucun client ne correspond à votre recherche.</p>
            <Button onClick={() => setIsModalOpen(true)} variant="secondary" size="sm">Ajouter un nouveau client</Button>
          </div>
        )}
      </Card>

      {/* Modal Création Client */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-300 border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                    <UserPlus size={20} />
                 </div>
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Ajouter un client</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-all p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateClient} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl mb-4 border dark:border-slate-800">
                <button 
                  type="button"
                  onClick={() => setNewClient({...newClient, type_client: 'physique'})}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black transition-all ${newClient.type_client === 'physique' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <UserIcon size={14} /> PARTICULIER
                </button>
                <button 
                  type="button"
                  onClick={() => setNewClient({...newClient, type_client: 'morale'})}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black transition-all ${newClient.type_client === 'morale' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Building2 size={14} /> SOCIÉTÉ
                </button>
              </div>

              <Input 
                label="Nom complet ou Raison sociale" 
                required
                value={newClient}
                onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                placeholder="ex: Emmanuel Kamdem ou SARL Tech Africa"
                className="font-bold"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Email professionnel" 
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
                  placeholder="+237..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Adresse de résidence ou siège</label>
                <textarea 
                  value={newClient.address}
                  onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all dark:text-white min-h-[100px] resize-none font-medium"
                  placeholder="Rue, Ville, BP..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button variant="secondary" className="flex-1 font-bold" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button type="submit" className="flex-1 font-bold" isLoading={createClient.isPending} icon={Check}>Enregistrer le client</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsDirectoryView;

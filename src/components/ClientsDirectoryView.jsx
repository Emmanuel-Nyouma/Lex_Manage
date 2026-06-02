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
import { Card, Button, Input, Badge } from './ui';
import { useClients, useCreateClient, useDeleteClient } from '../hooks/useClients';

const ClientsDirectoryView = () => {
  const { data: clients, isLoading, error, refetch } = useClients();
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
    if (window.confirm("Are you sure you want to delete this client?")) {
      deleteClient.mutate(id);
    }
  };

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsModalOpen(false);
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleCreateClient(e);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, newClient]);

  const filteredClients = (clients || []).filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) {
    let errorMessage = "Something went wrong. Please try again.";
    if (error.response?.status === 401) {
      errorMessage = "Your session has expired. Please log in again.";
    } else if (error.response?.status === 403) {
      errorMessage = "You don't have permission to access this resource.";
    } else if (error.message === 'Network Error') {
      errorMessage = "Network issue. Check your connection.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-2xl flex justify-between items-center animate-in fade-in">
        <span className="text-red-700 font-bold">Error loading directory: {errorMessage}</span>
        {refetch && (
          <button onClick={() => refetch()} className="text-red-600 hover:text-red-800 underline font-semibold transition-colors">
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Users className="text-amber-500" /> Clients Directory
          </h1>
          <p className="text-slate-600 dark:text-slate-300 dark:text-slate-400 font-medium">Manage your firm's contact database.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={UserPlus} className="shadow-lg shadow-amber-500/20">
          New Client
        </Button>
      </div>

      <Card className="p-4 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900/50">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" size={18} />
          <input 
            type="text"
            placeholder="Search for a client by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium"
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-amber-500" size={40} />
            <p className="text-slate-500 dark:text-slate-300 font-bold animate-pulse">Accessing directory...</p>
          </div>
        ) : filteredClients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-4 px-4">Client</th>
                  <th className="pb-4 px-4">Type</th>
                  <th className="pb-4 px-4">Contact</th>
                  <th className="pb-4 px-4">Address</th>
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
                        {client.type_client === 'morale' ? 'Company' : 'Individual'}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1.5">
                        {client.email && (
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                            <Mail size={13} className="text-slate-500 dark:text-slate-300" /> {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                            <Phone size={13} className="text-slate-500 dark:text-slate-300" /> {client.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-xs text-slate-600 dark:text-slate-300 max-w-[240px] truncate font-medium" title={client.address}>
                        {client.address || '--'}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right">
                       <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-slate-500 dark:text-slate-300 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClient(client.id)}
                            className="p-2 text-slate-500 dark:text-slate-300 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
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
            <p className="text-slate-600 dark:text-slate-300 font-medium italic">No clients match your search.</p>
            <Button onClick={() => setIsModalOpen(true)} variant="secondary" size="sm">Add a new client</Button>
          </div>
        )}
      </Card>

      {/* Modal Création Client */}
      {isModalOpen && (
        <div 
          role="dialog"
          aria-labelledby="client-modal-title"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-300 border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                    <UserPlus size={20} />
                 </div>
                 <h2 id="client-modal-title" className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Add a client</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 dark:text-slate-300 hover:text-slate-600 transition-all p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateClient} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl mb-4 border dark:border-slate-800">
                <button 
                  type="button"
                  onClick={() => setNewClient({...newClient, type_client: 'physique'})}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black transition-all ${newClient.type_client === 'physique' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-600 dark:text-slate-300 hover:text-slate-700'}`}
                >
                  <UserIcon size={14} /> INDIVIDUAL
                </button>
                <button 
                  type="button"
                  onClick={() => setNewClient({...newClient, type_client: 'morale'})}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black transition-all ${newClient.type_client === 'morale' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-600 dark:text-slate-300 hover:text-slate-700'}`}
                >
                  <Building2 size={14} /> COMPANY
                </button>
              </div>

              <Input 
                label="Full Name or Company Name" 
                required
                value={newClient.name}
                onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                placeholder="e.g. John Doe or Tech Africa Ltd"
                className="font-bold"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Professional Email" 
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  icon={Mail}
                  placeholder="contact@example.com"
                />
                <Input 
                  label="Phone" 
                  value={newClient.phone}
                  onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                  icon={Phone}
                  placeholder="+237..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest mb-2">Residential or Headquarters Address</label>
                <textarea 
                  value={newClient.address}
                  onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all dark:text-white min-h-[100px] resize-none font-medium"
                  placeholder="Street, City, P.O. Box..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button variant="secondary" className="flex-1 font-bold" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 font-bold" isLoading={createClient.isPending} icon={Check}>Save Client</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsDirectoryView;



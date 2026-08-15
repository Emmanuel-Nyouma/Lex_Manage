import React, { useState } from 'react';
import { useNavigate } from '../lib/router';
import {
  Users, UserPlus, Search, Mail, Phone, MapPin,
  Trash2, Edit2, X, Building2, User as UserIcon,
  ChevronRight,
  AlertCircle, RefreshCcw,
} from 'lucide-react';
import { Card, Button, Badge, PageSkeleton } from './ui';
import { useClients, useDeleteClient } from '../hooks/useClients';
import useLexStore from '../store/useLexStore';
import NewClientModal from './clients/NewClientModal';

const ClientsDirectoryView = () => {
  const navigate = useNavigate();
  const { data: clients, isLoading, error, refetch } = useClients();
  const deleteClient = useDeleteClient();

  const currentUser = useLexStore((s) => s.currentUser);
  const isAdmin = currentUser?.role === 'CABINET_ADMIN' || currentUser?.role === 'SUPER_ADMIN';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredClients = (clients || []).filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchPopup(value.length > 0);
  };

  const handleDeleteClient = async (id) => {
    if (!isAdmin) return;
    if (window.confirm("Are you sure you want to delete this client?")) {
      deleteClient.mutate(id);
    }
  };

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
      <div className="p-6 bg-white dark:bg-slate-900 border-l-4 border-red-500 rounded-2xl shadow-sm flex items-start gap-4 animate-in fade-in duration-300">
        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-500">
          <AlertCircle size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 dark:text-white">Directory Sync Error</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{errorMessage}</p>
          {refetch && (
            <button 
              onClick={() => refetch()} 
              className="mt-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
            >
              <RefreshCcw size={12} /> Retry Connection
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Users className="text-amber-500" /> Clients Directory
          </h1>
          <p className="text-slate-600 dark:text-slate-300 dark:text-slate-400 font-medium">Manage your firm's contact database.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsModalOpen(true)} icon={UserPlus} className="w-full md:w-auto shadow-lg shadow-amber-500/20">
            New Client
          </Button>
        )}
      </div>

      <Card className="p-4 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50 relative overflow-visible">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" size={18} />
          <input 
            type="text"
            placeholder="Quick search client..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery.length > 0 && setShowSearchPopup(true)}
            className="w-full sm:max-w-md pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium"
          />

          {/* Search Results Popup */}
          {showSearchPopup && (
            <div className="absolute top-full left-0 w-full sm:max-w-md mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[80] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Results for "{searchQuery}"</span>
                <button onClick={() => setShowSearchPopup(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                  <X size={14} className="text-slate-400" />
                </button>
              </div>
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {filteredClients.length > 0 ? (
                  filteredClients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => {
                        navigate(`/clients/${client.id}`);
                        setShowSearchPopup(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0 text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${client.type_client === 'morale' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                        {client.type_client === 'morale' ? <Building2 size={16} /> : <UserIcon size={16} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{client.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{client.email || 'No email'}</p>
                      </div>
                      <ChevronRight size={14} className="text-slate-300" />
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                      <Search size={24} />
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Aucun résultat</p>
                    <p className="text-[10px] text-slate-500 mt-1">Nous n'avons trouvé aucun client correspondant à "{searchQuery}".</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <PageSkeleton variant="table" className="py-2" />
          </div>
        ) : filteredClients.length > 0 ? (
          <>
          {/* Mobile: client cards (< md) */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filteredClients.map((client) => (
              <div 
                key={client.id} 
                className="py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors px-2 rounded-xl"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${client.type_client === 'morale' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                      {client.type_client === 'morale' ? <Building2 size={20} /> : <UserIcon size={20} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{client.name}</p>
                      <Badge variant={client.type_client === 'morale' ? 'info' : 'secondary'} className="mt-1 text-[9px]">
                        {client.type_client === 'morale' ? 'Company' : 'Individual'}
                      </Badge>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); /* handle edit */ }}
                        className="p-2.5 text-slate-500 dark:text-slate-300 hover:text-blue-600 transition-colors rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        aria-label="Edit client"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }}
                        className="p-2.5 text-slate-500 dark:text-slate-300 hover:text-red-600 transition-colors rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
                        aria-label="Delete client"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-3 pl-[52px] space-y-1.5">
                  {client.email && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium truncate">
                      <Mail size={13} className="text-slate-500 dark:text-slate-300 shrink-0" /> <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
                      <Phone size={13} className="text-slate-500 dark:text-slate-300 shrink-0" /> {client.phone}
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <MapPin size={13} className="text-slate-500 dark:text-slate-300 shrink-0" /> <span className="truncate">{client.address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop / tablet: table (≥ md) */}
          <div className="overflow-x-auto hidden md:block">
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
                  <tr 
                    key={client.id} 
                    onClick={() => navigate(`/clients/${client.id}`)}
                    className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all cursor-pointer"
                  >
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
                      {isAdmin && (
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-2 text-slate-500 dark:text-slate-300 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteClient(client.id); }}
                            className="p-2 text-slate-500 dark:text-slate-300 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        ) : (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
               <UserIcon size={32} />
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium italic">No clients match your search.</p>
            {isAdmin && <Button onClick={() => setIsModalOpen(true)} variant="secondary" size="sm">Add a new client</Button>}
          </div>
        )}
      </Card>

      {isAdmin && <NewClientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default ClientsDirectoryView;

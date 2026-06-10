import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Search, Mail, Phone, MapPin,
  Trash2, Edit2, X, Check, Building2, User as UserIcon,
  Loader2, ChevronRight, Briefcase, CalendarClock, ChevronDown, Link2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, Button, Input, Badge } from './ui';
import { useClients, useCreateClient, useDeleteClient } from '../hooks/useClients';
import { useCases } from '../hooks/useCases';
import { useGlobalDeadlines } from '../hooks/useCalendar';
import useLexStore from '../store/useLexStore';

const ClientsDirectoryView = () => {
  const navigate = useNavigate();
  const { data: clients, isLoading, error, refetch } = useClients();
  const createClient = useCreateClient();
  const deleteClient = useDeleteClient();

  const currentUser = useLexStore((s) => s.currentUser);
  const isAdmin = currentUser?.role === 'CABINET_ADMIN' || currentUser?.role === 'SUPER_ADMIN';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '', email: '', phone: '', address: '', type_client: 'physique',
    caseId: '', deadlineId: '',
  });
  const [linkExpanded,  setLinkExpanded]  = useState(false);
  const [caseSearch,    setCaseSearch]    = useState('');
  const [deadlineSearch, setDeadlineSearch] = useState('');
  const [caseOpen,      setCaseOpen]      = useState(false);
  const [deadlineOpen,  setDeadlineOpen]  = useState(false);

  const { data: casesData } = useCases(1, 100);
  const { data: deadlines = [] } = useGlobalDeadlines();
  const allCases = casesData?.cases ?? [];

  const filteredCaseDrop = allCases.filter((c) =>
    c.title.toLowerCase().includes(caseSearch.toLowerCase())
  );
  const filteredDeadlineDrop = (deadlines).filter((d) =>
    !d.isDone && d.title.toLowerCase().includes(deadlineSearch.toLowerCase())
  );

  const selectedCase     = allCases.find((c) => c.id === newClient.caseId);
  const selectedDeadline = deadlines.find((d) => d.id === newClient.deadlineId);

  const filteredClients = (clients || []).filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchPopup(value.length > 0);
  };

  const handleCreateClient = useCallback(async (e) => {
    e.preventDefault();
    if (!newClient.name || newClient.name.trim().length < 2) {
      toast.error('Client name is required (min. 2 characters).');
      return;
    }
    // Strip empty optional fields — backend Zod rejects '' for uuid/email fields
    const payload = { ...newClient };
    if (!payload.caseId) delete payload.caseId;
    if (!payload.deadlineId) delete payload.deadlineId;
    if (!payload.email) delete payload.email;

    createClient.mutate(payload, {
      onSuccess: () => {
        toast.success('Client added successfully.');
        setIsModalOpen(false);
        setNewClient({ name: '', email: '', phone: '', address: '', type_client: 'physique', caseId: '', deadlineId: '' });
        setLinkExpanded(false); setCaseSearch(''); setDeadlineSearch('');
      },
      onError: (err) => {
        const msg = err.response?.data?.message;
        toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Could not add the client. Please try again.'));
      },
    });
  }, [createClient, newClient]);

  const handleDeleteClient = async (id) => {
    if (!isAdmin) return;
    if (window.confirm("Are you sure you want to delete this client?")) {
      deleteClient.mutate(id);
    }
  };

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (caseOpen) { setCaseOpen(false); return; }
        if (deadlineOpen) { setDeadlineOpen(false); return; }
        setIsModalOpen(false); setLinkExpanded(false);
      }
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && !caseOpen && !deadlineOpen) {
        e.preventDefault();
        handleCreateClient(e);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, newClient, handleCreateClient, caseOpen, deadlineOpen]);

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
            <Loader2 className="animate-spin text-amber-500" size={40} />
            <p className="text-slate-500 dark:text-slate-300 font-bold animate-pulse">Accessing directory...</p>
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

      {/* Modal Création Client — admin only */}
      {isModalOpen && isAdmin && (
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
              <button
                onClick={() => { setIsModalOpen(false); setLinkExpanded(false); }}
                className="text-slate-500 dark:text-slate-300 hover:text-slate-600 transition-all p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-4 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border dark:border-slate-800">
                <button type="button" onClick={() => setNewClient({...newClient, type_client: 'physique'})}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black transition-all ${newClient.type_client === 'physique' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-600 dark:text-slate-300 hover:text-slate-700'}`}>
                  <UserIcon size={14} /> INDIVIDUAL
                </button>
                <button type="button" onClick={() => setNewClient({...newClient, type_client: 'morale'})}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black transition-all ${newClient.type_client === 'morale' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-600 dark:text-slate-300 hover:text-slate-700'}`}>
                  <Building2 size={14} /> COMPANY
                </button>
              </div>

              <Input label="Full Name or Company Name" required value={newClient.name}
                onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                placeholder="e.g. John Doe or Tech Africa Ltd" className="font-bold" />

              <div className="grid grid-cols-2 gap-4">
                <Input label="Professional Email" type="email" value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  icon={Mail} placeholder="contact@example.com" />
                <Input label="Phone" value={newClient.phone}
                  onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                  icon={Phone} placeholder="+237..." />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest mb-2">Residential or Headquarters Address</label>
                <textarea value={newClient.address}
                  onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all dark:text-white min-h-[80px] resize-none font-medium"
                  placeholder="Street, City, P.O. Box..." />
              </div>

              {/* ── Link to case / calendar event ── */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setLinkExpanded((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="flex items-center gap-2 text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                    <Link2 size={14} className="text-amber-500" />
                    Link to existing record
                    {(newClient.caseId || newClient.deadlineId) && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                    )}
                  </span>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${linkExpanded ? 'rotate-180' : ''}`} />
                </button>

                {linkExpanded && (
                  <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">

                    {/* Case dropdown */}
                    <div className="relative">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Briefcase size={11} /> Link to a Case (optional)
                      </label>
                      <button
                        type="button"
                        onClick={() => { setCaseOpen((v) => !v); setDeadlineOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all ${
                          newClient.caseId
                            ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-300 font-bold'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-500'
                        }`}
                      >
                        <span className="truncate">{selectedCase ? selectedCase.title : 'Select a case…'}</span>
                        <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${caseOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {caseOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                            <div className="relative">
                              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input autoFocus type="text" value={caseSearch}
                                onChange={(e) => setCaseSearch(e.target.value)}
                                placeholder="Search cases…"
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-amber-500/20 dark:text-white" />
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            {newClient.caseId && (
                              <button type="button" onClick={() => { setNewClient({...newClient, caseId: ''}); setCaseOpen(false); }}
                                className="w-full px-3 py-2 text-left text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 border-b border-slate-100 dark:border-slate-800 font-bold">
                                ✕ Remove link
                              </button>
                            )}
                            {filteredCaseDrop.length === 0
                              ? <p className="px-3 py-4 text-xs text-slate-400 text-center italic">No cases found</p>
                              : filteredCaseDrop.map((c) => (
                                <button key={c.id} type="button"
                                  onClick={() => { setNewClient({...newClient, caseId: c.id, deadlineId: ''}); setCaseOpen(false); setCaseSearch(''); }}
                                  className={`w-full px-3 py-2.5 text-left hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0 ${c.id === newClient.caseId ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}>
                                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{c.title}</p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{c.status} · {c.clientName}</p>
                                </button>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Deadline dropdown */}
                    <div className="relative">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <CalendarClock size={11} /> Link to a Calendar Event (optional)
                      </label>
                      <button
                        type="button"
                        onClick={() => { setDeadlineOpen((v) => !v); setCaseOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all ${
                          newClient.deadlineId
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 font-bold'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-500'
                        }`}
                      >
                        <span className="truncate">{selectedDeadline ? selectedDeadline.title : 'Select a calendar event…'}</span>
                        <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${deadlineOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {deadlineOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                            <div className="relative">
                              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input autoFocus type="text" value={deadlineSearch}
                                onChange={(e) => setDeadlineSearch(e.target.value)}
                                placeholder="Search events…"
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white" />
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            {newClient.deadlineId && (
                              <button type="button" onClick={() => { setNewClient({...newClient, deadlineId: ''}); setDeadlineOpen(false); }}
                                className="w-full px-3 py-2 text-left text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 border-b border-slate-100 dark:border-slate-800 font-bold">
                                ✕ Remove link
                              </button>
                            )}
                            {filteredDeadlineDrop.length === 0
                              ? <p className="px-3 py-4 text-xs text-slate-400 text-center italic">No upcoming events found</p>
                              : filteredDeadlineDrop.map((d) => (
                                <button key={d.id} type="button"
                                  onClick={() => { setNewClient({...newClient, deadlineId: d.id, caseId: ''}); setDeadlineOpen(false); setDeadlineSearch(''); }}
                                  className={`w-full px-3 py-2.5 text-left hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0 ${d.id === newClient.deadlineId ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{d.title}</p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                    {new Date(d.dueAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    {d.case ? ` · ${d.case.title}` : ''}
                                  </p>
                                </button>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>

                    {(newClient.caseId || newClient.deadlineId) && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                        <Link2 size={10} />
                        {newClient.caseId
                          ? `Client will be linked to: "${selectedCase?.title}"`
                          : `Client will be linked via event: "${selectedDeadline?.title}"`}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <Button variant="secondary" className="flex-1 font-bold"
                  onClick={() => { setIsModalOpen(false); setLinkExpanded(false); }}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 font-bold" isLoading={createClient.isPending} icon={Check}>
                  Save Client
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsDirectoryView;



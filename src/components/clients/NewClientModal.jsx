import React, { useState } from 'react';
import {
  Briefcase,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  Link2,
  Mail,
  Phone,
  Search,
  User as UserIcon,
  UserPlus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCreateClient } from '../../hooks/useClients';
import { useCases } from '../../hooks/useCases';
import { useGlobalDeadlines } from '../../hooks/useCalendar';
import { formatLegalDate } from '../../utils/dateOnly';
import { Button, FocusTrap, Input } from '../ui';

const EMPTY_CLIENT = {
  name: '',
  email: '',
  phone: '',
  address: '',
  type_client: 'physique',
  caseId: '',
  deadlineId: '',
};

const NewClientModal = ({ isOpen, onClose }) => {
  const createClient = useCreateClient();
  const { data: casesData } = useCases(100);
  const { data: deadlines = [] } = useGlobalDeadlines();
  const [client, setClient] = useState(EMPTY_CLIENT);
  const [linkExpanded, setLinkExpanded] = useState(false);
  const [caseSearch, setCaseSearch] = useState('');
  const [deadlineSearch, setDeadlineSearch] = useState('');
  const [caseOpen, setCaseOpen] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);

  const allCases = casesData?.cases ?? [];
  const filteredCases = allCases.filter((item) =>
    item.title.toLowerCase().includes(caseSearch.toLowerCase()),
  );
  const filteredDeadlines = deadlines.filter((item) =>
    !item.isDone && item.title.toLowerCase().includes(deadlineSearch.toLowerCase()),
  );
  const selectedCase = allCases.find((item) => item.id === client.caseId);
  const selectedDeadline = deadlines.find((item) => item.id === client.deadlineId);

  const reset = () => {
    setClient(EMPTY_CLIENT);
    setLinkExpanded(false);
    setCaseSearch('');
    setDeadlineSearch('');
    setCaseOpen(false);
    setDeadlineOpen(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleCloseRequest = () => {
    if (caseOpen) {
      setCaseOpen(false);
      return;
    }
    if (deadlineOpen) {
      setDeadlineOpen(false);
      return;
    }
    close();
  };

  const updateClient = (field, value) => {
    setClient((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (client.name.trim().length < 2) {
      toast.error('Client name is required (min. 2 characters).');
      return;
    }

    const payload = { ...client, name: client.name.trim() };
    if (!payload.caseId) delete payload.caseId;
    if (!payload.deadlineId) delete payload.deadlineId;
    if (!payload.email) delete payload.email;

    createClient.mutate(payload, {
      onSuccess: () => {
        toast.success('Client added successfully.');
        close();
      },
      onError: (error) => {
        const message = error.response?.data?.message;
        toast.error(Array.isArray(message) ? message[0] : (message || 'Could not add the client. Please try again.'));
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <FocusTrap isActive onClose={handleCloseRequest}>
        <div
          role="dialog"
          aria-labelledby="client-modal-title"
          aria-modal="true"
          className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-300 border border-slate-200 dark:border-slate-800"
        >
          <div className="px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                <UserPlus size={20} />
              </div>
              <h2 id="client-modal-title" className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Add a client</h2>
            </div>
            <button type="button" onClick={close} aria-label="Close client form" className="text-slate-500 dark:text-slate-300 hover:text-slate-600 transition-all p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-4 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border dark:border-slate-800">
              <button type="button" onClick={() => updateClient('type_client', 'physique')} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black transition-all ${client.type_client === 'physique' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-600 dark:text-slate-300 hover:text-slate-700'}`}>
                <UserIcon size={14} /> INDIVIDUAL
              </button>
              <button type="button" onClick={() => updateClient('type_client', 'morale')} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black transition-all ${client.type_client === 'morale' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-600 dark:text-slate-300 hover:text-slate-700'}`}>
                <Building2 size={14} /> COMPANY
              </button>
            </div>

            <Input label="Full Name or Company Name" required value={client.name} onChange={(event) => updateClient('name', event.target.value)} placeholder="e.g. John Doe or Tech Africa Ltd" className="font-bold" />

            <div className="grid grid-cols-2 gap-4">
              <Input label="Professional Email" type="email" value={client.email} onChange={(event) => updateClient('email', event.target.value)} icon={Mail} placeholder="contact@example.com" />
              <Input label="Phone" value={client.phone} onChange={(event) => updateClient('phone', event.target.value)} icon={Phone} placeholder="+237..." />
            </div>

            <div>
              <label htmlFor="client-address" className="block text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest mb-2">Residential or Headquarters Address</label>
              <textarea id="client-address" value={client.address} onChange={(event) => updateClient('address', event.target.value)} className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all dark:text-white min-h-[80px] resize-none font-medium" placeholder="Street, City, P.O. Box..." />
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
              <button type="button" onClick={() => setLinkExpanded((value) => !value)} aria-expanded={linkExpanded} className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="flex items-center gap-2 text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                  <Link2 size={14} className="text-amber-500" /> Link to existing record
                  {(client.caseId || client.deadlineId) && <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />}
                </span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${linkExpanded ? 'rotate-180' : ''}`} />
              </button>

              {linkExpanded && (
                <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Briefcase size={11} /> Link to a Case (optional)</label>
                    <button type="button" onClick={() => { setCaseOpen((value) => !value); setDeadlineOpen(false); }} aria-expanded={caseOpen} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all ${client.caseId ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-300 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-500'}`}>
                      <span className="truncate">{selectedCase ? selectedCase.title : 'Select a case…'}</span>
                      <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${caseOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {caseOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                        <div className="p-2 border-b border-slate-100 dark:border-slate-800"><div className="relative"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input autoFocus type="text" value={caseSearch} onChange={(event) => setCaseSearch(event.target.value)} placeholder="Search cases…" className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-amber-500/20 dark:text-white" /></div></div>
                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                          {client.caseId && <button type="button" onClick={() => { updateClient('caseId', ''); setCaseOpen(false); }} className="w-full px-3 py-2 text-left text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 border-b border-slate-100 dark:border-slate-800 font-bold">✕ Remove link</button>}
                          {filteredCases.length === 0 ? <p className="px-3 py-4 text-xs text-slate-400 text-center italic">No cases found</p> : filteredCases.map((item) => (
                            <button key={item.id} type="button" onClick={() => { setClient((current) => ({ ...current, caseId: item.id, deadlineId: '' })); setCaseOpen(false); setCaseSearch(''); }} className={`w-full px-3 py-2.5 text-left hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0 ${item.id === client.caseId ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}>
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.title}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.status} · {item.clientName}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><CalendarClock size={11} /> Link to a Calendar Event (optional)</label>
                    <button type="button" onClick={() => { setDeadlineOpen((value) => !value); setCaseOpen(false); }} aria-expanded={deadlineOpen} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all ${client.deadlineId ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-500'}`}>
                      <span className="truncate">{selectedDeadline ? selectedDeadline.title : 'Select a calendar event…'}</span>
                      <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${deadlineOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {deadlineOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                        <div className="p-2 border-b border-slate-100 dark:border-slate-800"><div className="relative"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input autoFocus type="text" value={deadlineSearch} onChange={(event) => setDeadlineSearch(event.target.value)} placeholder="Search events…" className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white" /></div></div>
                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                          {client.deadlineId && <button type="button" onClick={() => { updateClient('deadlineId', ''); setDeadlineOpen(false); }} className="w-full px-3 py-2 text-left text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 border-b border-slate-100 dark:border-slate-800 font-bold">✕ Remove link</button>}
                          {filteredDeadlines.length === 0 ? <p className="px-3 py-4 text-xs text-slate-400 text-center italic">No upcoming events found</p> : filteredDeadlines.map((item) => (
                            <button key={item.id} type="button" onClick={() => { setClient((current) => ({ ...current, deadlineId: item.id, caseId: '' })); setDeadlineOpen(false); setDeadlineSearch(''); }} className={`w-full px-3 py-2.5 text-left hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0 ${item.id === client.deadlineId ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.title}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">{formatLegalDate(item.dueAt, 'fr-FR', { month: 'short', day: 'numeric', year: 'numeric' })}{item.case ? ` · ${item.case.title}` : ''}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {(client.caseId || client.deadlineId) && <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5"><Link2 size={10} />{client.caseId ? `Client will be linked to: "${selectedCase?.title}"` : `Client will be linked via event: "${selectedDeadline?.title}"`}</p>}
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-3">
              <Button type="button" variant="secondary" className="flex-1 font-bold" onClick={close}>Cancel</Button>
              <Button type="submit" className="flex-1 font-bold" isLoading={createClient.isPending} icon={Check}>Save Client</Button>
            </div>
          </form>
        </div>
      </FocusTrap>
    </div>
  );
};

export default NewClientModal;

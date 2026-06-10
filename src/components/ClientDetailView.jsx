import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Clock, 
  Building2, 
  User as UserIcon, 
  ChevronRight,
  Plus,
  Loader2,
  FileText,
  Files,
  Download,
  ExternalLink,
  Gavel,
  CreditCard,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Card, Button, Badge, Skeleton } from './ui';
import { useClient } from '../hooks/useClients';

const ClientDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('cases'); // 'cases', 'documents', 'hearings', 'billing'
  const { data: client, isLoading, error } = useClient(id);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-1" />
          <Skeleton className="h-64 col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-10 text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <UserIcon size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Client not found</h2>
        <Button variant="secondary" onClick={() => navigate('/clients')}>Back to Directory</Button>
      </div>
    );
  }

  // Aggregate all documents from all cases
  const allDocuments = client.cases?.reduce((acc, c) => {
    if (c.documents) {
      const docsWithCaseInfo = c.documents.map(doc => ({
        ...doc,
        caseTitle: c.title,
        caseId: c.id
      }));
      return [...acc, ...docsWithCaseInfo];
    }
    return acc;
  }, []) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/clients')}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-amber-500 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{client.name}</h1>
              <Badge variant={client.type_client === 'morale' ? 'info' : 'secondary'} className="ml-2">
                {client.type_client === 'morale' ? 'Company' : 'Individual'}
              </Badge>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Customer 360° Profile</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="secondary" icon={Briefcase} className="flex-1 md:flex-none">Edit Profile</Button>
          <Button icon={Plus} className="flex-1 md:flex-none shadow-lg shadow-amber-500/20">New Case</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client Info */}
        <div className="space-y-6">
          <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col items-center py-4">
              <div className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-inner mb-4 ${client.type_client === 'morale' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                {client.type_client === 'morale' ? <Building2 size={48} /> : <UserIcon size={48} />}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{client.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Since {new Date(client.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400">
                  <Mail size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Email</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{client.email || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400">
                  <Phone size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Phone</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{client.phone || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Address</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-snug">{client.address || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-slate-200 dark:border-slate-800 bg-amber-500/5 border-l-4 border-l-amber-500">
            <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Clock size={14} /> Quick Stats
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{client.cases?.length || 0}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Total Cases</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {allDocuments.length}
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Total Docs</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Dynamic Tabs (Cases / Documents / Hearings / Billing) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Selection */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-fit">
            <button 
              onClick={() => setActiveTab('cases')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeTab === 'cases' ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              <Briefcase size={12} /> CASES
            </button>
            <button 
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeTab === 'documents' ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              <Files size={12} /> DOCUMENTS
            </button>
            <button 
              onClick={() => setActiveTab('hearings')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeTab === 'hearings' ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              <Gavel size={12} /> HEARINGS
            </button>
            <button 
              onClick={() => setActiveTab('billing')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeTab === 'billing' ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              <CreditCard size={12} /> BILLING
            </button>
          </div>

          {activeTab === 'cases' && (
            <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Case History</h2>
                <Badge variant="info" className="px-3 font-bold">{client.cases?.length || 0} Records</Badge>
              </div>

              {client.cases?.length > 0 ? (
                <div className="space-y-4">
                  {client.cases.map((c) => (
                    <Card 
                      key={c.id} 
                      className="p-5 hover:border-amber-300 dark:hover:border-amber-500/50 transition-all cursor-pointer group"
                      onClick={() => navigate(`/cases`)}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">{c.title}</h3>
                            <Badge variant={c.status === 'OPEN' ? 'warning' : 'info'}>{c.status}</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                            <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(c.createdAt).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1.5"><UserIcon size={12} /> {c.assignee?.firstName} {c.assignee?.lastName}</span>
                            <span className="flex items-center gap-1.5 text-amber-600"><FileText size={12} /> {c._count?.documents || 0} Documents</span>
                          </div>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-amber-500 transition-all group-hover:translate-x-1" size={20} />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center border-dashed border-2">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300 mb-4">
                    <Briefcase size={24} />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">No cases recorded for this client yet.</p>
                  <Button variant="secondary" size="sm" className="mt-4" icon={Plus}>Start First Case</Button>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">All Client Documents</h2>
                <Badge variant="info" className="px-3 font-bold">{allDocuments.length} Files</Badge>
              </div>

              {allDocuments.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {allDocuments.map((doc) => (
                    <Card key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{doc.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">In Case:</p>
                            <span className="text-[10px] text-amber-600 font-black uppercase truncate max-w-[150px]">{doc.caseTitle}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button className="p-2 text-slate-400 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                          <Download size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center border-dashed border-2">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300 mb-4">
                    <Files size={24} />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">No documents found for this client across any cases.</p>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'hearings' && (
            <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Upcoming Hearings</h2>
                <Badge variant="warning" className="px-3 font-bold">Scheduled</Badge>
              </div>

              <div className="space-y-4">
                <Card className="p-5 border-l-4 border-l-amber-500 bg-amber-50/30 dark:bg-amber-900/10">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-amber-600">
                      <Calendar size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white">Plaidoirie Finale</h3>
                          <p className="text-xs text-slate-500 font-bold uppercase mt-1">Court: Tribunal de Grande Instance</p>
                        </div>
                        <Badge variant="warning">Tomorrow at 09:00</Badge>
                      </div>
                      <div className="mt-4 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span className="flex items-center gap-1"><Briefcase size={12} /> Case: Litige Commercial A12</span>
                        <span className="flex items-center gap-1"><MapPin size={12} /> Salle 402</span>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-12 text-center border-dashed border-2 opacity-60">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300 mb-4">
                    <Gavel size={24} />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-medium italic">No other hearings scheduled.</p>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Billing & Invoices</h2>
                <div className="flex gap-2">
                   <Badge variant="success" className="px-3 font-bold">Paid: 1.2M CFA</Badge>
                   <Badge variant="error" className="px-3 font-bold">Pending: 450K CFA</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Card className="p-4 flex items-center justify-between group border-l-4 border-l-emerald-500">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center text-emerald-600">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Facture #FAC-2026-001</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Honoraires - Dossier A12 • 15 May 2026</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900 dark:text-white">850,000 CFA</p>
                    <Badge variant="success" className="mt-1 text-[9px]">SOLDE PAYÉ</Badge>
                  </div>
                </Card>

                <Card className="p-4 flex items-center justify-between group border-l-4 border-l-rose-500 bg-rose-500/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-lg flex items-center justify-center text-rose-600">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Facture #FAC-2026-042</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Provision Frais de Greffe • 02 June 2026</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900 dark:text-white">450,000 CFA</p>
                    <Badge variant="error" className="mt-1 text-[9px]">EN ATTENTE</Badge>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetailView;

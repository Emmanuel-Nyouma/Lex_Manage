import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Filter, 
  ChevronRight,
  Loader2,
  Calendar,
  User,
  Gavel,
  Briefcase,
  Search,
  X
} from 'lucide-react';
import { Button, Badge, Input, Skeleton, Card } from './ui';
import NewCaseDialog from './NewCaseDialog';
import CaseDrawer from './CaseDrawer';
import { useCases } from '../hooks/useCases';
import useLexStore from '../store/useLexStore';
const CaseManagementView = () => {
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useCases(page, 10);
  const cases = data?.data || [];
  const meta = data?.meta;
  const { callGemini } = useLexStore();

  // ... (rest of the component)

  // Optimized client-side filtering
  const filteredCases = useMemo(() => {
    if (!cases) return [];
    if (!searchQuery.trim()) return cases;
    
    const query = searchQuery.toLowerCase().trim();
    return cases.filter(c => 
      c.title?.toLowerCase().includes(query) ||
      c.clientName?.toLowerCase().includes(query) ||
      c.courtName?.toLowerCase().includes(query) ||
      c.assignee?.firstName?.toLowerCase().includes(query) ||
      c.assignee?.lastName?.toLowerCase().includes(query)
    );
  }, [cases, searchQuery]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
           <Skeleton className="h-10 w-64" />
           <Skeleton className="h-10 w-40" />
        </div>
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800"><Skeleton className="h-8 w-full" /></div>
          <div className="p-6 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </Card>
      </div>
    );
  }

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
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center animate-in fade-in">
        <span className="text-red-700 font-medium">Error loading cases: {errorMessage}</span>
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Case Management</h1>
          <p className="text-slate-600 dark:text-slate-300 dark:text-slate-400 font-medium">Manage all your ongoing legal proceedings.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-80 group">
            <Input 
              placeholder="Search cases, clients, courts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm pr-10"
            />
            {searchQuery && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isLoading ? (
                    <Loader2 size={14} className="animate-spin text-amber-500" />
                ) : (
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                )}
                <button 
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-500 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
          <Button onClick={() => setIsNewCaseOpen(true)} icon={Plus} className="w-full sm:w-auto shadow-lg shadow-amber-500/20 bg-slate-900 dark:bg-amber-600">
            New Case
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden backdrop-blur-xl">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <Badge variant="info" className="px-3 py-1 font-bold">
              {searchQuery ? `Search results (${filteredCases.length})` : `Total (${cases?.length || 0})`}
            </Badge>
            {searchQuery && filteredCases.length === 0 && (
              <span className="text-xs text-red-500 font-medium animate-pulse">No matches found</span>
            )}
          </div>
          <Button variant="secondary" size="sm" icon={Filter} className="text-xs font-bold uppercase tracking-wider">Filter</Button>
        </div>

        {/* VUE TABLEAU (Desktop >= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-300 dark:text-slate-400 text-[10px] uppercase tracking-widest font-black">
                <th className="px-6 py-4">Case File</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Responsible</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredCases.map((c) => (
                <tr 
                  key={c.id} 
                  onClick={() => setSelectedCase(c)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all group cursor-pointer"
                >
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">{c.title}</div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-bold uppercase tracking-tight mt-1">
                       <Gavel size={10} className="text-amber-600" /> {c.courtName || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-700 dark:text-slate-300">{c.clientName}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2.5">
                       <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black border border-slate-200 dark:border-slate-700">
                         {c.assignee?.firstName?.[0] || '?'}{c.assignee?.lastName?.[0] || ''}
                       </div>
                       <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">{c.assignee?.firstName || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant={c.status === 'OPEN' ? 'warning' : 'info'}>{c.status}</Badge>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 text-slate-300 group-hover:text-amber-500 transition-all group-hover:translate-x-1">
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* VUE CARTES (Mobile < md) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800" role="list">
          {filteredCases.map((c) => (
            <div 
              key={c.id} 
              onClick={() => setSelectedCase(c)}
              className="p-5 space-y-4 active:bg-slate-50 dark:active:bg-slate-800 transition-colors cursor-pointer"
              role="listitem"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{c.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest">
                    <Gavel size={12} className="text-amber-600" aria-hidden="true" /> {c.courtName || 'N/A'}
                  </div>
                </div>
                <Badge variant={c.status === 'OPEN' ? 'warning' : 'info'}>{c.status}</Badge>
              </div>
              
              <div className="flex items-center justify-between text-xs pt-2">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
                  <User size={14} className="text-slate-500 dark:text-slate-300" aria-hidden="true" /> {c.clientName}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedCase(c); }}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:text-amber-600 transition-colors"
                    aria-label={`View details for ${c.title}`}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCases.length === 0 && (
          <div className="px-6 py-24 text-center space-y-5 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto text-slate-300 border border-slate-100 dark:border-slate-800 shadow-inner">
               <Search size={36} />
            </div>
            <div className="max-w-xs mx-auto">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No cases found</h3>
              <p className="text-slate-600 dark:text-slate-300 dark:text-slate-400 text-sm mt-1">
                {searchQuery 
                  ? `We couldn't find any matches for "${searchQuery}". Try a different term.`
                  : "You haven't added any cases yet. Get started by creating your first one."}
              </p>
            </div>
            <Button 
              onClick={() => searchQuery ? setSearchQuery('') : setIsNewCaseOpen(true)} 
              variant="secondary" 
              size="sm"
              className="font-bold uppercase tracking-wider text-[10px]"
            >
              {searchQuery ? "Clear Search" : "Create first case"}
            </Button>
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 gap-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 order-2 sm:order-1">
              <Button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="secondary"
                size="sm"
                className="px-3 py-1 text-xs font-bold"
              >
                Prev
              </Button>
              
              <div className="flex items-center gap-1">
                {[...Array(meta.totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  // Show current page, first, last, and pages around current
                  if (
                    pageNum === 1 || 
                    pageNum === meta.totalPages || 
                    (pageNum >= page - 1 && pageNum <= page + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${
                          page === pageNum 
                            ? 'bg-slate-900 dark:bg-amber-600 text-white shadow-md' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (pageNum === page - 2 || pageNum === page + 2) {
                    return <span key={pageNum} className="text-slate-400">...</span>;
                  }
                  return null;
                })}
              </div>

              <Button 
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                variant="secondary"
                size="sm"
                className="px-3 py-1 text-xs font-bold"
              >
                Next
              </Button>
            </div>
            
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 order-1 sm:order-2">
              Showing <span className="text-slate-900 dark:text-white">{Math.min(meta.total, (page - 1) * 10 + 1)}-{Math.min(meta.total, page * 10)}</span> of <span className="text-slate-900 dark:text-white">{meta.total}</span> cases
            </div>
          </div>
        )}
      </div>

      <NewCaseDialog isOpen={isNewCaseOpen} onClose={() => setIsNewCaseOpen(false)} />
      
      <CaseDrawer 
        activeCase={selectedCase} 
        onClose={() => setSelectedCase(null)} 
        onCallGemini={callGemini}
      />
    </div>
  );
};

export default CaseManagementView;



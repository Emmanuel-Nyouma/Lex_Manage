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
  X,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  RefreshCcw
} from 'lucide-react';
import { Button, Badge, Input, Skeleton, Card } from './ui';
import NewCaseDialog from './NewCaseDialog';
import CaseDrawer from './CaseDrawer';
import { useCases } from '../hooks/useCases';
import useLexStore from '../store/useLexStore';

const SortIcon = ({ column, sortConfig }) => {
  if (sortConfig.key !== column) return null;
  return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />;
};

const CaseManagementView = () => {
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'title', direction: 'asc' });

  const { data, isLoading, error, refetch } = useCases(page, 10);
  const cases = useMemo(() => data?.data || [], [data]);
  const meta = data?.meta;
  const { callGemini } = useLexStore();

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Optimized client-side filtering & sorting
  const filteredCases = useMemo(() => {
    if (!cases) return [];
    
    let result = cases;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = cases.filter(c => 
        c.title?.toLowerCase().includes(query) ||
        c.clientName?.toLowerCase().includes(query) ||
        c.courtName?.toLowerCase().includes(query) ||
        c.assignee?.firstName?.toLowerCase().includes(query) ||
        c.assignee?.lastName?.toLowerCase().includes(query)
      );
    }

    // Client-side sorting
    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'assignee') {
          aVal = (a.assignee?.firstName || '') + (a.assignee?.lastName || '');
          bVal = (b.assignee?.firstName || '') + (b.assignee?.lastName || '');
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [cases, searchQuery, sortConfig]);

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
      <div className="p-5 bg-white dark:bg-slate-900 border-l-4 border-red-500 rounded-2xl shadow-sm flex items-start gap-4 animate-in fade-in duration-300">
        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-500">
          <AlertCircle size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 dark:text-white">Error Loading Data</h3>
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Case Management</h1>
          <p className="text-slate-600 dark:text-slate-300 dark:text-slate-400 font-medium">Manage all your ongoing legal proceedings.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64 lg:w-80 group">
            <Input 
              placeholder="Search cases, clients..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm pr-14"
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
                  aria-label="Clear search"
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
        <div className="hidden md:block overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-sm">
              <tr className="text-slate-600 dark:text-slate-300 dark:text-slate-400 text-[10px] uppercase tracking-widest font-black border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4">
                  <button onClick={() => handleSort('title')} className="flex items-center hover:text-amber-500 transition-colors uppercase tracking-widest">
                    Case File <SortIcon column="title" sortConfig={sortConfig} />
                  </button>
                </th>
                <th className="px-6 py-4">
                  <button onClick={() => handleSort('clientName')} className="flex items-center hover:text-amber-500 transition-colors uppercase tracking-widest">
                    Client <SortIcon column="clientName" sortConfig={sortConfig} />
                  </button>
                </th>
                <th className="px-6 py-4">
                  <button onClick={() => handleSort('assignee')} className="flex items-center hover:text-amber-500 transition-colors uppercase tracking-widest">
                    Responsible <SortIcon column="assignee" sortConfig={sortConfig} />
                  </button>
                </th>
                <th className="px-6 py-4">
                  <button onClick={() => handleSort('status')} className="flex items-center hover:text-amber-500 transition-colors uppercase tracking-widest">
                    Status <SortIcon column="status" sortConfig={sortConfig} />
                  </button>
                </th>
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
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">{c.title}</div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-bold uppercase tracking-tight mt-1">
                       <Gavel size={10} className="text-amber-600" /> {c.courtName || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <div className="flex flex-col">
                      <span>{c.client?.name || c.clientName}</span>
                      {c.client && <span className="text-[10px] text-amber-600 font-black uppercase tracking-tighter">CRM Linked</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                       <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black border border-slate-200 dark:border-slate-700">
                         {c.assignee?.firstName?.[0] || '?'}{c.assignee?.lastName?.[0] || ''}
                       </div>
                       <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">{c.assignee?.firstName || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={c.status === 'OPEN' ? 'warning' : 'info'}>{c.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
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
              className="p-5 space-y-4 active:bg-slate-50 dark:active:bg-slate-800 transition-colors cursor-pointer group"
              role="listitem"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1 min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white leading-tight break-words group-hover:text-amber-600 transition-colors">{c.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest">
                    <Gavel size={12} className="text-amber-600 flex-shrink-0" aria-hidden="true" /> 
                    <span className="truncate">{c.courtName || 'N/A'}</span>
                  </div>
                </div>
                <Badge variant={c.status === 'OPEN' ? 'warning' : 'info'} className="flex-shrink-0 shadow-sm">{c.status}</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50 dark:border-slate-800/50">
                <div className="space-y-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Client</p>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-bold truncate">
                    <User size={14} className="text-slate-500 dark:text-slate-300 flex-shrink-0" aria-hidden="true" /> 
                    <span className="truncate">{c.clientName}</span>
                  </div>
                </div>
                <div className="space-y-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Responsible</p>
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-bold truncate">
                    <div className="w-5 h-5 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-black border border-slate-200 dark:border-slate-700 flex-shrink-0">
                       {c.assignee?.firstName?.[0] || '?'}{c.assignee?.lastName?.[0] || ''}
                    </div>
                    <span className="truncate">{c.assignee?.firstName || 'Unassigned'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2">
                <div className="text-[10px] font-medium text-slate-400 italic">
                  Tap to view full record
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedCase(c); }}
                    className="p-2 -mr-2 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all"
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
          <div 
            className="flex flex-col sm:flex-row items-center justify-between p-4 gap-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800"
            aria-live="polite"
            aria-label="Pagination"
          >
            <div className="flex flex-wrap items-center justify-center gap-2 order-2 sm:order-1">
              <Button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="secondary"
                size="sm"
                className="px-4 py-3 sm:py-1 text-xs font-bold min-w-[3rem]"
                aria-label="Previous page"
              >
                Prev
              </Button>
              
              <div className="flex items-center gap-1">
                {[...Array(meta.totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  if (
                    pageNum === 1 || 
                    pageNum === meta.totalPages || 
                    (pageNum >= page - 1 && pageNum <= page + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-12 h-12 sm:w-10 sm:h-10 rounded-lg text-xs font-black transition-all ${
                          page === pageNum 
                            ? 'bg-slate-900 dark:bg-amber-600 text-white shadow-md' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                        aria-current={page === pageNum ? 'page' : undefined}
                        aria-label={`Go to page ${pageNum}`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (pageNum === page - 2 || pageNum === page + 2) {
                    return <span key={pageNum} className="text-slate-400 px-2" aria-hidden="true">...</span>;
                  }
                  return null;
                })}
              </div>

              <Button 
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                variant="secondary"
                size="sm"
                className="px-4 py-3 sm:py-1 text-xs font-bold min-w-[3rem]"
                aria-label="Next page"
              >
                Next
              </Button>

              <div className="flex items-center gap-2 ml-2 border-l border-slate-200 dark:border-slate-700 pl-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Jump to:</span>
                <input
                  type="number"
                  min="1"
                  max={meta.totalPages}
                  className="w-16 h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center text-xs font-bold"
                  placeholder={page}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = parseInt(e.target.value);
                      if (val >= 1 && val <= meta.totalPages) setPage(val);
                    }
                  }}
                  aria-label="Jump to page number"
                />
              </div>
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

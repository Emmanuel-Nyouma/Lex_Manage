import React, { useState } from 'react';
import { Menu, LayoutDashboard, Search, Filter, Plus, ChevronDown, MoreHorizontal, AlertCircle } from 'lucide-react';
import { Card, Badge } from './UI';
import NewCaseDialog from './NewCaseDialog';

const CaseManagementView = ({ cases, setCases, setActiveCase }) => {
  const [viewMode, setViewMode] = useState('list');
  const [isAddingCase, setIsAddingCase] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'type'

  const handleAddCase = (newCase) => {
    setCases([newCase, ...cases]);
    setIsAddingCase(false);
  };

  const sortedCases = [...cases].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.deadline) - new Date(a.deadline);
    if (sortBy === 'oldest') return new Date(a.deadline) - new Date(b.deadline);
    if (sortBy === 'type') return a.type.localeCompare(b.type);
    return 0;
  });
  
  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Case Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage client matters, deadlines, and pleadings.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
           <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-slate-900 dark:bg-slate-700 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
           >
             <div className="flex items-center gap-2"><Menu size={16} /> List</div>
           </button>
           <button 
              onClick={() => setViewMode('board')}
              className={`p-2 rounded-md text-sm font-medium transition-all ${viewMode === 'board' ? 'bg-slate-900 dark:bg-slate-700 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
           >
             <div className="flex items-center gap-2"><LayoutDashboard size={16} /> Board</div>
           </button>
        </div>
      </div>

      <NewCaseDialog 
        isOpen={isAddingCase} 
        onClose={() => setIsAddingCase(false)} 
        onSubmit={handleAddCase} 
      />

      {viewMode === 'list' && (
         <Card className="flex-1 overflow-hidden flex flex-col dark:bg-slate-800 dark:border-slate-700">
           <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-3 items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search cases..." 
                  className="pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white dark:bg-slate-800 dark:text-white w-64"
                />
              </div>
              <div className="flex gap-2 relative">
                 <button 
                   onClick={() => setIsFilterOpen(!isFilterOpen)}
                   className={`flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm transition-colors ${isFilterOpen ? 'text-amber-600 border-amber-200 bg-amber-50' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
                 >
                   <Filter size={14} /> Sort & Filter
                 </button>

                 {isFilterOpen && (
                   <>
                     <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
                     <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort By</div>
                        <button 
                          onClick={() => { setSortBy('newest'); setIsFilterOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${sortBy === 'newest' ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                        >
                          Date (Newest First) {sortBy === 'newest' && <Check size={14} />}
                        </button>
                        <button 
                          onClick={() => { setSortBy('oldest'); setIsFilterOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${sortBy === 'oldest' ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                        >
                          Date (Oldest First) {sortBy === 'oldest' && <Check size={14} />}
                        </button>
                        <button 
                          onClick={() => { setSortBy('type'); setIsFilterOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${sortBy === 'type' ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                        >
                          Case Type (A-Z) {sortBy === 'type' && <Check size={14} />}
                        </button>
                     </div>
                   </>
                 )}

                 <button 
                   onClick={() => setIsAddingCase(true)}
                   className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded text-sm hover:bg-amber-700 shadow-sm transition-colors"
                  >
                   <Plus size={14} /> New Case
                 </button>
              </div>
           </div>
           <div className="overflow-auto flex-1">
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 sticky top-0 z-10">
                 <tr>
                   <th className="px-6 py-3 font-medium border-b dark:border-slate-700">Case Reference</th>
                   <th className="px-6 py-3 font-medium border-b dark:border-slate-700">Type</th>
                   <th className="px-6 py-3 font-medium border-b dark:border-slate-700">Assigned</th>
                   <th className="px-6 py-3 font-medium border-b dark:border-slate-700">Value</th>
                   <th className="px-6 py-3 font-medium border-b dark:border-slate-700">Next Action</th>
                   <th className="px-6 py-3 font-medium border-b dark:border-slate-700 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                 {sortedCases.map(c => (
                   <tr key={c.id} onClick={() => setActiveCase(c)} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer group">
                     <td className="px-6 py-4">
                       <div className="font-semibold text-slate-900 dark:text-white">{c.name}</div>
                       <div className="text-xs text-slate-500 dark:text-slate-400">{c.client}</div>
                     </td>
                     <td className="px-6 py-4">
                       <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                         {c.type}
                       </span>
                     </td>
                     <td className="px-6 py-4">
                       <div className="flex -space-x-2">
                         {(c.members || []).map((m, i) => (
                           <div key={i} className="w-7 h-7 rounded-full bg-slate-800 dark:bg-slate-600 text-white flex items-center justify-center text-xs border-2 border-white dark:border-slate-800">
                             {m}
                           </div>
                         ))}
                       </div>
                     </td>
                     <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{c.amount}</td>
                     <td className="px-6 py-4">
                        <div className={`text-xs font-medium ${new Date(c.deadline) < new Date('2023-11-01') ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          Due {c.deadline}
                        </div>
                     </td>
                     <td className="px-6 py-4 text-right">
                       <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                         <MoreHorizontal size={18} />
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </Card>
      )}

      {viewMode === 'board' && (
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 h-full min-w-[1000px]">
            {['Active', 'Pending', 'In Court', 'Closed'].map((status) => (
              <div key={status} className="flex-1 flex flex-col bg-slate-100/50 dark:bg-slate-900/50 rounded-lg p-2 border border-slate-200/60 dark:border-slate-700">
                <div className="flex items-center justify-between p-3 mb-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{status}</span>
                  <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {sortedCases.filter(c => c.status === status).length}
                  </span>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto px-1">
                  {sortedCases.filter(c => c.status === status).map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => setActiveCase(c)}
                      className="bg-white dark:bg-slate-800 p-3 rounded shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md hover:border-amber-300 dark:hover:border-amber-500 transition-all"
                    >
                       <div className="flex justify-between items-start mb-2">
                          <Badge variant="default">{c.type}</Badge>
                          {new Date(c.deadline) < new Date('2023-11-01') && <AlertCircle size={14} className="text-red-500 dark:text-red-400"/>}
                       </div>
                       <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">{c.name}</h4>
                       <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{c.client}</p>
                       <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-700">
                          <span className="text-xs text-slate-400 dark:text-slate-500">{c.amount}</span>
                          <div className="w-6 h-6 rounded-full bg-slate-800 dark:bg-slate-600 text-white flex items-center justify-center text-[10px]">
                             {(c.members || [])[0] || '?'}
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseManagementView;

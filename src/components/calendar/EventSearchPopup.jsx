import React, { useMemo } from 'react';
import { AlertCircle, Calendar as CalendarIcon, CheckCircle2, ChevronRight, Clock, Search, X } from 'lucide-react';
import { formatEventDate, searchCalendarEvents } from './calendarUtils';

const EventSearchPopup = ({ query, onQueryChange, isOpen, onOpenChange, events, onSelect }) => {
  const results = useMemo(() => searchCalendarEvents(events, query), [events, query]);

  return (
    <div className="relative group">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors z-10" size={16} />
      <input
        type="search"
        aria-label="Rechercher un événement"
        placeholder="Rechercher événement..."
        value={query}
        onChange={(event) => { onQueryChange(event.target.value); onOpenChange(true); }}
        onFocus={() => { if (query.trim()) onOpenChange(true); }}
        className="pl-9 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/20 w-full sm:w-56 relative"
      />
      {query && (
        <button type="button" onClick={() => { onQueryChange(''); onOpenChange(false); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-10" aria-label="Effacer la recherche">
          <X size={14} />
        </button>
      )}

      {isOpen && query.trim() && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => onOpenChange(false)} aria-hidden="true" />
          <div role="listbox" aria-label="Résultats de recherche" className="absolute left-0 right-0 sm:w-80 mt-2 z-[60] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Résultats</span>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{results.length} trouvé{results.length > 1 ? 's' : ''}</span>
            </div>
            <div className="max-h-72 overflow-y-auto custom-scrollbar">
              {results.length > 0 ? results.map((event) => (
                <button key={event.id} role="option" aria-selected="false" onClick={() => onSelect(event)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${event.isDone ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20' : event.priority === 'URGENT' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/20' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/20'}`}>
                    {event.isDone ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{event.title}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5"><CalendarIcon size={10} /> {formatEventDate(event.dueAt)}{event.case?.title && <span className="truncate"> · {event.case.title}</span>}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
                </button>
              )) : (
                <div className="px-4 py-8 text-center text-slate-400"><AlertCircle size={28} className="mx-auto mb-2 opacity-30" /><p className="text-xs font-bold">Aucun événement trouvé</p></div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EventSearchPopup;

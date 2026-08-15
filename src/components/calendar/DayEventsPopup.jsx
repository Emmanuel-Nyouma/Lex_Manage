import React from 'react';
import { AlertCircle, CheckCircle2, Clock, FileText, Trash2, X } from 'lucide-react';
import { Badge, FocusTrap } from '../ui';
import { DAYS_FULL, MONTHS } from './calendarUtils';

const DayEventsPopup = ({ selection, year, month, isAdmin, onClose, onRequestDelete }) => {
  if (!selection) return null;
  const weekday = DAYS_FULL[new Date(year, month, selection.day).getDay()];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <FocusTrap isActive onClose={onClose}>
        <div role="dialog" aria-modal="true" aria-labelledby="day-details-title" className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative z-10 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[80vh]">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-900 flex items-center justify-center font-black">{selection.day}</div>
              <div><h3 id="day-details-title" className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{weekday}</h3><p className="text-[10px] font-bold text-slate-500">{MONTHS[month]} {year}</p></div>
            </div>
            <button type="button" onClick={onClose} aria-label="Fermer" title="Fermer" className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {selection.events.length > 0 ? selection.events.map((event) => (
              <div key={event.id} className="group bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:border-amber-500 transition-all">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${event.isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{event.isDone ? <CheckCircle2 size={20} /> : <Clock size={20} />}</div>
                  <div className="min-w-0"><p className="font-black text-sm text-slate-900 dark:text-white truncate">{event.title}</p><p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1 font-bold"><FileText size={12} /> {event.case?.title || 'Dossier non associé'}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={event.isDone ? 'success' : event.priority === 'URGENT' ? 'error' : 'warning'} className="text-[8px]">{event.priority}</Badge>
                  {isAdmin && <button type="button" onClick={(clickEvent) => { clickEvent.stopPropagation(); onRequestDelete(event); }} aria-label={`Supprimer ${event.title}`} title="Supprimer" className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"><Trash2 size={16} /></button>}
                </div>
              </div>
            )) : (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400"><AlertCircle size={40} className="mb-4 opacity-20" /><p className="font-bold text-sm">Aucun événement assigné à cette date</p></div>
            )}
          </div>
        </div>
      </FocusTrap>
    </div>
  );
};

export default DayEventsPopup;

import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  FileText,
  CheckCircle2,
  List,
  Plus,
  Search,
  Trash2,
  X,
  AlertCircle
} from 'lucide-react';
import { Card, Badge, Button, Input } from './ui';
import { useGlobalDeadlines } from '../hooks/useCalendar';
import { useDeleteDeadline } from '../hooks/useCases';
import NewEventDialog from './NewEventDialog';
import useLexStore from '../store/useLexStore';
import ConfirmDialog from './ConfirmDialog';

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const DAYS_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const fmtEventDate = (iso) => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const CalendarView = () => {
  const { currentUser } = useLexStore();
  const [viewDate, setViewDate] = useState(new Date());
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);

  const { data: deadlines, isLoading, refetch } = useGlobalDeadlines();
  const deleteDeadline = useDeleteDeadline();

  const isAdmin = currentUser?.role === 'CABINET_ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const prevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const today = new Date();
  const isToday = (day) => {
    return day === today.getDate() && 
           currentMonth === today.getMonth() && 
           currentYear === today.getFullYear();
  };

  // Text search results — drives the "jump to event" popup (does not filter the grid)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !deadlines) return [];
    const q = searchQuery.toLowerCase();
    return deadlines
      .filter(d => d.title.toLowerCase().includes(q) ||
                   (d.case?.title || '').toLowerCase().includes(q))
      .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
  }, [deadlines, searchQuery]);

  // Grid always shows every event so it stays a stable navigation target
  const getDeadlinesForDay = (day) => {
    if (!deadlines) return [];
    return deadlines.filter(d => {
      const date = new Date(d.dueAt);
      return date.getDate() === day &&
             date.getMonth() === currentMonth &&
             date.getFullYear() === currentYear;
    });
  };

  const eventsOnDate = (year, month, day) => {
    if (!deadlines) return [];
    return deadlines.filter(d => {
      const date = new Date(d.dueAt);
      return date.getDate() === day &&
             date.getMonth() === month &&
             date.getFullYear() === year;
    });
  };

  // Jump from a text-search result to its place on the calendar
  const goToEvent = (deadline) => {
    const date = new Date(deadline.dueAt);
    setViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
    setSelectedDayEvents({
      day: date.getDate(),
      events: eventsOnDate(date.getFullYear(), date.getMonth(), date.getDate()),
    });
    setShowSearchPopup(false);
    setSearchQuery('');
  };

  // "Search" next to the date picker → popup with that date's events
  const handleDateSearch = () => {
    if (!searchDate) return;
    const date = new Date(`${searchDate}T00:00:00`);
    setViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
    setSelectedDayEvents({
      day: date.getDate(),
      events: eventsOnDate(date.getFullYear(), date.getMonth(), date.getDate()),
    });
  };

  // Mobile agenda: events of the current month, grouped by day, sorted
  const agendaGroups = useMemo(() => {
    if (!deadlines) return [];
    const inMonth = deadlines
      .filter(d => {
        const dt = new Date(d.dueAt);
        return dt.getMonth() === currentMonth && dt.getFullYear() === currentYear;
      })
      .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));

    const map = new Map();
    for (const e of inMonth) {
      const day = new Date(e.dueAt).getDate();
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(e);
    }
    return Array.from(map.entries()).map(([day, events]) => ({ day, events }));
  }, [deadlines, currentMonth, currentYear]);

  const handleDeleteEvent = async () => {
    if (eventToDelete) {
      await deleteDeadline.mutateAsync(eventToDelete.id);
      setEventToDelete(null);
      refetch();
      // If we are viewing events for a day, update the local list
      if (selectedDayEvents) {
        setSelectedDayEvents(prev => ({
          ...prev,
          events: prev.events.filter(e => e.id !== eventToDelete.id)
        }));
      }
    }
  };

  const openDayDetails = (day, events) => {
    setSelectedDayEvents({ day, events });
  };

  const renderDays = () => {
    const cells = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className="h-24 sm:h-32 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/50" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayDeadlines = getDeadlinesForDay(day);
      const isTodayCell = isToday(day);

      cells.push(
        <div 
          key={day} 
          onClick={() => openDayDetails(day, dayDeadlines)}
          className={`h-24 sm:h-32 border border-slate-100 dark:border-slate-800 p-1 sm:p-2 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col gap-1 overflow-hidden ${isTodayCell ? 'bg-amber-50/30 dark:bg-amber-900/10 ring-1 ring-inset ring-amber-500/20' : 'bg-white dark:bg-slate-900'}`}
        >
          <div className="flex justify-between items-center mb-0.5 sm:mb-1">
            <span className={`text-xs sm:text-sm font-bold ${isTodayCell ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
              {day}
            </span>
            {dayDeadlines.length > 0 && (
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] sm:text-[10px] font-bold text-slate-600 dark:text-slate-300">
                {dayDeadlines.length}
              </span>
            )}
          </div>
          
          <div className="flex flex-col gap-0.5 sm:gap-1 overflow-hidden flex-1">
            {dayDeadlines.slice(0, 3).map((d) => (
              <div 
                key={d.id}
                className={`text-[8px] sm:text-[10px] px-1 sm:px-2 py-0.5 sm:py-1 rounded border shadow-sm flex flex-col gap-0.5 ${
                  d.isDone 
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400' 
                    : d.priority === 'URGENT'
                      ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/30 text-rose-700 dark:text-rose-400'
                      : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30 text-amber-700 dark:text-amber-400'
                }`}
              >
                <div className="font-bold truncate flex items-center gap-1">
                  {d.title}
                </div>
              </div>
            ))}
            {dayDeadlines.length > 3 && (
              <div className="text-[7px] sm:text-[9px] text-slate-400 font-bold text-center">
                + {dayDeadlines.length - 3} de plus
              </div>
            )}
          </div>
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 animate-in fade-in duration-500 bg-slate-50/50 dark:bg-slate-900/50 pb-20">
      
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center text-amber-500">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Calendrier</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Gérez toutes les échéances juridiques.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search Bars */}
          <div className="flex flex-col sm:flex-row gap-2 flex-1 sm:flex-none">
             {/* Text search with live results popup */}
             <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors z-10" size={16} />
                <input
                  type="text"
                  placeholder="Rechercher événement..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSearchPopup(true); }}
                  onFocus={() => { if (searchQuery.trim()) setShowSearchPopup(true); }}
                  className="pl-9 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/20 w-full sm:w-56 relative"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); setShowSearchPopup(false); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-10"
                    aria-label="Effacer la recherche"
                  >
                    <X size={14} />
                  </button>
                )}

                {/* Results dropdown */}
                {showSearchPopup && searchQuery.trim() && (
                  <>
                    {/* click-outside backdrop */}
                    <div className="fixed inset-0 z-[55]" onClick={() => setShowSearchPopup(false)} aria-hidden="true" />
                    <div className="absolute left-0 right-0 sm:w-80 mt-2 z-[60] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          Résultats
                        </span>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          {searchResults.length} trouvé{searchResults.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="max-h-72 overflow-y-auto custom-scrollbar">
                        {searchResults.length > 0 ? searchResults.map((d) => (
                          <button
                            key={d.id}
                            onClick={() => goToEvent(d)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                          >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              d.isDone ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20'
                              : d.priority === 'URGENT' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/20'
                              : 'bg-amber-100 text-amber-600 dark:bg-amber-900/20'
                            }`}>
                              {d.isDone ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{d.title}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                <CalendarIcon size={10} /> {fmtEventDate(d.dueAt)}
                                {d.case?.title && <span className="truncate"> · {d.case.title}</span>}
                              </p>
                            </div>
                            <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
                          </button>
                        )) : (
                          <div className="px-4 py-8 text-center text-slate-400">
                            <AlertCircle size={28} className="mx-auto mb-2 opacity-30" />
                            <p className="text-xs font-bold">Aucun événement trouvé</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
             </div>

             {/* Date picker + Search button */}
             <div className="flex gap-2">
                <div className="relative group flex-1">
                   <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={16} />
                   <input
                     type="date"
                     value={searchDate}
                     onChange={(e) => setSearchDate(e.target.value)}
                     onKeyDown={(e) => { if (e.key === 'Enter') handleDateSearch(); }}
                     className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/20 w-full"
                   />
                </div>
                {searchDate && (
                  <Button
                    onClick={handleDateSearch}
                    className="bg-slate-900 text-white dark:bg-amber-600 rounded-xl font-bold text-xs px-4 h-[38px] whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-200"
                    icon={Search}
                  >
                    Rechercher
                  </Button>
                )}
             </div>
          </div>

          <Button 
            onClick={() => setIsEventDialogOpen(true)}
            className="bg-slate-900 text-white dark:bg-amber-600 dark:text-white rounded-xl font-bold text-sm shadow-lg px-6 h-10"
            icon={Plus}
          >
            Ajouter
          </Button>

          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex-1 sm:flex-none justify-between sm:justify-start">
            <Button variant="ghost" size="sm" onClick={prevMonth} className="h-8 w-8 p-0"><ChevronLeft size={16} /></Button>
            <div className="px-2 min-w-[140px] text-center"><span className="text-xs font-bold text-slate-900 dark:text-white">{MONTHS[currentMonth]} {currentYear}</span></div>
            <Button variant="ghost" size="sm" onClick={nextMonth} className="h-8 w-8 p-0"><ChevronRight size={16} /></Button>
          </div>
        </div>
      </div>

      {/* Desktop / tablet: month grid (≥ md) */}
      <Card className="hidden md:flex flex-1 overflow-hidden border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 rounded-2xl flex-col min-h-0">
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {DAYS.map(day => (
            <div key={day} className="py-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 overflow-y-auto custom-scrollbar">
          {isLoading ? Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-24 sm:h-32 border border-slate-50 dark:border-slate-800/50 p-2 animate-pulse" />
          )) : renderDays()}
        </div>
      </Card>

      {/* Mobile: agenda list (< md) */}
      <div className="md:hidden flex-1 min-h-0 overflow-y-auto custom-scrollbar -mx-1">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        ) : agendaGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <CalendarIcon size={40} className="mb-3 opacity-20" />
            <p className="font-bold text-sm">Aucune échéance en {MONTHS[currentMonth]}</p>
            <p className="text-xs text-slate-400 mt-1">Touchez « Ajouter » pour créer un événement.</p>
          </div>
        ) : (
          <div className="space-y-5 pb-4">
            {agendaGroups.map(({ day, events }) => {
              const weekday = DAYS_FULL[new Date(currentYear, currentMonth, day).getDay()];
              const isTodayGroup = isToday(day);
              return (
                <div key={day}>
                  {/* Day header */}
                  <div className="flex items-center gap-3 mb-2 px-1">
                    <div className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center font-black shrink-0 ${
                      isTodayGroup ? 'bg-amber-500 text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}>
                      <span className="text-base leading-none">{day}</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white capitalize">{weekday}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {events.length} échéance{events.length > 1 ? 's' : ''}
                        {isTodayGroup && <span className="text-amber-600 dark:text-amber-400"> · Aujourd'hui</span>}
                      </p>
                    </div>
                  </div>

                  {/* Events of the day */}
                  <div className="space-y-2">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => openDayDetails(day, events)}
                        className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          event.isDone ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20'
                          : event.priority === 'URGENT' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/20'
                          : 'bg-amber-100 text-amber-600 dark:bg-amber-900/20'
                        }`}>
                          {event.isDone ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{event.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                            <FileText size={11} className="shrink-0" /> {event.case?.title || 'Dossier non associé'}
                          </p>
                        </div>
                        <Badge variant={event.isDone ? 'success' : event.priority === 'URGENT' ? 'error' : 'warning'} className="text-[8px] shrink-0">
                          {event.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Détails Jour */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedDayEvents(null)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative z-10 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-900 flex items-center justify-center font-black">
                  {selectedDayEvents.day}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {DAYS_FULL[new Date(currentYear, currentMonth, selectedDayEvents.day).getDay()]}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500">{MONTHS[currentMonth]} {currentYear}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDayEvents(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedDayEvents.events.length > 0 ? selectedDayEvents.events.map(event => (
                <div key={event.id} className="group bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:border-amber-500 transition-all">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      event.isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {event.isDone ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-sm text-slate-900 dark:text-white truncate">{event.title}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1 font-bold">
                        <FileText size={12} /> {event.case?.title || 'Dossier non associé'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={event.isDone ? 'success' : event.priority === 'URGENT' ? 'error' : 'warning'} className="text-[8px]">
                      {event.priority}
                    </Badge>
                    {isAdmin && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEventToDelete(event); }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <AlertCircle size={40} className="mb-4 opacity-20" />
                  <p className="font-bold text-sm">Aucun événement assigné à cette date</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <NewEventDialog 
        isOpen={isEventDialogOpen} 
        onClose={() => { setIsEventDialogOpen(false); refetch(); }} 
      />

      <ConfirmDialog 
        isOpen={!!eventToDelete}
        title="Supprimer l'événement"
        description={`Êtes-vous sûr de vouloir supprimer "${eventToDelete?.title}" ? Cette action est irréversible.`}
        onConfirm={handleDeleteEvent}
        onCancel={() => setEventToDelete(null)}
        destructiveText="Supprimer"
      />

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; }
      `}</style>
    </div>
  );
};

export default CalendarView;

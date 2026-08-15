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
  AlertCircle
} from 'lucide-react';
import { Card, Badge, Button } from './ui';
import { useGlobalDeadlines } from '../hooks/useCalendar';
import { useDeleteDeadline } from '../hooks/useCases';
import NewEventDialog from './NewEventDialog';
import useLexStore from '../store/useLexStore';
import ConfirmDialog from './ConfirmDialog';
import { parseLegalDate } from '../utils/dateOnly';
import DayEventsPopup from './calendar/DayEventsPopup';
import EventSearchPopup from './calendar/EventSearchPopup';
import CalendarMonthGrid from './calendar/CalendarMonthGrid';
import { DAYS_FULL, MONTHS, getEventsForDate, groupEventsByMonth } from './calendar/calendarUtils';

const CalendarView = () => {
  const { currentUser } = useLexStore();
  const [viewDate, setViewDate] = useState(new Date());
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);

  const { data: deadlines, isLoading, isError, error, refetch } = useGlobalDeadlines();
  const deleteDeadline = useDeleteDeadline();

  const isAdmin = currentUser?.role === 'CABINET_ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

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

  // Jump from a text-search result to its place on the calendar
  const goToEvent = (deadline) => {
    const date = parseLegalDate(deadline.dueAt);
    setViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
    setSelectedDayEvents({
      day: date.getDate(),
      events: getEventsForDate(deadlines, date.getFullYear(), date.getMonth(), date.getDate()),
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
      events: getEventsForDate(deadlines, date.getFullYear(), date.getMonth(), date.getDate()),
    });
  };

  // Mobile agenda: events of the current month, grouped by day, sorted
  const agendaGroups = useMemo(
    () => groupEventsByMonth(deadlines, currentYear, currentMonth),
    [deadlines, currentMonth, currentYear],
  );

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

  if (isError) {
    return (
      <div role="alert" className="min-h-[50vh] flex items-center justify-center">
        <Card className="max-w-lg p-8 text-center">
          <AlertCircle size={36} className="mx-auto mb-4 text-rose-500" />
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Calendrier indisponible</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {error?.response?.data?.message || "Impossible de charger les échéances pour le moment."}
          </p>
          <Button className="mt-5" onClick={() => refetch()}>Réessayer</Button>
        </Card>
      </div>
    );
  }

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
             <EventSearchPopup
               query={searchQuery}
               onQueryChange={setSearchQuery}
               isOpen={showSearchPopup}
               onOpenChange={setShowSearchPopup}
               events={deadlines ?? []}
               onSelect={goToEvent}
             />
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
            <Button aria-label="Mois précédent" title="Mois précédent" variant="ghost" size="sm" onClick={prevMonth} className="h-8 w-8 p-0"><ChevronLeft size={16} /></Button>
            <div className="px-2 min-w-[140px] text-center"><span className="text-xs font-bold text-slate-900 dark:text-white">{MONTHS[currentMonth]} {currentYear}</span></div>
            <Button aria-label="Mois suivant" title="Mois suivant" variant="ghost" size="sm" onClick={nextMonth} className="h-8 w-8 p-0"><ChevronRight size={16} /></Button>
          </div>
        </div>
      </div>

      <CalendarMonthGrid
        year={currentYear}
        month={currentMonth}
        events={deadlines ?? []}
        isLoading={isLoading}
        isToday={isToday}
        onDaySelect={openDayDetails}
      />
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

      <DayEventsPopup
        selection={selectedDayEvents}
        year={currentYear}
        month={currentMonth}
        isAdmin={isAdmin}
        onClose={() => setSelectedDayEvents(null)}
        onRequestDelete={setEventToDelete}
      />
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

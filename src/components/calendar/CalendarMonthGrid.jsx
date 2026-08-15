import React from 'react';
import { Card } from '../ui';
import { DAYS, getEventsForDate } from './calendarUtils';

const CalendarMonthGrid = ({ year, month, events, isLoading, isToday, onDaySelect }) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const emptyCells = Array.from({ length: firstDayOfMonth }, (_, index) => (
    <div
      key={`empty-${index}`}
      className="h-24 sm:h-32 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/50"
    />
  ));

  const dayCells = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const dayEvents = getEventsForDate(events, year, month, day);
    const today = isToday(day);
    return (
      <button
        type="button"
        key={day}
        onClick={() => onDaySelect(day, dayEvents)}
        aria-label={`${day}, ${dayEvents.length} échéance${dayEvents.length > 1 ? 's' : ''}`}
        className={`h-24 sm:h-32 border border-slate-100 dark:border-slate-800 p-1 sm:p-2 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col gap-1 overflow-hidden text-left ${today ? 'bg-amber-50/30 dark:bg-amber-900/10 ring-1 ring-inset ring-amber-500/20' : 'bg-white dark:bg-slate-900'}`}
      >
        <div className="flex justify-between items-center mb-0.5 sm:mb-1 w-full">
          <span className={`text-xs sm:text-sm font-bold ${today ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>{day}</span>
          {dayEvents.length > 0 && <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] sm:text-[10px] font-bold text-slate-600 dark:text-slate-300">{dayEvents.length}</span>}
        </div>
        <div className="flex flex-col gap-0.5 sm:gap-1 overflow-hidden flex-1 w-full">
          {dayEvents.slice(0, 3).map((event) => (
            <div key={event.id} className={`text-[8px] sm:text-[10px] px-1 sm:px-2 py-0.5 sm:py-1 rounded border shadow-sm flex flex-col gap-0.5 ${event.isDone ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400' : event.priority === 'URGENT' ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/30 text-rose-700 dark:text-rose-400' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30 text-amber-700 dark:text-amber-400'}`}>
              <span className="font-bold truncate">{event.title}</span>
            </div>
          ))}
          {dayEvents.length > 3 && <span className="text-[7px] sm:text-[9px] text-slate-400 font-bold text-center">+ {dayEvents.length - 3} de plus</span>}
        </div>
      </button>
    );
  });
  const cells = [...emptyCells, ...dayCells];

  return (
    <Card className="hidden md:flex flex-1 overflow-hidden border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 rounded-2xl flex-col min-h-0">
      <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        {DAYS.map((day) => <div key={day} className="py-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>)}
      </div>
      <div className="flex-1 grid grid-cols-7 overflow-y-auto custom-scrollbar">
        {isLoading
          ? Array.from({ length: 35 }, (_, index) => <div key={index} className="h-24 sm:h-32 border border-slate-50 dark:border-slate-800/50 p-2 animate-pulse" />)
          : cells}
      </div>
    </Card>
  );
};

export default CalendarMonthGrid;

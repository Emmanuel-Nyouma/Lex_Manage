import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { Card, Badge, Button } from './ui';
import { useGlobalDeadlines } from '../hooks/useCalendar';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CalendarView = () => {
  const [viewDate, setViewDate] = useState(new Date());
  const { data: deadlines, isLoading } = useGlobalDeadlines();

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

  // Map deadlines to days
  const getDeadlinesForDay = (day) => {
    if (!deadlines) return [];
    return deadlines.filter(d => {
      const date = new Date(d.dueAt);
      return date.getDate() === day && 
             date.getMonth() === currentMonth && 
             date.getFullYear() === currentYear;
    });
  };

  const renderDays = () => {
    const cells = [];
    
    // Empty cells for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className="h-32 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800/50" />);
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDeadlines = getDeadlinesForDay(day);
      const isTodayCell = isToday(day);

      cells.push(
        <div 
          key={day} 
          className={`h-32 border border-slate-100 dark:border-slate-800 p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col gap-1 overflow-hidden ${isTodayCell ? 'bg-amber-50/30 dark:bg-amber-900/10 ring-1 ring-inset ring-amber-500/20' : 'bg-white dark:bg-slate-900'}`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className={`text-sm font-bold ${isTodayCell ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
              {day}
            </span>
            {dayDeadlines.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                {dayDeadlines.length}
              </span>
            )}
          </div>
          
          <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar flex-1">
            {dayDeadlines.map((d) => (
              <div 
                key={d.id}
                className={`text-[10px] px-2 py-1 rounded border shadow-sm flex flex-col gap-0.5 ${
                  d.isDone 
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400' 
                    : d.priority === 'URGENT'
                      ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/30 text-rose-700 dark:text-rose-400'
                      : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30 text-amber-700 dark:text-amber-400'
                }`}
              >
                <div className="font-bold truncate flex items-center gap-1">
                  {d.isDone ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                  {d.title}
                </div>
                <div className="opacity-70 truncate italic flex items-center gap-1">
                  <FileText size={8} />
                  {d.case?.title || 'No Case'}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="h-full flex flex-col p-6 animate-in fade-in duration-500 bg-slate-50/50 dark:bg-slate-900/50">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center text-amber-500">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Calendar</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage and track all legal deadlines across cases.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={prevMonth}
            className="h-9 w-9 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <ChevronLeft size={18} />
          </Button>
          
          <div className="px-4 min-w-[160px] text-center">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {MONTHS[currentMonth]} {currentYear}
            </span>
          </div>

          <Button 
            variant="secondary" 
            size="sm" 
            onClick={nextMonth}
            className="h-9 w-9 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <ChevronRight size={18} />
          </Button>
          
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
          
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setViewDate(new Date())}
            className="px-3 py-0 h-9 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Today
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Urgent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Planned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Completed</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="flex-1 overflow-hidden border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 rounded-2xl flex flex-col">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {DAYS.map(day => (
            <div key={day} className="py-3 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="flex-1 grid grid-cols-7 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-32 border border-slate-50 dark:border-slate-800/50 p-4 animate-pulse">
                <div className="w-6 h-4 bg-slate-100 dark:bg-slate-800 rounded mb-4" />
                <div className="w-full h-8 bg-slate-50 dark:bg-slate-800/50 rounded" />
              </div>
            ))
          ) : (
            renderDays()
          )}
        </div>
      </Card>

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
        }
      `}</style>
    </div>
  );
};

export default CalendarView;

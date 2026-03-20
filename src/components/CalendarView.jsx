import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  User,
  Calendar as CalendarIcon,
  Search,
  Filter,
  MoreVertical,
  AlertCircle,
  X,
  Check,
  ChevronDown,
  Trash2,
  Edit2
} from 'lucide-react';

const INITIAL_EVENTS = [
  { id: 1, title: 'Smith v. Jones - Pre-trial', date: '2026-03-05', time: '10:00 AM', type: 'Court', client: 'John Smith', location: 'Superior Court Rm 402' },
  { id: 2, title: 'Sterling Merger Meeting', date: '2026-03-08', time: '02:00 PM', type: 'Meeting', client: 'Sterling Family', location: 'Conference Room B' },
  { id: 3, title: 'Filing Deadline: Peterson Motion', date: '2026-03-12', time: '05:00 PM', type: 'Deadline', client: 'John Peterson', location: 'Online Portal' },
  { id: 4, title: 'Client Consultation: Rivera', date: '2026-03-15', time: '11:30 AM', type: 'Meeting', client: 'Rivera Holdings', location: 'Zoom' },
  { id: 5, title: 'TechCorp v. DataInc Deposition', date: '2026-03-18', time: '09:00 AM', type: 'Court', client: 'TechCorp Global', location: 'Legal Suites NY' },
  { id: 6, title: 'Quarterly Review', date: '2026-03-22', time: '03:00 PM', type: 'Internal', client: 'Firm-wide', location: 'Main Hall' },
];

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // March 2026
  const [viewMode, setViewMode] = useState('month'); // month, week, day
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEvent, setCurrentEvent] = useState({
    title: '',
    date: '',
    time: '',
    type: 'Meeting',
    client: '',
    location: ''
  });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const openNewEventModal = (date = '') => {
    setIsEditing(false);
    setCurrentEvent({
      title: '',
      date: date || '',
      time: '',
      type: 'Meeting',
      client: '',
      location: ''
    });
    setIsModalOpen(true);
  };

  const openEditEventModal = (event) => {
    setIsEditing(true);
    setCurrentEvent(event);
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      setEvents(events.map(ev => ev.id === currentEvent.id ? currentEvent : ev));
    } else {
      setEvents([...events, { ...currentEvent, id: Date.now() }]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      setEvents(events.filter(ev => ev.id !== id));
      setIsModalOpen(false);
    }
  };

  const renderMonthHeader = () => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{months[currentDate.getMonth()]} {currentDate.getFullYear()}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Schedule for the month of {months[currentDate.getMonth()]}.</p>
      </div>
      <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
        <button 
          onClick={() => setViewMode('month')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'month' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
        >
          Month
        </button>
        <button 
          onClick={() => setViewMode('week')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'week' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
        >
          Week
        </button>
        <button 
          onClick={() => setViewMode('day')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'day' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
        >
          Day
        </button>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => setCurrentDate(new Date(2026, 2, 27))} className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50">
            Today
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700">
            <ChevronRight size={18} />
          </button>
        </div>
        <button 
          onClick={() => openNewEventModal()}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 shadow-md transition-all"
        >
          <Plus size={16} /> New Event
        </button>
      </div>
    </div>
  );

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[120px] bg-slate-50/50 dark:bg-slate-900/20 border-b border-r border-slate-200 dark:border-slate-800"></div>);
    }

    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.date === dateStr);
      const isToday = d === 27 && currentDate.getMonth() === 2 && currentDate.getFullYear() === 2026;

      days.push(
        <div key={d} className={`min-h-[120px] p-2 bg-white dark:bg-slate-900/50 border-b border-r border-slate-200 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer`}>
          <div className="flex justify-between items-center mb-1">
            <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-amber-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}>
              {d}
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                openNewEventModal(dateStr);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-opacity"
            >
              <Plus size={12} className="text-slate-500" />
            </button>
          </div>
          <div className="space-y-1">
            {dayEvents.map(event => (
              <div 
                key={event.id} 
                onClick={(e) => {
                  e.stopPropagation();
                  openEditEventModal(event);
                }}
                className={`px-2 py-1 rounded text-[10px] font-medium truncate border-l-2 shadow-sm hover:scale-105 transition-transform ${
                  event.type === 'Court' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-500' :
                  event.type === 'Deadline' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-500' :
                  event.type === 'Meeting' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-500' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-400'
                }`}
                title={event.title}
              >
                {event.time} {event.title}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-slate-900 border-l border-t border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden grid grid-cols-7">
        {daysOfWeek.map(day => (
          <div key={day} className="py-2 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-r border-slate-200 dark:border-slate-800">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      {renderMonthHeader()}
      
      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Main Calendar Grid */}
        <div className="flex-1 overflow-y-auto pr-2">
          {renderCalendar()}
        </div>

        {/* Sidebar - Upcoming & Reminders */}
        <div className="w-80 hidden lg:flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-600" /> Upcoming Deadlines
            </h3>
            <div className="space-y-4">
              {events
                .filter(e => e.type === 'Deadline' && new Date(e.date) >= new Date().setHours(0,0,0,0))
                .sort((a,b) => new Date(a.date) - new Date(b.date))
                .slice(0, 3)
                .map(e => (
                <div 
                  key={e.id} 
                  onClick={() => openEditEventModal(e)}
                  className="p-3 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg cursor-pointer hover:bg-red-100/50 transition-colors"
                >
                  <div className="text-xs font-bold text-red-600 dark:text-red-400 uppercase mb-1">Due {e.date}</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{e.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <User size={10} /> {e.client}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-lg shadow-lg text-white">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm">
              <Clock size={16} className="text-amber-50" /> Next Appointment
            </h3>
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <div className="text-2xl font-bold mb-1">10:00 AM</div>
              <div className="text-sm text-amber-100 font-medium mb-3">Today, March 27</div>
              <div className="h-px bg-slate-700 w-full mb-3"></div>
              <div className="font-semibold text-sm mb-1">Internal Strategy Meeting</div>
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin size={10} /> Main Office - Rm 4
              </div>
            </div>
            <button className="w-full mt-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-md text-xs font-bold transition-colors">
              Join Zoom Call
            </button>
          </div>
        </div>
      </div>

      {/* Event Modal (New/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  {isEditing ? <Edit2 size={18} /> : <CalendarIcon size={18} />}
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isEditing ? 'Edit Calendar Event' : 'New Calendar Event'}
                </h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Event Title</label>
                <input 
                  type="text" required
                  value={currentEvent.title}
                  onChange={(e) => setCurrentEvent({...currentEvent, title: e.target.value})}
                  placeholder="e.g. Client Meeting: Smith"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Date</label>
                  <input 
                    type="date" required
                    value={currentEvent.date}
                    onChange={(e) => setCurrentEvent({...currentEvent, date: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Time</label>
                  <input 
                    type="text" required
                    value={currentEvent.time}
                    onChange={(e) => setCurrentEvent({...currentEvent, time: e.target.value})}
                    placeholder="e.g. 10:00 AM"
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Event Type</label>
                <div className="relative">
                  <select 
                    value={currentEvent.type}
                    onChange={(e) => setCurrentEvent({...currentEvent, type: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none appearance-none bg-white dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Meeting">Meeting</option>
                    <option value="Court">Court</option>
                    <option value="Deadline">Deadline</option>
                    <option value="Internal">Internal</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Client / Reference</label>
                <input 
                  type="text"
                  value={currentEvent.client}
                  onChange={(e) => setCurrentEvent({...currentEvent, client: e.target.value})}
                  placeholder="e.g. Smith Family"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Location</label>
                <input 
                  type="text"
                  value={currentEvent.location}
                  onChange={(e) => setCurrentEvent({...currentEvent, location: e.target.value})}
                  placeholder="e.g. Conference Room B"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                {isEditing ? (
                  <button 
                    type="button" 
                    onClick={() => handleDelete(currentEvent.id)}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                ) : <div />}
                
                <div className="flex gap-3">
                  <button 
                    type="button" onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 shadow-lg shadow-amber-600/20 transition-all flex items-center gap-2"
                  >
                    <Check size={18} /> {isEditing ? 'Update Event' : 'Save Event'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;

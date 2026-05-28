import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  User,
  Calendar as CalendarIcon,
  X,
  Check,
  ChevronDown,
  Trash2,
  Edit2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events] = useState([]);
  const isLoading = false;
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

  // Step 2: Optimization - Group events by date (O(1) lookup)
  const eventsByDate = useMemo(() => {
    return events.reduce((acc, event) => {
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    }, {});
  }, [events]);

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
      time: '10:00',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.error("The Supabase backend is disabled.");
    /*
    try {
      const dateTime = `${currentEvent.date}T${currentEvent.time}:00`;
      const payload = {
        title: currentEvent.title,
        next_hearing_date: dateTime,
        client_name: currentEvent.client,
        jurisdiction: currentEvent.location,
        firm_id: currentUser?.firm_id,
        created_by: currentUser?.id
      };

      if (isEditing) {
        const { error } = await supabase
          .from('cases')
          .update(payload)
          .eq('id', currentEvent.id);
        if (error) throw error;
        toast.success('Event updated');
      } else {
        const { error } = await supabase
          .from('cases')
          .insert(payload);
        if (error) throw error;
        toast.success('Event created');
      }
      
      fetchEvents();
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    }
    */
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      void id;
      toast.error("The Supabase backend is disabled.");
      /*
      try {
        const { error } = await supabase
          .from('cases')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id);
        
        if (error) throw error;
        toast.success('Event deleted');
        fetchEvents();
        setIsModalOpen(false);
      } catch (err) {
        toast.error(err.message);
      }
      */
    }
  };

  const renderMonthHeader = () => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{months[currentDate.getMonth()]} {currentDate.getFullYear()}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Schedule for the month of {months[currentDate.getMonth()]}.</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
          <button 
            type="button"
            onClick={prevMonth} 
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            type="button"
            onClick={() => setCurrentDate(new Date())} 
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500"
          >
            Today
          </button>
          <button 
            type="button"
            onClick={nextMonth} 
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <button 
          type="button"
          onClick={() => openNewEventModal()}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
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
    const today = new Date();

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[120px] bg-slate-50/50 dark:bg-slate-900/20 border-b border-r border-slate-200 dark:border-slate-800"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = eventsByDate[dateStr] || [];
      const isToday = d === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

      days.push(
        <div key={d} className={`min-h-[120px] p-2 bg-white dark:bg-slate-900/50 border-b border-r border-slate-200 dark:border-slate-800 transition-colors group`}>
          <div className="flex justify-between items-center mb-1">
            <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-amber-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}>
              {d}
            </span>
            <button 
              type="button"
              onClick={() => openNewEventModal(dateStr)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label={`Add event for ${d} ${months[currentDate.getMonth()]}`}
            >
              <Plus size={12} className="text-slate-500" />
            </button>
          </div>
          <div className="space-y-1">
            {dayEvents.map(event => (
              <button 
                type="button"
                key={event.id} 
                onClick={() => openEditEventModal(event)}
                className={`w-full text-left block px-2 py-1 rounded text-[10px] font-medium truncate border-l-2 shadow-sm hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  event.type === 'Court' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-500' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-400'
                }`}
                title={event.title}
              >
                {event.time} {event.title}
              </button>
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

  const renderAgenda = () => {
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const agendaItems = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = eventsByDate[dateStr] || [];

      if (dayEvents.length > 0) {
        agendaItems.push(
          <div key={d} className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                {d} {months[currentDate.getMonth()]}
              </span>
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
            </div>
            <div className="space-y-2">
              {dayEvents.map(event => (
                <button 
                  type="button"
                  key={event.id}
                  onClick={() => openEditEventModal(event)}
                  className="w-full text-left p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 hover:border-amber-200 transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-amber-600">{event.time}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800">{event.type}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{event.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin size={10} /> {event.location}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      }
    }

    return agendaItems.length > 0 ? (
      <div className="px-1">{agendaItems}</div>
    ) : (
      <div className="text-center py-10 text-slate-500 italic text-sm">No events for this month</div>
    );
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      {renderMonthHeader()}
      
      <div className="flex gap-6 flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-slate-500">Loading...</div>
          ) : (
            <>
              {/* Desktop Grid */}
              <div className="hidden md:block">
                {renderCalendar()}
              </div>
              {/* Mobile Agenda */}
              <div className="block md:hidden">
                {renderAgenda()}
              </div>
            </>
          )}
        </div>

        <div className="w-80 hidden lg:flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-600" /> Upcoming Hearing Dates
            </h3>
            <div className="space-y-4">
              {events
                .filter(e => new Date(e.date) >= new Date().setHours(0,0,0,0))
                .sort((a,b) => new Date(a.date) - new Date(b.date))
                .slice(0, 3)
                .map(e => (
                <button 
                  type="button"
                  key={e.id} 
                  onClick={() => openEditEventModal(e)}
                  className="w-full text-left p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg cursor-pointer hover:bg-blue-100/50 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">Date: {e.date}</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1">{e.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <User size={10} /> {e.client}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  {isEditing ? <Edit2 size={18} /> : <CalendarIcon size={18} />}
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isEditing ? 'Edit Event' : 'New Event'}
                </h2>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="event-title">Event Title</label>
                <input 
                  id="event-title"
                  type="text" required
                  value={currentEvent.title}
                  onChange={(e) => setCurrentEvent({...currentEvent, title: e.target.value})}
                  placeholder="e.g. Case Hearing: Smith"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg outline-none transition-all dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="event-date">Date</label>
                  <input 
                    id="event-date"
                    type="date" required
                    value={currentEvent.date}
                    onChange={(e) => setCurrentEvent({...currentEvent, date: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="event-time">Time</label>
                  <input 
                    id="event-time"
                    type="time" required
                    value={currentEvent.time}
                    onChange={(e) => setCurrentEvent({...currentEvent, time: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="event-client">Client</label>
                <input 
                  id="event-client"
                  type="text"
                  value={currentEvent.client}
                  onChange={(e) => setCurrentEvent({...currentEvent, client: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="event-location">Jurisdiction / Location</label>
                <input 
                  id="event-location"
                  type="text"
                  value={currentEvent.location}
                  onChange={(e) => setCurrentEvent({...currentEvent, location: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                {isEditing ? (
                  <button 
                    type="button" 
                    onClick={() => handleDelete(currentEvent.id)}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                ) : <div />}
                
                <div className="flex gap-3">
                  <button 
                    type="button" onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 shadow-lg transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                  >
                    <Check size={18} /> {isEditing ? 'Update' : 'Save'}
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



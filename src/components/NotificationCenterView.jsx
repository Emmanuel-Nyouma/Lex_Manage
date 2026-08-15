import React, { useState } from 'react';
import { Bell, History, BookTemplate, CalendarClock } from 'lucide-react';
import useLexStore from '../store/useLexStore';
import SendNotificationDialog from './SendNotificationDialog';
import { HistoryTab, TemplatesTab } from './notifications/NotificationHistoryTemplates';
import ScheduledTab from './notifications/NotificationScheduled';

// ─── Main page ───────────────────────────────────────────────────────────────

const TABS = [
  { id: 'history',   label: 'History',    icon: History      },
  { id: 'templates', label: 'Templates',  icon: BookTemplate },
  { id: 'scheduled', label: 'Scheduled',  icon: CalendarClock},
];

const NotificationCenterView = () => {
  const { currentUser } = useLexStore();
  const [activeTab, setActiveTab] = useState('history');
  const [pendingTemplate, setPendingTemplate] = useState(null);
  const [isSendOpen, setIsSendOpen] = useState(false);

  const isAdmin = currentUser?.role === 'CABINET_ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-slate-500">
      <Bell size={48} className="mb-4 text-slate-300" />
      <p className="font-bold text-slate-900 dark:text-white text-lg">Restricted Access</p>
      <p className="text-sm">Only firm administrators can access this section.</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Notification Center</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
          History · Reusable templates · Scheduled sends
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 w-fit">
        {TABS.map(({ id, label, icon: _Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === id
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <_Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'history'   && <HistoryTab />}
        {activeTab === 'templates' && (
          <TemplatesTab
            onUseTemplate={(t) => {
              setPendingTemplate(t);
              setIsSendOpen(true);
            }}
          />
        )}
        {activeTab === 'scheduled' && <ScheduledTab />}
      </div>

      {/* Send dialog — receives a preloaded template from the "Use" button */}
      <SendNotificationDialog
        isOpen={isSendOpen}
        onClose={() => { setIsSendOpen(false); setPendingTemplate(null); }}
        preloadTemplate={pendingTemplate}
      />
    </div>
  );
};

export default NotificationCenterView;
export { LEVEL_CONFIG } from './notifications/notificationCenterData';

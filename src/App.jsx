import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Calendar as CalendarIcon,
  Files,
  ShieldCheck,
  Search,
  Bell,
  Menu,
  X,
  Bot,
  Gavel,
  LogOut,
  Settings
} from 'lucide-react';

// Components
import { Badge } from './components/UI';
import AuthScreen from './components/AuthScreen';
import DashboardView from './components/DashboardView';
import CaseManagementView from './components/CaseManagementView';
import CalendarView from './components/CalendarView';
import DocumentsView from './components/DocumentsView';
import AdminView from './components/AdminView';
import ProfileView from './components/ProfileView';
import AiSidebar from './components/AiSidebar';
import CaseDrawer from './components/CaseDrawer';
import SettingsView from './components/SettingsView';

// Translations
import { translations } from './utils/translations';

/**
 * MOCK DATA
 */
const MOCK_NOTIFICATIONS = [
  { id: 1, title: 'New Case Assigned', message: 'You have been assigned to the Smith v. Jones case.', time: '10 min ago', unread: true, type: 'alert' },
  { id: 2, title: 'Document Review', message: 'Amy Lee requested review on the Sterling Motion.', time: '1 hour ago', unread: true, type: 'info' },
  { id: 3, title: 'System Update', message: 'LexManage will undergo maintenance at midnight.', time: '5 hours ago', unread: false, type: 'system' },
  { id: 4, title: 'Client Meeting', message: 'Reminder: Meeting with TechCorp in 30 mins.', time: 'Yesterday', unread: false, type: 'info' },
];

const MOCK_CASES = [
  { id: 101, name: 'Estate of H. Sterling', client: 'Sterling Family', type: 'Probate', status: 'Active', deadline: '2023-11-15', amount: '$1.2M', members: ['SJ', 'MR'] },
  { id: 102, name: 'TechCorp v. DataInc', client: 'TechCorp Global', type: 'IP Litigation', status: 'In Court', deadline: '2023-10-30', amount: '$4.5M', members: ['SJ'] },
  { id: 103, name: 'Rivera Merger', client: 'Rivera Holdings', type: 'Corporate', status: 'Pending', deadline: '2023-12-01', amount: '$850k', members: ['MR', 'AL'] },
  { id: 104, name: 'State v. Peterson', client: 'John Peterson', type: 'Criminal Defense', status: 'Active', deadline: '2023-11-05', amount: '$50k', members: ['AL'] },
  { id: 105, name: 'Greenwood Zoning', client: 'Greenwood Devs', type: 'Real Estate', status: 'Closed', deadline: '2023-09-15', amount: '$120k', members: ['SJ'] },
];

const INITIAL_CHAT_HISTORY = [
  { id: 1, sender: 'ai', text: "Hello, Partner Jenkins. I am connected to the firm's repository. How can I assist you with your cases today?", isRich: false },
];

const MOCK_USERS = [
  { id: 1, name: 'Sarah Jenkins', role: 'Partner', rate: '$650/hr', status: 'Active', email: 's.jenkins@lexmanage.com' },
  { id: 2, name: 'Michael Ross', role: 'Associate', rate: '$350/hr', status: 'Active', email: 'm.ross@lexmanage.com' },
  { id: 3, name: 'Amy Lee', role: 'Paralegal', rate: '$175/hr', status: 'Active', email: 'a.lee@lexmanage.com' },
];

/**
 * MAIN APP COMPONENT
 */
export default function LexManageApp() {
  // --- SETTINGS STATE ---
  const [language, setLanguage] = useState(localStorage.getItem('lex_lang') || 'en');
  const [theme, setTheme] = useState(localStorage.getItem('lex_theme') || 'light');
  const t = translations[language];

  // --- AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('lex_token'));

  // Task 3: Auth Resilience - 401 Interceptor
  const authorizedFetch = async (url, options = {}) => {
    const response = await fetch(url, options);
    if (response.status === 401) {
      handleLogout();
      return response;
    }
    return response;
  };

  /**
   * GEMINI API UTILITIES (Moved inside to access authorizedFetch)
   */
  const callGemini = async (prompt, systemInstruction = "") => {
    const backendUrl = "http://localhost:5000/api/ai/chat";

    try {
      const response = await authorizedFetch(backendUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ prompt, systemInstruction }),
      });

      if (!response.ok) {
        if (response.status === 401) return "Session expired. Please log in again.";
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.text || "No response generated.";
    } catch (error) {
      console.error("AI Error:", error);
      throw error; // Let handleSendMessage catch it
    }
  };
  
  // --- APP STATE ---
  const [currentView, setCurrentView] = useState('dashboard');
  const [isAiOpen, setIsAiOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [activeCase, setActiveCase] = useState(null); 
  const [adminUsers, setAdminUsers] = useState(MOCK_USERS); 
  const [cases, setCases] = useState([]); 
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [searchQuery, setSearchQuery] = useState('');

  // AI State
  const [chatHistory, setChatHistory] = useState(INITIAL_CHAT_HISTORY);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);

  // Apply Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('lex_theme', theme);
  }, [theme]);

  // Save Language
  useEffect(() => {
    localStorage.setItem('lex_lang', language);
  }, [language]);

  // Fetch Cases from API
  useEffect(() => {
    if (isAuthenticated) {
      const fetchCases = async () => {
        try {
          const response = await authorizedFetch('/api/cases', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setCases(data);
          }
        } catch (error) {
          console.error("Failed to fetch cases:", error);
        }
      };
      fetchCases();
    }
  }, [isAuthenticated, token]);

  // ... rest of the logic ...

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('lex_token');
    localStorage.removeItem('lex_user');
    setChatHistory(INITIAL_CHAT_HISTORY);
  };

  const handleMarkAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const handleSendMessage = async (text) => {
    const userMsg = { id: Date.now(), sender: 'user', text };
    setChatHistory(prev => [...prev, userMsg]);
    setIsChatLoading(true);
    setChatError(null); // Reset error

    try {
      const systemPrompt = "You are LexAssist, a senior legal AI assistant for a high-end law firm.";
      const aiResponseText = await callGemini(text, systemPrompt);
      const aiMsg = { id: Date.now() + 1, sender: 'ai', text: aiResponseText, isRich: true };
      setChatHistory(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
      setChatError("Failed to get response from Lex. Please check your connection.");
    } finally {
      setIsChatLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  const filteredCases = cases.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return <AuthScreen onLoginSuccess={handleAuthSuccess} />;
  }

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t.dashboard },
    { id: 'cases', icon: Briefcase, label: t.cases },
    { id: 'calendar', icon: CalendarIcon, label: t.calendar },
    { id: 'documents', icon: Files, label: t.documents },
    { id: 'admin', icon: ShieldCheck, label: t.admin, badge: 'Admin' },
    { id: 'settings', icon: Settings, label: t.settings },
  ];

  return (
    <div className={`flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden`}>
      
      {/* SIDEBAR NAVIGATION */}
      <aside className={`fixed md:relative inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 z-50 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 flex flex-col shadow-xl`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <Gavel className="text-amber-500 mr-2" size={24} />
          <span className="text-white font-bold text-lg tracking-wide">LEX<span className="text-slate-400 font-light">MANAGE</span></span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden ml-auto text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setCurrentView(item.id); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors border-l-4 ${
                currentView === item.id 
                  ? 'bg-slate-800 text-white border-amber-500' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white border-transparent'
              }`}
            >
              <item.icon size={18} className="mr-3" />
              {item.label}
              {item.badge && <span className="ml-auto text-[10px] bg-amber-600 text-white px-1.5 py-0.5 rounded">{item.badge}</span>}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          <button 
            onClick={() => setCurrentView('profile')}
            className={`flex-1 flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${currentView === 'profile' ? 'bg-slate-800' : 'hover:bg-slate-800'}`}
          >
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold border border-slate-600">
               {currentUser?.name?.charAt(0) || "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{currentUser?.name || "User"}</p>
              <p className="text-[10px] text-slate-400 truncate">{currentUser?.role === 'ADMIN' ? 'Administrator' : 'Partner'}</p>
            </div>
          </button>
          
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            title={t.logout}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${isAiOpen ? 'mr-96' : ''}`}>
        
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-slate-500 dark:text-slate-400">
               <Menu size={24} />
             </button>
             <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-md px-3 py-1.5 w-96 transition-all focus-within:ring-2 focus-within:ring-amber-500/50">
               <Search size={16} className="text-slate-400 mr-2" />
               <input 
                 className="bg-transparent border-none focus:outline-none text-sm w-full text-slate-700 dark:text-slate-200 placeholder:text-slate-400" 
                 placeholder={t.search_placeholder} 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
               <span className="text-[10px] text-slate-400 border border-slate-300 dark:border-slate-600 px-1 rounded">⌘K</span>
             </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative">
               <button 
                 onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                 className={`relative text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ${isNotificationOpen ? 'text-amber-600' : ''}`}
               >
                 <Bell size={20} />
                 {unreadCount > 0 && (
                   <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                 )}
               </button>

               {isNotificationOpen && (
                 <>
                   <div className="fixed inset-0 z-30" onClick={() => setIsNotificationOpen(false)}></div>
                   <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-t-lg">
                         <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.notifications}</h4>
                         <button 
                           onClick={handleMarkAllRead}
                           className="text-xs text-amber-600 hover:text-amber-700 hover:underline font-medium"
                         >
                           Mark all read
                         </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                         {notifications.map(n => (
                           <div 
                             key={n.id} 
                             onClick={() => handleMarkAsRead(n.id)}
                             className={`p-3 border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer flex gap-3 transition-colors ${n.unread ? 'bg-amber-50/40 dark:bg-amber-900/20' : 'bg-white dark:bg-slate-800'}`}
                           >
                              <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.unread ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                              <div>
                                 <p className={`text-xs ${n.unread ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{n.title}</p>
                                 <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                                 <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{n.time}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                 </>
               )}
             </div>

             <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
             <button 
               onClick={() => setIsAiOpen(!isAiOpen)}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                 isAiOpen ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 ring-2 ring-amber-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
               }`}
             >
               <Bot size={16} />
               <span className="hidden sm:inline">{t.ai_assistant}</span>
             </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950 relative">
          {currentView === 'dashboard' && <DashboardView currentUser={currentUser} cases={filteredCases} onCaseSelect={setActiveCase} onNavigate={setCurrentView} t={t} />}
          {currentView === 'cases' && <CaseManagementView cases={filteredCases} setCases={setCases} setActiveCase={setActiveCase} t={t} />}
          {currentView === 'calendar' && <CalendarView t={t} />}
          {currentView === 'documents' && <DocumentsView t={t} />}
          {currentView === 'admin' && <AdminView adminUsers={adminUsers} onAddUser={(u) => setAdminUsers([...adminUsers, u])} t={t} />}
          {currentView === 'profile' && <ProfileView currentUser={currentUser} t={t} />}
          {currentView === 'settings' && <SettingsView language={language} setLanguage={setLanguage} theme={theme} setTheme={setTheme} t={t} />}
        </main>
      </div>

      <AiSidebar 
        isOpen={isAiOpen} 
        onClose={() => setIsAiOpen(false)} 
        currentView={currentView}
        chatHistory={chatHistory}
        setChatHistory={setChatHistory}
        onSendMessage={handleSendMessage}
        isChatLoading={isChatLoading}
        error={chatError}
      />
      
      <CaseDrawer 
        activeCase={activeCase} 
        onClose={() => setActiveCase(null)} 
        onCallGemini={callGemini}
      />

    </div>
  );
}

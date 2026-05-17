import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Lock, ShieldCheck } from 'lucide-react';

// Components
import AuthScreen from './components/AuthScreen';
import DashboardView from './components/DashboardView';
import CaseManagementView from './components/CaseManagementView';
import CalendarView from './components/CalendarView';
import DocumentsView from './components/DocumentsView';
import AdminView from './components/AdminView';
import CompanySettingsView from './components/CompanySettingsView';
import ProfileView from './components/ProfileView';
import SettingsView from './components/SettingsView';
import AiSidebar from './components/AiSidebar';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Store & Lib
import useLexStore from './store/useLexStore';
import { useIdleTimeout } from './hooks/useIdleTimeout';

export default function LexManageApp() {
  const { session, initAuth, isLoading } = useLexStore();
  const { isIdle, setIsIdle } = useIdleTimeout(15 * 60 * 1000); // 15 minutes
  const location = useLocation();
  const isAuthenticated = !!session;

  const [isAiOpen, setIsAiOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { id: 1, sender: 'ai', text: "Bonjour Maître, je suis LexAssist. Comment puis-je vous aider aujourd'hui ?", isRich: false }
  ]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Chargement de LexManage...</p>
        </div>
      </div>
    );
  }

  const handleSendMessage = (text) => {
    const userMsg = { id: Date.now(), sender: 'user', text };
    setChatHistory(prev => [...prev, userMsg]);
  };

  const MainLayout = ({ children }) => (
    <div className="relative flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Overlay de verrouillage d'inactivité */}
      {isIdle && isAuthenticated && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-500">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 text-center max-w-sm mx-4">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-6">
              <Lock size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Session Verrouillée</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
              Par mesure de confidentialité, votre accès a été suspendu suite à une période d'inactivité.
            </p>
            <button 
              onClick={() => setIsIdle(false)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-slate-950 rounded-xl font-bold shadow-lg hover:bg-amber-600 transition-all"
            >
              <ShieldCheck size={20} />
              Déverrouiller l'écran
            </button>
          </div>
        </div>
      )}

      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header onOpenAi={() => setIsAiOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
          {children}
        </main>
      </div>
      <AiSidebar 
        isOpen={isAiOpen} 
        onClose={() => setIsAiOpen(false)} 
        chatHistory={chatHistory}
        onSendMessage={handleSendMessage}
        currentView={location.pathname}
      />
    </div>
  );

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthScreen />
        } />
        
        <Route path="/dashboard" element={<MainLayout><DashboardView /></MainLayout>} />
        <Route path="/cases" element={<MainLayout><CaseManagementView /></MainLayout>} />
        <Route path="/calendar" element={<MainLayout><CalendarView /></MainLayout>} />
        <Route path="/documents" element={<MainLayout><DocumentsView /></MainLayout>} />
        <Route path="/admin" element={<MainLayout><AdminView /></MainLayout>} />
        <Route path="/company-settings" element={<MainLayout><CompanySettingsView /></MainLayout>} />
        <Route path="/profile" element={<MainLayout><ProfileView /></MainLayout>} />
        <Route path="/settings" element={<MainLayout><SettingsView /></MainLayout>} />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

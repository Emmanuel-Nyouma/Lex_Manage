import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';

// Components
import AuthScreen from './components/AuthScreen';
import DashboardView from './components/DashboardView';
import CaseManagementView from './components/CaseManagementView';
import CalendarView from './components/CalendarView';
import DocumentsView from './components/DocumentsView';
import AdminView from './components/AdminView';
import ProfileView from './components/ProfileView';
import SettingsView from './components/SettingsView';
import AiSidebar from './components/AiSidebar';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Store & Lib
import useLexStore from './store/useLexStore';

export default function LexManageApp() {
  const { session, initAuth, isLoading } = useLexStore();
  const location = useLocation();
  const isAuthenticated = !!session;

  // État local pour l'IA (pour éviter les crashs si non passé)
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

  if (!isAuthenticated && location.pathname !== '/login') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleSendMessage = (text) => {
    const userMsg = { id: Date.now(), sender: 'user', text };
    setChatHistory(prev => [...prev, userMsg]);
    // Ici on ajoutera la logique d'appel à Gemini plus tard
  };

  const MainLayout = ({ children }) => (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
      <Toaster position="top-right" richColors closeButton />
      
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
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthScreen />
      } />
      
      <Route path="/dashboard" element={<MainLayout><DashboardView /></MainLayout>} />
      <Route path="/cases" element={<MainLayout><CaseManagementView /></MainLayout>} />
      <Route path="/calendar" element={<MainLayout><CalendarView /></MainLayout>} />
      <Route path="/documents" element={<MainLayout><DocumentsView /></MainLayout>} />
      <Route path="/admin" element={<MainLayout><AdminView /></MainLayout>} />
      <Route path="/profile" element={<MainLayout><ProfileView /></MainLayout>} />
      <Route path="/settings" element={<MainLayout><SettingsView /></MainLayout>} />
      
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

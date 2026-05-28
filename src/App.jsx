import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { Lock, ShieldCheck, AlertTriangle, X as CloseIcon } from 'lucide-react';

// Components
import AuthScreen from './components/AuthScreen';
import DashboardView from './components/DashboardView';
import CaseManagementView from './components/CaseManagementView';
import ClientsDirectoryView from './components/ClientsDirectoryView';
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
import { useNotifications } from './hooks/useNotifications';
import { useSocket } from './hooks/useSocket';
import { useQueryClient } from '@tanstack/react-query';

// SECURITY FIX #4: Protected route wrapper
const ProtectedRoute = ({ children, session }) => {
  if (!session) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children, session, currentUser }) => {
  if (!session) return <Navigate to="/login" replace />;
  if (currentUser?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const MainLayout = ({ children, isAiOpen, setIsAiOpen, isMobileSidebarOpen, setIsMobileSidebarOpen }) => {
  const location = useLocation();
  const { urgentNotification, clearUrgent } = useNotifications();

  return (
    <div className="relative flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Pop-up Urgent (Étape 2/3) */}
      {urgentNotification && (
        <div className="fixed inset-0 z-[110] bg-red-950/20 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border-2 border-red-500 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-red-500 p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <ShieldCheck size={24} />
                <h2 className="font-bold text-lg">ALERTE URGENTE</h2>
              </div>
              <button onClick={clearUrgent} className="hover:rotate-90 transition-transform">
                <CloseIcon size={20} />
              </button>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{urgentNotification.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                {urgentNotification.message}
              </p>
              <button 
                onClick={clearUrgent}
                className="w-full py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
              >
                J'ai pris connaissance
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar 
        isMobileOpen={isMobileSidebarOpen} 
        onCloseMobile={() => setIsMobileSidebarOpen(false)} 
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header 
          onOpenAi={() => setIsAiOpen(true)} 
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950 focus:outline-none" tabIndex="-1">
          {children}
        </main>
      </div>
      <AiSidebar 
        isOpen={isAiOpen} 
        onClose={() => setIsAiOpen(false)} 
        currentView={location.pathname}
      />
    </div>
  );
};

export default function LexManageApp() {
  const { session, initAuth, isLoading, currentUser, logout } = useLexStore();
  const queryClient = useQueryClient();
  const socket = useSocket();
  const { isIdle } = useIdleTimeout(15 * 60 * 1000); // 15 minutes
  const isAuthenticated = !!session;

  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (socket) {
      socket.on('case.created', (newCase) => {
        toast.success(`Nouveau dossier créé: ${newCase.title}`);
        queryClient.invalidateQueries({ queryKey: ['cases'] });
      });
    }
  }, [socket, queryClient]);

  // SECURITY FIX #6: Real session termination on idle (not just overlay)
  useEffect(() => {
    if (isIdle && isAuthenticated) {
      logout();
    }
  }, [isIdle, isAuthenticated, logout]);

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

  const layoutProps = { isAiOpen, setIsAiOpen, isMobileSidebarOpen, setIsMobileSidebarOpen };

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthScreen />
        } />
        
        <Route path="/dashboard" element={<ProtectedRoute session={session}><MainLayout {...layoutProps}><DashboardView /></MainLayout></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute session={session}><MainLayout {...layoutProps}><ClientsDirectoryView /></MainLayout></ProtectedRoute>} />
        <Route path="/cases" element={<ProtectedRoute session={session}><MainLayout {...layoutProps}><CaseManagementView /></MainLayout></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute session={session}><MainLayout {...layoutProps}><CalendarView /></MainLayout></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute session={session}><MainLayout {...layoutProps}><DocumentsView /></MainLayout></ProtectedRoute>} />
        <Route path="/admin" element={
          <AdminRoute session={session} currentUser={currentUser}>
            <MainLayout {...layoutProps}><AdminView /></MainLayout>
          </AdminRoute>
        } />
        <Route path="/company-settings" element={<ProtectedRoute session={session}><MainLayout {...layoutProps}><CompanySettingsView /></MainLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute session={session}><MainLayout {...layoutProps}><ProfileView /></MainLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute session={session}><MainLayout {...layoutProps}><SettingsView /></MainLayout></ProtectedRoute>} />
        
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </>
  );
}

import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from './lib/router';
import { Toaster, toast } from 'sonner';
import { ShieldCheck, X as CloseIcon } from 'lucide-react';

// App shell — eager (always needed)
import AuthScreen from './components/AuthScreen';
import OnboardingScreen, { ONBOARDING_STORAGE_KEY } from './components/OnboardingScreen';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { Breadcrumbs, FocusTrap, PageSkeleton } from './components/ui';

// Route views — lazy-loaded (code-split per route for faster mobile first paint)
const DashboardView        = lazy(() => import('./components/DashboardView'));
const CaseManagementView   = lazy(() => import('./components/CaseManagementView'));
const CalendarView         = lazy(() => import('./components/CalendarView'));
const DocumentsView        = lazy(() => import('./components/DocumentsView'));
const ClientsDirectoryView = lazy(() => import('./components/ClientsDirectoryView'));
const ClientDetailView    = lazy(() => import('./components/ClientDetailView'));
const CompanySettingsView  = lazy(() => import('./components/CompanySettingsView'));
const NotificationCenterView = lazy(() => import('./components/NotificationCenterView'));
const ProfileView          = lazy(() => import('./components/ProfileView'));
const SettingsView         = lazy(() => import('./components/SettingsView'));
const AiAssistantView      = lazy(() => import('./components/AiAssistantView'));
const ColleaguesView       = lazy(() => import('./components/ColleaguesView'));

// Fallback shown while a route chunk loads
const RouteFallback = () => <PageSkeleton variant="content" className="min-h-[60vh]" />;

const InitialRoute = ({ isAuthenticated }) => {
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
  return <Navigate to={hasCompletedOnboarding ? '/login' : '/welcome'} replace />;
};

// Store & Lib
import useLexStore from './store/useLexStore';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import { useNotifications } from './hooks/useNotifications';
import { useQueryClient } from '@tanstack/react-query';

// SECURITY FIX #4: Protected route wrapper
const ProtectedRoute = ({ children, session }) => {
  if (!session) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children, session, currentUser }) => {
  if (!session || !currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== 'CABINET_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const MainLayout = ({
  children,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  isSearchOpen,
  setIsSearchOpen,
  notificationsApi,
}) => {
  const navigate = useNavigate();
  const { urgentNotification, clearUrgent } = notificationsApi;

  return (
    <div className="relative flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Pop-up Urgent (Étape 2/3) */}
      {urgentNotification && (
        <div 
          className="fixed inset-0 z-[110] bg-red-950/20 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
        >
          <FocusTrap isActive onClose={clearUrgent}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="urgent-title" className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border-2 border-red-500 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-red-500 p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <ShieldCheck size={24} />
                <h2 id="urgent-title" className="font-bold text-lg">ALERTE URGENTE</h2>
              </div>
              <button
                onClick={clearUrgent}
                aria-label="Fermer l’alerte urgente"
                title="Fermer"
                className="hover:rotate-90 transition-transform"
              >
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
          </FocusTrap>
        </div>
      )}

      <Sidebar 
        isMobileOpen={isMobileSidebarOpen} 
        onCloseMobile={() => setIsMobileSidebarOpen(false)} 
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          onOpenAi={() => navigate('/lex-assist')}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
          isSearchOpen={isSearchOpen}
          setIsSearchOpen={setIsSearchOpen}
          notificationsApi={notificationsApi}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950 focus:outline-none" tabIndex="-1">
          <Breadcrumbs />
          <Suspense fallback={<RouteFallback />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default function LexManageApp() {
  const { accessToken, initAuth, isLoading, currentUser, logout } = useLexStore();
  const queryClient = useQueryClient();
  const notificationsApi = useNotifications();
  const socket = notificationsApi.socket;
  const { isIdle } = useIdleTimeout(15 * 60 * 1000); // 15 minutes
  const isAuthenticated = !!accessToken;

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    // Run the session bootstrap exactly once on mount. initAuth/logout are stable
    // Zustand actions; reading the token via getState() inside the handlers avoids
    // re-subscribing on every token change (which previously caused a refresh loop).
    initAuth();

    // SYNC: Multi-tab session synchronization
    const handleStorageChange = (e) => {
      const currentToken = useLexStore.getState().accessToken;
      if (e.key === 'wasLoggedIn') {
        if (!e.newValue && currentToken) logout();
        if (e.newValue === 'true' && !currentToken) initAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (socket) {
      const handleCaseCreated = (newCase) => {
        toast.success(`Nouveau dossier créé: ${newCase.title}`);
        queryClient.invalidateQueries({ queryKey: ['cases'] });
      };
      socket.on('case.created', handleCaseCreated);
      return () => socket.off('case.created', handleCaseCreated);
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
          <p className="text-slate-600 dark:text-slate-300 font-medium animate-pulse">Chargement de LexManage...</p>
        </div>
      </div>
    );
  }

  const layoutProps = {
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isSearchOpen,
    setIsSearchOpen,
    notificationsApi,
  };

  return (
    <>
      <Toaster position="bottom-right" richColors closeButton />
      <Routes>
        <Route path="/welcome" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <OnboardingScreen />
        } />
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthScreen />
        } />
        
        <Route path="/dashboard" element={<ProtectedRoute session={accessToken}><MainLayout {...layoutProps}><DashboardView /></MainLayout></ProtectedRoute>} />
        <Route path="/cases" element={<ProtectedRoute session={accessToken}><MainLayout {...layoutProps}><CaseManagementView /></MainLayout></ProtectedRoute>} />
        <Route path="/cases/:id" element={<ProtectedRoute session={accessToken}><MainLayout {...layoutProps}><CaseManagementView /></MainLayout></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute session={accessToken}><MainLayout {...layoutProps}><CalendarView /></MainLayout></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute session={accessToken}><MainLayout {...layoutProps}><DocumentsView /></MainLayout></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute session={accessToken}><MainLayout {...layoutProps}><ClientsDirectoryView /></MainLayout></ProtectedRoute>} />
        <Route path="/clients/:id" element={<ProtectedRoute session={accessToken}><MainLayout {...layoutProps}><ClientDetailView /></MainLayout></ProtectedRoute>} />
        <Route path="/lex-assist" element={<ProtectedRoute session={accessToken}><MainLayout {...layoutProps}><AiAssistantView /></MainLayout></ProtectedRoute>} />
        <Route path="/colleagues" element={<ProtectedRoute session={accessToken}><MainLayout {...layoutProps}><ColleaguesView /></MainLayout></ProtectedRoute>} />
        <Route path="/company-settings" element={
          <AdminRoute session={accessToken} currentUser={currentUser}>
            <MainLayout {...layoutProps}><CompanySettingsView /></MainLayout>
          </AdminRoute>
        } />
        <Route path="/notification-center" element={
          <AdminRoute session={accessToken} currentUser={currentUser}>
            <MainLayout {...layoutProps}><NotificationCenterView /></MainLayout>
          </AdminRoute>
        } />
        <Route path="/profile" element={<ProtectedRoute session={accessToken}><MainLayout {...layoutProps}><ProfileView /></MainLayout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute session={accessToken}><MainLayout {...layoutProps}><SettingsView /></MainLayout></ProtectedRoute>} />
        
        <Route path="/" element={<InitialRoute isAuthenticated={isAuthenticated} />} />
        <Route path="*" element={<InitialRoute isAuthenticated={isAuthenticated} />} />
      </Routes>
    </>
  );
}

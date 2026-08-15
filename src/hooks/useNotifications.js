import { useEffect, useCallback } from 'react';
import apiClient from '../lib/api';
import useLexStore from '../store/useLexStore';
import { useSocket } from './useSocket';
import { toast } from 'sonner';
import { create } from 'zustand';

// Store interne pour gérer l'état des notifications et le pop-up urgent
export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  urgentNotification: null, // Pour le pop-up "Home Page"
  hasInitialToastsBeenShown: false,
  initialToastsShownForUserId: null,
  error: null,
  
  setNotifications: (notifications, userId) => {
    const enriched = notifications.map(n => ({
      ...n,
      isRead: n.readByIds?.includes(userId)
    }));
    set({ 
      notifications: enriched, 
      unreadCount: enriched.filter(n => !n.isRead).length 
    });
  },
  
  addNotification: (notification, userId) => set((state) => {
    const isRead = notification.readByIds?.includes(userId);
    const enriched = { ...notification, isRead };
    const newNotifications = [enriched, ...state.notifications].slice(0, 50);
    return {
      notifications: newNotifications,
      unreadCount: newNotifications.filter(n => !n.isRead).length,
      urgentNotification: enriched.level === 'URGENT' ? enriched : state.urgentNotification
    };
  }),

  clearUrgent: () => set({ urgentNotification: null }),
  setInitialToastsShown: (val, userId = null) => set({
    hasInitialToastsBeenShown: val,
    initialToastsShownForUserId: val ? userId : null,
  }),
  setError: (error) => set({ error }),
  reset: () => set({
    notifications: [],
    unreadCount: 0,
    urgentNotification: null,
    hasInitialToastsBeenShown: false,
    initialToastsShownForUserId: null,
    error: null,
  }),
  
  markAsRead: async (id, _userId) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      set((state) => {
        const updated = state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
        return {
          notifications: updated,
          unreadCount: updated.filter(n => !n.isRead).length
        };
      });
    } catch {
      toast.error("Impossible de marquer la notification comme lue.");
    }
  },

  markAllAsRead: async () => {
    // Optimistic update
    const previous = get().notifications;
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    try {
      await apiClient.patch('/notifications/read-all');
    } catch {
      // Roll back on failure
      set({ notifications: previous, unreadCount: previous.filter(n => !n.isRead).length });
      toast.error("Impossible de marquer toutes les notifications comme lues.");
    }
  }
}));

export const useNotifications = () => {
  const { currentUser } = useLexStore();
  const socket = useSocket();
  const { 
    notifications, 
    unreadCount, 
    urgentNotification, 
    hasInitialToastsBeenShown,
    setNotifications,
    addNotification,
    clearUrgent,
    markAsRead,
    markAllAsRead,
    setInitialToastsShown
    ,initialToastsShownForUserId,
    setError,
    reset,
    error
  } = useNotificationStore();

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { data } = await apiClient.get('/notifications');
      setNotifications(data, currentUser.id);
      setError(null);
    } catch {
      setError("Les notifications sont temporairement indisponibles.");
    }
  }, [currentUser, setNotifications, setError]);

  useEffect(() => {
    if (!currentUser) {
      reset();
      return;
    }
    if (initialToastsShownForUserId !== currentUser.id) {
      setInitialToastsShown(false);
    }
    fetchNotifications();
  }, [currentUser, fetchNotifications, initialToastsShownForUserId, reset, setInitialToastsShown]);

  // Level 2 (IMPORTANT) Persistence: Show toasts on load
  useEffect(() => {
    if (notifications.length > 0 && !hasInitialToastsBeenShown) {
      const sessionKey = `lex-toasts-shown-${currentUser?.id}`;
      const shownIds = JSON.parse(sessionStorage.getItem(sessionKey) || '[]');
      
      const importantUnread = notifications.filter(n => 
        n.level === 'IMPORTANT' && !n.isRead && !shownIds.includes(n.id)
      );

      importantUnread.forEach(n => {
        toast.info(n.motif || "Rappel Important", {
          description: n.message,
          duration: 5000,
        });
        shownIds.push(n.id);
      });

      if (importantUnread.length > 0) {
        sessionStorage.setItem(sessionKey, JSON.stringify(shownIds));
      }
      setInitialToastsShown(true, currentUser?.id);
    }
  }, [notifications, hasInitialToastsBeenShown, currentUser, setInitialToastsShown]);

  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleNotification = (data) => {
      // Check if current user is a recipient
      if (data.recipientIds?.length > 0 && !data.recipientIds.includes(currentUser.id)) {
        return;
      }

      addNotification(data, currentUser.id);
      
      if (data.level === 'URGENT') {
        // level 3 is handled by urgentNotification state in App.jsx
      } else {
        toast.info(data.motif || data.title || "Nouvelle notification", {
          description: data.message
        });
        
        // Mark as shown in session storage if it's level 2
        if (data.level === 'IMPORTANT') {
          const sessionKey = `lex-toasts-shown-${currentUser?.id}`;
          const shownIds = JSON.parse(sessionStorage.getItem(sessionKey) || '[]');
          if (!shownIds.includes(data.id)) {
            shownIds.push(data.id);
            sessionStorage.setItem(sessionKey, JSON.stringify(shownIds));
          }
        }
      }
    };

    socket.on('notification.new', handleNotification);

    return () => {
      socket.off('notification.new', handleNotification);
    };
  }, [socket, addNotification, currentUser]);

  return {
    notifications,
    unreadCount,
    urgentNotification,
    clearUrgent,
    markAsRead: (id) => markAsRead(id, currentUser?.id),
    markAllAsRead,
    error,
    retry: fetchNotifications,
    socket,
  };
};

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
  setInitialToastsShown: (val) => set({ hasInitialToastsBeenShown: val }),
  
  markAsRead: async (id, userId) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      set((state) => {
        const updated = state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
        return {
          notifications: updated,
          unreadCount: updated.filter(n => !n.isRead).length
        };
      });
    } catch (err) {
      console.error("Failed to mark notification as read", err);
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
    setInitialToastsShown
  } = useNotificationStore();

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { data } = await apiClient.get('/notifications');
      setNotifications(data, currentUser.id);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, [currentUser, setNotifications]);

  useEffect(() => {
    if (!currentUser) return;
    fetchNotifications();
  }, [currentUser, fetchNotifications]);

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
      setInitialToastsShown(true);
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

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, addNotification, currentUser]);

  return { 
    notifications, 
    unreadCount, 
    urgentNotification, 
    clearUrgent, 
    markAsRead: (id) => markAsRead(id, currentUser?.id) 
  };
};

import { useEffect, useCallback } from 'react';
import useLexStore, { apiClient } from '../store/useLexStore';
import { toast } from 'sonner';
import { create } from 'zustand';

// Store interne pour gérer l'état des notifications et le pop-up urgent
export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  urgentNotification: null, // Pour le pop-up "Home Page"
  
  setNotifications: (notifications) => set({ 
    notifications, 
    unreadCount: notifications.filter(n => !n.isRead).length 
  }),
  
  addNotification: (notification) => set((state) => {
    const newNotifications = [notification, ...state.notifications].slice(0, 50);
    return {
      notifications: newNotifications,
      unreadCount: newNotifications.filter(n => !n.isRead).length,
      urgentNotification: notification.priority === 'HIGH' ? notification : state.urgentNotification
    };
  }),

  clearUrgent: () => set({ urgentNotification: null }),
  
  markAsRead: async (id) => {
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
  const { currentUser, session } = useLexStore();
  const { 
    notifications, 
    unreadCount, 
    urgentNotification, 
    setNotifications,
    clearUrgent,
    markAsRead
  } = useNotificationStore();

  const fetchNotifications = useCallback(async () => {
    if (!currentUser || !session) return;
    try {
      const { data } = await apiClient.get('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, [currentUser, session, setNotifications]);

  useEffect(() => {
    if (!currentUser || !session) return;

    fetchNotifications();

    // Polling simple toutes les 30 secondes pour simuler le Realtime si WebSockets non configurés
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [currentUser, session, fetchNotifications]);

  return { notifications, unreadCount, urgentNotification, clearUrgent, markAsRead };
};

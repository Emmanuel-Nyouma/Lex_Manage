import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import useLexStore from '../store/useLexStore';
import { toast } from 'sonner';
import { create } from 'zustand';

// Store interne pour gérer l'état des notifications et le pop-up urgent
export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  urgentNotification: null, // Pour le pop-up "Home Page"
  
  setNotifications: (notifications) => set({ 
    notifications, 
    unreadCount: notifications.filter(n => !n.is_read).length 
  }),
  
  addNotification: (notification) => set((state) => {
    const newNotifications = [notification, ...state.notifications].slice(0, 20);
    return {
      notifications: newNotifications,
      unreadCount: newNotifications.filter(n => !n.is_read).length,
      urgentNotification: notification.priority === 'high' ? notification : state.urgentNotification
    };
  }),

  clearUrgent: () => set({ urgentNotification: null }),
  
  markAsRead: async (id) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    if (!error) {
      set((state) => {
        const updated = state.notifications.map(n => n.id === id ? { ...n, is_read: true } : n);
        return {
          notifications: updated,
          unreadCount: updated.filter(n => !n.is_read).length
        };
      });
    }
  }
}));

export const useNotifications = () => {
  const { currentUser } = useLexStore();
  const { 
    notifications, 
    unreadCount, 
    urgentNotification, 
    addNotification, 
    setNotifications,
    clearUrgent,
    markAsRead
  } = useNotificationStore();

  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.firm_id) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('firm_id', currentUser.firm_id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error) setNotifications(data);
  }, [currentUser, setNotifications]);

  useEffect(() => {
    if (!currentUser?.firm_id) return;

    fetchNotifications();

    // Abonnement Temps Réel
    const channel = supabase
      .channel(`notifications:${currentUser.firm_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `firm_id=eq.${currentUser.firm_id}`
        },
        (payload) => {
          const newNotif = payload.new;
          addNotification(newNotif);

          // Toast standard pour toutes les notifs
          toast.info(newNotif.title, {
            description: newNotif.message,
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, fetchNotifications, addNotification]);

  return { notifications, unreadCount, urgentNotification, clearUrgent, markAsRead };
};

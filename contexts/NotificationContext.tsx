import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { 
  Notification, 
  UserNotificationPreferences, 
  NotificationContextType
} from '../types/notifications';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  onNavigateToEvent: (eventId: string) => void;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children, onNavigateToEvent }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<UserNotificationPreferences | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load user preferences
  const loadPreferences = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        console.error('Error loading notification preferences:', error);
        return;
      }

      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences
        const defaultPrefs = {
          user_id: user.id,
          in_app_enabled: true,
          push_enabled: false,
          email_enabled: true,
          default_reminder_minutes: 15
        };

        const { data: newPrefs, error: insertError } = await supabase
          .from('user_notification_preferences')
          .insert(defaultPrefs)
          .select()
          .single();

        if (insertError) {
          console.error('Error creating default preferences:', insertError);
        } else {
          setPreferences(newPrefs);
        }
      }
    } catch (error) {
      console.error('Error in loadPreferences:', error);
    }
  }, [user]);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read_at).length || 0);
    } catch (error) {
      console.error('Error in loadNotifications:', error);
    }
  }, [user]);

  // Request push notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';

    // Update user preferences
    if (granted && preferences) {
      await updatePreferences({ push_enabled: true });
    }

    return granted;
  }, [preferences]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error in markAsRead:', error);
    }
  }, [user]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
    }
  }, [user]);

  // Dismiss notification
  const dismiss = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error dismissing notification:', error);
        return;
      }

      // Update local state immediately for better UX
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if the dismissed notification was unread
      const dismissedNotification = notifications.find(n => n.id === notificationId);
      if (dismissedNotification && !dismissedNotification.read_at) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error in dismiss:', error);
    }
  }, [user, notifications]);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('dismissed_at', null);

      if (error) {
        console.error('Error clearing all notifications:', error);
        return;
      }

      // Update local state immediately for better UX
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error in clearAll:', error);
    }
  }, [user]);

  // Update user preferences
  const updatePreferences = useCallback(async (updates: Partial<UserNotificationPreferences>) => {
    if (!user || !preferences) return;

    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating preferences:', error);
        return;
      }

      setPreferences(data);
    } catch (error) {
      console.error('Error in updatePreferences:', error);
    }
  }, [user, preferences]);

  // Initialize when user changes
  useEffect(() => {
    if (user) {
      loadPreferences();
      loadNotifications();
    } else {
      setNotifications([]);
      setPreferences(null);
      setUnreadCount(0);
    }
  }, [user, loadPreferences, loadNotifications]);

  // Set up real-time subscription for notifications
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
            if (!newNotification.read_at) {
              setUnreadCount(prev => prev + 1);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotification = payload.new as Notification;
            setNotifications(prev => 
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedNotification = payload.old as Notification;
            setNotifications(prev => prev.filter(n => n.id !== deletedNotification.id));
            if (!deletedNotification.read_at) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    preferences,
    requestPermission,
    markAsRead,
    markAllAsRead,
    dismissNotification: dismiss,
    clearAll,
    updatePreferences,
    navigateToEvent: onNavigateToEvent
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

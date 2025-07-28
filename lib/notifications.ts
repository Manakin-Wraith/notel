import { supabase, getCurrentUser } from './supabase';
import type { Event } from '../types';
import type { Notification, Reminder, PushNotificationPayload, UserNotificationPreferences } from '../types/notifications';

export class NotificationService {
  private static instance: NotificationService;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private processedNotificationIds: Set<string> = new Set();

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Initialize service worker for push notifications
  async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Schedule notifications for an event
  async scheduleEventNotifications(event: Event, reminders: Reminder[]): Promise<void> {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const preferences = await this.getUserPreferences(user.id);
    if (!preferences) return;

    // Clear existing notifications for this event
    await this.clearEventNotifications(event.id);

    const eventStartTime = new Date(event.startDate);
    const notifications: Partial<Notification>[] = [];

    for (const reminder of reminders) {
      if (!reminder.enabled) continue;

      // Check if this notification type is enabled in user preferences
      if (reminder.type === 'in-app' && !preferences.in_app_enabled) continue;
      if (reminder.type === 'push' && !preferences.push_enabled) continue;
      if (reminder.type === 'email' && !preferences.email_enabled) continue;

      const scheduledFor = new Date(eventStartTime.getTime() - (reminder.minutes_before * 60 * 1000));
      
      // Don't schedule notifications in the past
      if (scheduledFor <= new Date()) continue;

      // Check quiet hours
      if (this.isInQuietHours(scheduledFor, preferences)) continue;

      const notification: Partial<Notification> = {
        user_id: user.id,
        event_id: event.id,
        type: reminder.type,
        title: this.generateNotificationTitle(event, reminder.minutes_before),
        message: this.generateNotificationMessage(event),
        scheduled_for: scheduledFor.toISOString()
      };

      notifications.push(notification);
    }

    if (notifications.length > 0) {
      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) {
        console.error('Error scheduling notifications:', error);
        throw error;
      }

      // Schedule push notifications if enabled
      for (const notification of notifications) {
        if (notification.type === 'push' && this.serviceWorkerRegistration) {
          await this.schedulePushNotification(notification as Notification);
        }
      }
    }
  }

  // Clear notifications for an event
  async clearEventNotifications(eventId: string): Promise<void> {
    const user = await getCurrentUser();
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .is('sent_at', null); // Only delete unsent notifications

    if (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  // Get user notification preferences
  async getUserPreferences(userId: string): Promise<UserNotificationPreferences | null> {
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user preferences:', error);
      return null;
    }

    return data;
  }

  // Check if time is within quiet hours
  private isInQuietHours(date: Date, preferences: UserNotificationPreferences): boolean {
    if (!preferences.quiet_hours_start || !preferences.quiet_hours_end) {
      return false;
    }

    const time = date.toTimeString().slice(0, 5); // HH:MM format
    const start = preferences.quiet_hours_start;
    const end = preferences.quiet_hours_end;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (start > end) {
      return time >= start || time <= end;
    }

    return time >= start && time <= end;
  }

  // Generate notification title
  private generateNotificationTitle(event: Event, minutesBefore: number): string {
    if (minutesBefore === 0) {
      return `${event.title} is starting now`;
    } else if (minutesBefore < 60) {
      return `${event.title} in ${minutesBefore} minutes`;
    } else if (minutesBefore < 1440) {
      const hours = Math.floor(minutesBefore / 60);
      return `${event.title} in ${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(minutesBefore / 1440);
      return `${event.title} in ${days} day${days > 1 ? 's' : ''}`;
    }
  }

  // Generate notification message
  private generateNotificationMessage(event: Event): string {
    const startTime = new Date(event.startDate).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    let message = `Scheduled for ${startTime}`;
    
    if (event.description) {
      message += ` • ${event.description.slice(0, 100)}${event.description.length > 100 ? '...' : ''}`;
    }

    return message;
  }

  // Schedule push notification via service worker
  private async schedulePushNotification(notification: Notification): Promise<void> {
    if (!this.serviceWorkerRegistration || !('serviceWorker' in navigator)) {
      return;
    }

    const payload: PushNotificationPayload = {
      title: notification.title,
      body: notification.message,
      icon: '/favicon.ico',
      tag: `event-${notification.event_id}`,
      data: {
        eventId: notification.event_id,
        url: `/?event=${notification.event_id}`
      }
    };

    // Send message to service worker to schedule the notification
    navigator.serviceWorker.ready.then(registration => {
      registration.active?.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        payload: {
          title: payload.title,
          body: payload.body,
          scheduledFor: notification.scheduled_for,
          data: payload.data
        }
      });
    });
  }

  // Process pending notifications (called periodically)
  async processPendingNotifications(): Promise<void> {
    const user = await getCurrentUser();
    if (!user) return;

    const now = new Date().toISOString();

    // Get notifications that should be sent now
    const { data: pendingNotifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .lte('scheduled_for', now)
      .is('sent_at', null)
      .is('dismissed_at', null)
      .limit(10); // Limit to prevent overwhelming

    if (error) {
      console.error('Error fetching pending notifications:', error);
      return;
    }



    // Use a static Set to track processed notifications across all processor runs
    if (!this.processedNotificationIds) {
      this.processedNotificationIds = new Set<string>();
    }
    
    for (const notification of pendingNotifications || []) {
      // Skip if already processed globally (not just in this batch)
      if (this.processedNotificationIds.has(notification.id)) {
        console.log(`⏭️ Skipping already processed notification: ${notification.title} (ID: ${notification.id})`);
        continue;
      }
      
      console.log(`🚀 Processing notification: ${notification.title} (ID: ${notification.id}, scheduled for ${notification.scheduled_for})`);
      
      try {
        // Add to processed set BEFORE processing to prevent race conditions
        this.processedNotificationIds.add(notification.id);
        
        // Send the notification first
        await this.sendNotification(notification);
        
        // Only mark as sent after successful processing
        await this.markNotificationAsSent(notification.id);
        
        console.log(`✅ Notification processed successfully: ${notification.title}`);
      } catch (error) {
        console.error(`❌ Error processing notification ${notification.title}:`, error);
        // Remove from processed set if there was an error
        this.processedNotificationIds.delete(notification.id);
      }
    }
  }

  // Send a notification
  private async sendNotification(notification: Notification): Promise<void> {
    try {
      if (notification.type === 'in-app') {
        // In-app notifications are handled by the NotificationContainer component
        // Already marked as sent in processPendingNotifications
        console.log('In-app notification sent:', notification.title);
      } else if (notification.type === 'push') {
        await this.sendPushNotification(notification);
      } else if (notification.type === 'email') {
        // Email notifications would be handled by your existing email service
        // await this.sendEmailNotification(notification);
        console.log('Email notification would be sent:', notification.title);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Send push notification
  private async sendPushNotification(notification: Notification): Promise<void> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const options: NotificationOptions = {
      body: notification.message,
      icon: '/favicon.ico',
      tag: `event-${notification.event_id}`,
      requireInteraction: true,
      data: {
        eventId: notification.event_id,
        notificationId: notification.id
      }
    };

    new Notification(notification.title, options);
    await this.markNotificationAsSent(notification.id);
  }

  // Mark notification as sent
  private async markNotificationAsSent(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as sent:', error);
    }
  }

  // Start notification processing interval
  startNotificationProcessor(): void {
    // Initial check
    this.processPendingNotifications();
    
    // Smart interval: check every 5 seconds for immediate notifications,
    // every 30 seconds for upcoming ones
    const smartProcessor = () => {
      this.processPendingNotifications();
      
      // Schedule next check based on upcoming notifications
      this.scheduleNextCheck();
    };
    
    // Start with frequent checks (every 5 seconds)
    setInterval(smartProcessor, 5000);
    
    // Also run a backup check every minute to catch any missed notifications
    setInterval(() => {
      this.processPendingNotifications();
    }, 60000);
  }
  
  // Schedule the next check based on upcoming notifications
  private async scheduleNextCheck(): Promise<void> {
    const user = await getCurrentUser();
    if (!user) return;
    
    const now = new Date();
    const nextMinute = new Date(now.getTime() + 60000); // 1 minute from now
    
    // Check if there are any notifications due in the next minute
    const { data: upcomingNotifications } = await supabase
      .from('notifications')
      .select('scheduled_for')
      .eq('user_id', user.id)
      .gte('scheduled_for', now.toISOString())
      .lte('scheduled_for', nextMinute.toISOString())
      .is('sent_at', null)
      .is('dismissed_at', null)
      .limit(1);
      
    // If there are upcoming notifications, check more frequently
    if (upcomingNotifications && upcomingNotifications.length > 0) {
      setTimeout(() => {
        this.processPendingNotifications();
      }, 2000); // Check again in 2 seconds
    }
  }
}

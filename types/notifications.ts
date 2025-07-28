// Notification system types
export type NotificationType = 'in-app' | 'push' | 'email';

export interface Reminder {
  type: NotificationType;
  minutes_before: number;
  enabled: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  event_id: string;
  type: NotificationType;
  title: string;
  message: string;
  scheduled_for: string;
  sent_at?: string;
  read_at?: string;
  dismissed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserNotificationPreferences {
  user_id: string;
  in_app_enabled: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  default_reminder_minutes: number;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  preferences: UserNotificationPreferences | null;
  requestPermission: () => Promise<boolean>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  updatePreferences: (preferences: Partial<UserNotificationPreferences>) => Promise<void>;
  navigateToEvent: (eventId: string) => void;
}

// Push notification payload
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    eventId: string;
    url: string;
  };
}

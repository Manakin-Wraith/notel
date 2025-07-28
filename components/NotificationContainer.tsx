import React, { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationToast from './NotificationToast';
import type { Notification } from '../types/notifications';

const NotificationContainer: React.FC = () => {
  const { notifications } = useNotifications();
  const [activeToasts, setActiveToasts] = useState<Notification[]>([]);

  useEffect(() => {
    // Show new unread notifications as toasts
    const newNotifications = notifications.filter(n => 
      !n.read_at && 
      !n.dismissed_at && 
      !activeToasts.some(toast => toast.id === n.id)
    );

    if (newNotifications.length > 0) {
      setActiveToasts(prev => [...prev, ...newNotifications.slice(0, 3)]); // Max 3 toasts
    }
  }, [notifications, activeToasts]);

  const handleDismissToast = (notificationId: string) => {
    setActiveToasts(prev => prev.filter(toast => toast.id !== notificationId));
  };

  return (
    <div className="fixed top-16 right-4 left-4 md:left-auto z-50 pointer-events-none">
      <div className="flex flex-col gap-3 max-w-sm w-full ml-auto">
        {activeToasts.map((notification, index) => (
          <div
            key={notification.id}
            className="pointer-events-auto"
            style={{
              transform: `translateY(${index * 4}px)`,
              zIndex: 50 - index
            }}
          >
            <NotificationToast
              notification={notification}
              onDismiss={handleDismissToast}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationContainer;

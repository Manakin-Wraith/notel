import React, { useEffect, useState } from 'react';
import type { Notification } from '../types/notifications';
import { useNotifications } from '../contexts/NotificationContext';
import XIcon from './icons/XIcon';
import CalendarIcon from './icons/CalendarIcon';

interface NotificationToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const { markAsRead, navigateToEvent } = useNotifications();

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300);
  };

  const handleClick = async () => {
    if (!notification.read_at) {
      await markAsRead(notification.id);
    }
    // Navigate to event details if this is an event notification
    if (notification.event_id) {
      navigateToEvent(notification.event_id);
    }
  };

  return (
    <div
      className={`
        w-full max-w-sm
        transform transition-all duration-300 ease-out
        ${isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
        }
      `}
    >
      <div
        onClick={handleClick}
        className="
          bg-gray-800 border border-gray-700 rounded-lg shadow-lg
          p-4 cursor-pointer hover:bg-gray-750 transition-colors
          backdrop-blur-sm bg-opacity-95
        "
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-blue-400" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <h4 className="text-sm font-medium text-white truncate pr-2">
                {notification.title}
              </h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
                className="
                  flex-shrink-0 p-1 rounded-md text-gray-400 
                  hover:text-white hover:bg-gray-700 transition-colors
                "
                aria-label="Dismiss notification"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm text-gray-300 mt-1 line-clamp-2">
              {notification.message}
            </p>

            {/* Time indicator */}
            <div className="flex items-center gap-2 mt-2">
              <div className="text-xs text-gray-500">
                {new Date(notification.scheduled_for).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              {!notification.read_at && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;

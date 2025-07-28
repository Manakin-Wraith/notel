import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationCenter from './NotificationCenter';
import BellIcon from './icons/BellIcon';

const NotificationBell: React.FC = () => {
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          relative p-2 rounded-md text-gray-400 hover:text-white 
          hover:bg-gray-700 transition-colors
        "
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <BellIcon className="w-5 h-5" />
        
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="
            absolute -top-1 -right-1 bg-blue-500 text-white text-xs 
            rounded-full min-w-[18px] h-[18px] flex items-center justify-center
            px-1 font-medium
          ">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationCenter 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
};

export default NotificationBell;

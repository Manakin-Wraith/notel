/**
 * CalendarLinkButton Component
 * Phase 1: Google Calendar link generation UI component
 */

import React, { useState } from 'react';
import type { Event } from '../types';
import { 
  openGoogleCalendar, 
  copyCalendarLinkToClipboard, 
  canCreateCalendarLink 
} from '../lib/calendarLinks';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import CheckIcon from './icons/CheckIcon';

interface CalendarLinkButtonProps {
  event: Event | Partial<Event>;
  variant?: 'primary' | 'secondary' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  showCopyOption?: boolean;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const CalendarLinkButton: React.FC<CalendarLinkButtonProps> = ({
  event,
  variant = 'secondary',
  size = 'md',
  showCopyOption = false,
  className = '',
  onSuccess,
  onError
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Check if the event has minimum required fields
  const canCreateLink = canCreateCalendarLink(event);

  if (!canCreateLink) {
    return null; // Don't render if event is invalid
  }

  const handleOpenCalendar = () => {
    try {
      openGoogleCalendar(event as Event);
      onSuccess?.();
      setShowDropdown(false);
    } catch (error) {
      const errorMessage = 'Failed to open Google Calendar';
      console.error(errorMessage, error);
      onError?.(errorMessage);
    }
  };

  const handleCopyLink = async () => {
    try {
      const success = await copyCalendarLinkToClipboard(event as Event);
      if (success) {
        setCopySuccess(true);
        onSuccess?.();
        setTimeout(() => {
          setCopySuccess(false);
          setShowDropdown(false);
        }, 2000);
      } else {
        throw new Error('Clipboard operation failed');
      }
    } catch (error) {
      const errorMessage = 'Failed to copy calendar link';
      console.error(errorMessage, error);
      onError?.(errorMessage);
    }
  };

  // Style variants
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100',
    minimal: 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
  };

  const sizeStyles = {
    sm: 'px-2 py-1 text-xs rounded',
    md: 'px-3 py-2 text-sm rounded-md',
    lg: 'px-4 py-2 text-base rounded-lg'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const buttonClasses = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  // Simple button without dropdown
  if (!showCopyOption) {
    return (
      <button
        onClick={handleOpenCalendar}
        className={buttonClasses}
        title="Add to Google Calendar"
      >
        <CalendarDaysIcon className={`${iconSizes[size]} mr-2`} />
        Add to Calendar
      </button>
    );
  }

  // Button with dropdown for copy option
  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={buttonClasses}
        title="Calendar options"
      >
        <CalendarDaysIcon className={`${iconSizes[size]} mr-2`} />
        Add to Calendar
        <svg className={`${iconSizes[size]} ml-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1">
              <button
                onClick={handleOpenCalendar}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <CalendarDaysIcon className="h-4 w-4 mr-3" />
                Open in Google Calendar
              </button>
              
              <button
                onClick={handleCopyLink}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                disabled={copySuccess}
              >
                {copySuccess ? (
                  <>
                    <CheckIcon className="h-4 w-4 mr-3 text-green-500" />
                    <span className="text-green-500">Link copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy calendar link
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CalendarLinkButton;

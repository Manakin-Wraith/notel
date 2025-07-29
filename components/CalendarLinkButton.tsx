/**
 * CalendarLinkButton Component
 * Phase 1: Google Calendar link generation UI component
 * Enhanced with Google branding and Notion-inspired design
 */

import React, { useState } from 'react';
import type { Event } from '../types';
import { 
  openGoogleCalendar, 
  copyCalendarLinkToClipboard, 
  canCreateCalendarLink 
} from '../lib/calendarLinks';
import GoogleCalendarIcon from './icons/GoogleCalendarIcon';
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

  // Enhanced Notion-inspired styling with Google branding
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed group';
  
  const variantStyles = {
    primary: 'bg-[#4285f4] hover:bg-[#3367d6] text-white shadow-sm hover:shadow-md border border-transparent',
    secondary: 'bg-gray-800/50 hover:bg-gray-700/60 text-gray-200 border border-gray-700/50 hover:border-gray-600/50 backdrop-blur-sm',
    minimal: 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40 border border-transparent hover:border-gray-700/30'
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
        <GoogleCalendarIcon className={`mr-2 group-hover:scale-105 transition-transform duration-200`} size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
        <span className="font-medium">Add to Google Calendar</span>
      </button>
    );
  }

  // Button with dropdown for copy option
  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={buttonClasses}
        title="Google Calendar options"
      >
        <GoogleCalendarIcon className={`mr-2 group-hover:scale-105 transition-transform duration-200`} size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
        <span className="font-medium">Add to Google Calendar</span>
        <svg className={`${iconSizes[size]} ml-2 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          
          {/* Enhanced dropdown menu */}
          <div className="absolute right-0 mt-2 w-56 bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl ring-1 ring-gray-700/50 z-20 border border-gray-700/30">
            <div className="py-2">
              <button
                onClick={handleOpenCalendar}
                className="flex items-center w-full px-4 py-3 text-sm text-gray-200 hover:bg-gray-800/60 hover:text-white transition-all duration-150 group"
              >
                <GoogleCalendarIcon className="mr-3 group-hover:scale-105 transition-transform duration-200" size={16} />
                <span className="font-medium">Open in Google Calendar</span>
              </button>
              
              <button
                onClick={handleCopyLink}
                className="flex items-center w-full px-4 py-3 text-sm text-gray-200 hover:bg-gray-800/60 hover:text-white transition-all duration-150 group disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={copySuccess}
              >
                {copySuccess ? (
                  <>
                    <CheckIcon className="h-4 w-4 mr-3 text-green-400" />
                    <span className="text-green-400 font-medium">Link copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-3 group-hover:scale-105 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">Copy calendar link</span>
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

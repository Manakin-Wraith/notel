/**
 * CalendarLinkButton Component
 * Phase 1: Google Calendar link generation UI component
 * Redesigned for minimalist, frictionless Notion-inspired UI/UX
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
    } catch (error) {
      const errorMessage = 'Failed to open Google Calendar';
      console.error(errorMessage, error);
      onError?.(errorMessage);
    }
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the main button
    try {
      const success = await copyCalendarLinkToClipboard(event as Event);
      if (success) {
        setCopySuccess(true);
        onSuccess?.();
        setTimeout(() => {
          setCopySuccess(false);
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

  // Minimalist Notion-inspired styling for inline button group
  const baseStyles = 'inline-flex items-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-[#4285f4] hover:bg-[#3367d6] text-white',
    secondary: 'bg-gray-800/40 hover:bg-gray-700/50 text-gray-300 hover:text-white border border-gray-700/30 hover:border-gray-600/40',
    minimal: 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
  };

  const sizeStyles = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const mainButtonStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} px-3 py-1.5 rounded-l-md ${!showCopyOption ? 'rounded-r-md' : ''}`;
  const copyButtonStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} px-2 py-1.5 rounded-r-md border-l border-gray-600/30 ml-px`;

  // Minimalist inline button group - Notion-inspired design
  if (!showCopyOption) {
    return (
      <button
        onClick={handleOpenCalendar}
        className={`${mainButtonStyles} ${className}`}
        title="Add to Google Calendar"
      >
        <GoogleCalendarIcon className="mr-2" size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
        <span>Add to Google Calendar</span>
      </button>
    );
  }

  // Elegant split-button design for copy option
  return (
    <div className={`inline-flex ${className}`}>
      {/* Main button - opens Google Calendar */}
      <button
        onClick={handleOpenCalendar}
        className={mainButtonStyles}
        title="Open in Google Calendar"
      >
        <GoogleCalendarIcon className="mr-2" size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
        <span>Add to Google Calendar</span>
      </button>
      
      {/* Copy button - subtle and minimal */}
      <button
        onClick={handleCopyLink}
        className={copyButtonStyles}
        title={copySuccess ? "Link copied!" : "Copy calendar link"}
        disabled={copySuccess}
      >
        {copySuccess ? (
          <CheckIcon className="h-4 w-4 text-green-400" />
        ) : (
          <svg className="h-4 w-4 opacity-70 hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default CalendarLinkButton;

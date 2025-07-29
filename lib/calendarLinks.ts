/**
 * Google Calendar Link Generation Utility
 * Phase 1: Basic calendar link generation for Notel events
 */

import type { Event } from '../types';

/**
 * Formats a date for Google Calendar URL format (YYYYMMDDTHHMMSSZ)
 */
export const formatDateForGoogle = (dateString: string, isAllDay: boolean = false): string => {
  const date = new Date(dateString);
  
  if (isAllDay) {
    // For all-day events, use YYYYMMDD format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  } else {
    // For timed events, use YYYYMMDDTHHMMSSZ format (UTC)
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }
};

/**
 * Creates a Google Calendar event URL from a Notel event
 */
export const createGoogleCalendarLink = (event: Event): string => {
  const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  
  // Format dates for Google Calendar
  const startDate = formatDateForGoogle(event.startDate, event.allDay);
  let endDate: string;
  
  if (event.endDate) {
    endDate = formatDateForGoogle(event.endDate, event.allDay);
  } else if (event.allDay) {
    // For all-day events without end date, make it a single day
    const nextDay = new Date(event.startDate);
    nextDay.setDate(nextDay.getDate() + 1);
    endDate = formatDateForGoogle(nextDay.toISOString(), true);
  } else {
    // For timed events without end date, make it 1 hour long
    const endTime = new Date(event.startDate);
    endTime.setHours(endTime.getHours() + 1);
    endDate = formatDateForGoogle(endTime.toISOString(), false);
  }
  
  // Build the dates parameter
  const dates = event.allDay ? `${startDate}/${endDate}` : `${startDate}/${endDate}`;
  
  // Prepare description with Notel branding
  let description = '';
  if (event.description) {
    description = `${event.description}\n\n`;
  }
  description += `Created with Notel - Your thoughts, organized\n${window.location.origin}`;
  
  // Build URL parameters
  const params = new URLSearchParams({
    text: event.title || 'Untitled Event',
    dates: dates,
    details: description,
    // Add location if we have linkedPageId (could be enhanced later)
    ...(event.linkedPageId && { location: `Notel Page: ${event.linkedPageId}` })
  });
  
  return `${baseUrl}&${params.toString()}`;
};

/**
 * Opens Google Calendar with the event pre-filled
 */
export const openGoogleCalendar = (event: Event): void => {
  const calendarUrl = createGoogleCalendarLink(event);
  window.open(calendarUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Copies Google Calendar link to clipboard
 */
export const copyCalendarLinkToClipboard = async (event: Event): Promise<boolean> => {
  try {
    const calendarUrl = createGoogleCalendarLink(event);
    await navigator.clipboard.writeText(calendarUrl);
    return true;
  } catch (error) {
    console.error('Failed to copy calendar link:', error);
    return false;
  }
};

/**
 * Validates if an event has the minimum required fields for calendar creation
 */
export const canCreateCalendarLink = (event: Partial<Event>): boolean => {
  return !!(event.title && event.startDate);
};

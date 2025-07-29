/**
 * Tests for Google Calendar Link Generation Utility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  formatDateForGoogle,
  createGoogleCalendarLink,
  openGoogleCalendar,
  copyCalendarLinkToClipboard,
  canCreateCalendarLink
} from '../../lib/calendarLinks';
import type { Event } from '../../types';

// Mock window.open and navigator.clipboard
const mockWindowOpen = vi.fn();
const mockClipboardWriteText = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  
  // Mock window.open
  Object.defineProperty(window, 'open', {
    value: mockWindowOpen,
    writable: true
  });
  
  // Mock navigator.clipboard
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: mockClipboardWriteText
    },
    writable: true
  });
  
  // Mock window.location
  Object.defineProperty(window, 'location', {
    value: {
      origin: 'https://notel-wine.vercel.app'
    },
    writable: true
  });
});

describe('formatDateForGoogle', () => {
  it('should format all-day events correctly', () => {
    const date = '2024-01-15T10:30:00.000Z';
    const result = formatDateForGoogle(date, true);
    expect(result).toBe('20240115');
  });

  it('should format timed events correctly', () => {
    const date = '2024-01-15T10:30:00.000Z';
    const result = formatDateForGoogle(date, false);
    expect(result).toBe('20240115T103000Z');
  });

  it('should handle different time zones consistently', () => {
    const date = '2024-12-25T23:59:59.000Z';
    const result = formatDateForGoogle(date, false);
    expect(result).toBe('20241225T235959Z');
  });
});

describe('createGoogleCalendarLink', () => {
  const baseEvent: Event = {
    id: '1',
    title: 'Test Meeting',
    description: 'Important meeting about project updates',
    startDate: '2024-01-15T10:00:00.000Z',
    endDate: '2024-01-15T11:00:00.000Z',
    allDay: false,
    status: 'scheduled',
    priority: 'medium',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  it('should create a valid Google Calendar link for timed events', () => {
    const result = createGoogleCalendarLink(baseEvent);
    
    expect(result).toContain('https://calendar.google.com/calendar/render?action=TEMPLATE');
    expect(result).toContain('text=Test+Meeting');
    expect(result).toContain('dates=20240115T100000Z%2F20240115T110000Z');
    expect(result).toContain('details=Important+meeting+about+project+updates');
    expect(result).toContain('Created+with+Notel');
  });

  it('should create a valid Google Calendar link for all-day events', () => {
    const allDayEvent: Event = {
      ...baseEvent,
      allDay: true,
      startDate: '2024-01-15T00:00:00.000Z',
      endDate: '2024-01-16T00:00:00.000Z'
    };
    
    const result = createGoogleCalendarLink(allDayEvent);
    
    expect(result).toContain('dates=20240115%2F20240116');
  });

  it('should handle events without end date for timed events', () => {
    const eventWithoutEndDate: Event = {
      ...baseEvent,
      endDate: undefined
    };
    
    const result = createGoogleCalendarLink(eventWithoutEndDate);
    
    // Should default to 1 hour duration
    expect(result).toContain('dates=20240115T100000Z%2F20240115T110000Z');
  });

  it('should handle events without end date for all-day events', () => {
    const allDayEventWithoutEnd: Event = {
      ...baseEvent,
      allDay: true,
      startDate: '2024-01-15T00:00:00.000Z',
      endDate: undefined
    };
    
    const result = createGoogleCalendarLink(allDayEventWithoutEnd);
    
    // Should default to next day
    expect(result).toContain('dates=20240115%2F20240116');
  });

  it('should handle events without description', () => {
    const eventWithoutDescription: Event = {
      ...baseEvent,
      description: undefined
    };
    
    const result = createGoogleCalendarLink(eventWithoutDescription);
    
    expect(result).toContain('details=Created+with+Notel');
    expect(result).not.toContain('undefined');
  });

  it('should include linked page information when available', () => {
    const eventWithLinkedPage: Event = {
      ...baseEvent,
      linkedPageId: 'page-123'
    };
    
    const result = createGoogleCalendarLink(eventWithLinkedPage);
    
    expect(result).toContain('location=Notel+Page%3A+page-123');
  });

  it('should handle empty or untitled events', () => {
    const untitledEvent: Event = {
      ...baseEvent,
      title: ''
    };
    
    const result = createGoogleCalendarLink(untitledEvent);
    
    expect(result).toContain('text=Untitled+Event');
  });
});

describe('openGoogleCalendar', () => {
  it('should open Google Calendar in a new tab', () => {
    const event: Event = {
      id: '1',
      title: 'Test Event',
      startDate: '2024-01-15T10:00:00.000Z',
      allDay: false,
      status: 'scheduled',
      priority: 'medium',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    };
    
    openGoogleCalendar(event);
    
    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('https://calendar.google.com/calendar/render?action=TEMPLATE'),
      '_blank',
      'noopener,noreferrer'
    );
  });
});

describe('copyCalendarLinkToClipboard', () => {
  it('should copy calendar link to clipboard successfully', async () => {
    mockClipboardWriteText.mockResolvedValue(undefined);
    
    const event: Event = {
      id: '1',
      title: 'Test Event',
      startDate: '2024-01-15T10:00:00.000Z',
      allDay: false,
      status: 'scheduled',
      priority: 'medium',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    };
    
    const result = await copyCalendarLinkToClipboard(event);
    
    expect(result).toBe(true);
    expect(mockClipboardWriteText).toHaveBeenCalledWith(
      expect.stringContaining('https://calendar.google.com/calendar/render?action=TEMPLATE')
    );
  });

  it('should handle clipboard write failure', async () => {
    mockClipboardWriteText.mockRejectedValue(new Error('Clipboard access denied'));
    
    const event: Event = {
      id: '1',
      title: 'Test Event',
      startDate: '2024-01-15T10:00:00.000Z',
      allDay: false,
      status: 'scheduled',
      priority: 'medium',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    };
    
    const result = await copyCalendarLinkToClipboard(event);
    
    expect(result).toBe(false);
  });
});

describe('canCreateCalendarLink', () => {
  it('should return true for valid events', () => {
    const validEvent = {
      title: 'Valid Event',
      startDate: '2024-01-15T10:00:00.000Z'
    };
    
    expect(canCreateCalendarLink(validEvent)).toBe(true);
  });

  it('should return false for events without title', () => {
    const eventWithoutTitle = {
      startDate: '2024-01-15T10:00:00.000Z'
    };
    
    expect(canCreateCalendarLink(eventWithoutTitle)).toBe(false);
  });

  it('should return false for events without start date', () => {
    const eventWithoutStartDate = {
      title: 'Event Without Date'
    };
    
    expect(canCreateCalendarLink(eventWithoutStartDate)).toBe(false);
  });

  it('should return false for completely empty events', () => {
    expect(canCreateCalendarLink({})).toBe(false);
  });
});

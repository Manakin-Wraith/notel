/**
 * CalendarLinkButton Component Tests
 * Tests for enhanced Google Calendar link generation UI component with Google branding
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CalendarLinkButton from '../../components/CalendarLinkButton';
import * as calendarLinks from '../../lib/calendarLinks';
import type { Event } from '../../types';

// Mock the calendar links module
vi.mock('../../lib/calendarLinks', () => ({
  openGoogleCalendar: vi.fn(),
  copyCalendarLinkToClipboard: vi.fn(),
  canCreateCalendarLink: vi.fn()
}));

const mockEvent: Event = {
  id: '1',
  title: 'Test Meeting',
  description: 'Important meeting',
  startDate: '2024-01-15T10:00:00.000Z',
  endDate: '2024-01-15T11:00:00.000Z',
  allDay: false,
  status: 'scheduled',
  priority: 'medium',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
};

beforeEach(() => {
  vi.clearAllMocks();
  (calendarLinks.canCreateCalendarLink as any).mockReturnValue(true);
});

describe('CalendarLinkButton', () => {
  it('should render simple button when showCopyOption is false', () => {
    render(<CalendarLinkButton event={mockEvent} />);
    
    const button = screen.getByRole('button', { name: /add to google calendar/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', 'Add to Google Calendar');
  });

  it('should not render when event cannot create calendar link', () => {
    (calendarLinks.canCreateCalendarLink as any).mockReturnValue(false);
    
    const { container } = render(<CalendarLinkButton event={mockEvent} />);
    expect(container.firstChild).toBeNull();
  });

  it('should call openGoogleCalendar when simple button is clicked', () => {
    const onSuccess = vi.fn();
    
    render(<CalendarLinkButton event={mockEvent} onSuccess={onSuccess} />);
    
    const button = screen.getByRole('button', { name: /add to google calendar/i });
    fireEvent.click(button);
    
    expect(calendarLinks.openGoogleCalendar).toHaveBeenCalledWith(mockEvent);
    expect(onSuccess).toHaveBeenCalled();
  });

  it('should handle errors when opening calendar fails', () => {
    const onError = vi.fn();
    (calendarLinks.openGoogleCalendar as any).mockImplementation(() => {
      throw new Error('Failed to open');
    });
    
    render(<CalendarLinkButton event={mockEvent} onError={onError} />);
    
    const button = screen.getByRole('button', { name: /add to google calendar/i });
    fireEvent.click(button);
    
    expect(onError).toHaveBeenCalledWith('Failed to open Google Calendar');
  });

  it('should render dropdown when showCopyOption is true', () => {
    render(<CalendarLinkButton event={mockEvent} showCopyOption={true} />);
    
    const button = screen.getByRole('button', { name: /add to google calendar/i });
    expect(button).toBeInTheDocument();
    
    // Click to open dropdown
    fireEvent.click(button);
    
    expect(screen.getByText('Open in Google Calendar')).toBeInTheDocument();
    expect(screen.getByText('Copy calendar link')).toBeInTheDocument();
  });

  it('should open Google Calendar from dropdown', () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    (calendarLinks.openGoogleCalendar as any).mockImplementation(() => {
      throw new Error('Failed to open');
    });
    
    render(<CalendarLinkButton event={mockEvent} showCopyOption={true} onSuccess={onSuccess} onError={onError} />);
    
    // Open dropdown
    const button = screen.getByRole('button', { name: /add to google calendar/i });
    fireEvent.click(button);
    
    // Click open calendar option
    const openOption = screen.getByText('Open in Google Calendar');
    fireEvent.click(openOption);
    
    expect(calendarLinks.openGoogleCalendar).toHaveBeenCalledWith(mockEvent);
    expect(onError).toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should copy calendar link from dropdown', async () => {
    (calendarLinks.copyCalendarLinkToClipboard as any).mockResolvedValue(true);
    const onSuccess = vi.fn();
    
    render(<CalendarLinkButton event={mockEvent} showCopyOption={true} onSuccess={onSuccess} />);
    
    // Open dropdown
    const button = screen.getByRole('button', { name: /add to google calendar/i });
    fireEvent.click(button);
    
    // Click copy option
    const copyOption = screen.getByText('Copy calendar link');
    fireEvent.click(copyOption);
    
    expect(calendarLinks.copyCalendarLinkToClipboard).toHaveBeenCalledWith(mockEvent);
    
    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText('Link copied!')).toBeInTheDocument();
    });
    
    expect(onSuccess).toHaveBeenCalled();
  });

  it('should handle copy failure', async () => {
    (calendarLinks.copyCalendarLinkToClipboard as any).mockResolvedValue(false);
    const onError = vi.fn();
    
    render(<CalendarLinkButton event={mockEvent} showCopyOption={true} onError={onError} />);
    
    // Open dropdown
    const button = screen.getByRole('button', { name: /add to google calendar/i });
    fireEvent.click(button);
    
    // Click copy option
    const copyOption = screen.getByText('Copy calendar link');
    fireEvent.click(copyOption);
    
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Failed to copy calendar link');
    });
  });

  it('should close dropdown when clicking backdrop', () => {
    render(<CalendarLinkButton event={mockEvent} showCopyOption={true} />);
    
    // Open dropdown
    const button = screen.getByRole('button', { name: /add to google calendar/i });
    fireEvent.click(button);
    
    expect(screen.getByText('Open in Google Calendar')).toBeInTheDocument();
    
    // Click backdrop
    const backdrop = document.querySelector('.fixed.inset-0');
    fireEvent.click(backdrop!);
    
    expect(screen.queryByText('Open in Google Calendar')).not.toBeInTheDocument();
  });

  it('should apply different variants correctly', () => {
    const { rerender } = render(<CalendarLinkButton event={mockEvent} variant="primary" />);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-[#4285f4]');
    
    rerender(<CalendarLinkButton event={mockEvent} variant="secondary" />);
    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-800/50');
    
    rerender(<CalendarLinkButton event={mockEvent} variant="minimal" />);
    button = screen.getByRole('button');
    expect(button).toHaveClass('text-gray-400');
  });

  it('should apply different sizes correctly', () => {
    const { rerender } = render(<CalendarLinkButton event={mockEvent} size="sm" />);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('px-2', 'py-1', 'text-xs');
    
    rerender(<CalendarLinkButton event={mockEvent} size="md" />);
    button = screen.getByRole('button');
    expect(button).toHaveClass('px-3', 'py-2', 'text-sm');
    
    rerender(<CalendarLinkButton event={mockEvent} size="lg" />);
    button = screen.getByRole('button');
    expect(button).toHaveClass('px-4', 'py-2', 'text-base');
  });

  it('should apply custom className', () => {
    render(<CalendarLinkButton event={mockEvent} className="custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should work with partial events that have required fields', () => {
    const partialEvent = {
      title: 'Partial Event',
      startDate: '2024-01-15T10:00:00.000Z'
    };
    
    render(<CalendarLinkButton event={partialEvent} />);
    
    const button = screen.getByRole('button', { name: /add to google calendar/i });
    fireEvent.click(button);
    
    expect(calendarLinks.openGoogleCalendar).toHaveBeenCalledWith(partialEvent);
  });
});

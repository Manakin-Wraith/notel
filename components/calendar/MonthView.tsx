
import React, { useMemo, useState } from 'react';
import type { Event } from '../../types';
import { getMonthGrid, isSameDay } from './calendar-utils';
import PlusIcon from '../icons/PlusIcon';
import CalendarEvent from './CalendarEvent';


interface MonthViewProps {
  events: Event[];
  currentDate: Date;
  onAddEvent: (eventData: Partial<Event>) => void;
  onDeleteEvent: (id: string) => void;
  onUpdateEvent: (id: string, updates: Partial<Event>) => void;
  onSelectEvent: (id: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MonthView: React.FC<MonthViewProps> = ({ events, currentDate, onAddEvent, onDeleteEvent, onUpdateEvent, onSelectEvent }) => {
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);

  const monthGrid = useMemo(() => getMonthGrid(currentDate), [currentDate]);

  const getDayEvents = (date: Date) => {
    return events.filter(event => {
      return isSameDay(new Date(event.startDate), date);
    });
  };

  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    setDraggedEventId(eventId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedEventId(null);
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (draggedEventId) {
      const newDate = date.toISOString();
      onUpdateEvent(draggedEventId, { startDate: newDate });
      setDraggedEventId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (draggedEventId) {
      setDragOverDate(date);
    }
  };

  const handleAddEvent = (date: Date) => {
    const dateString = date.toISOString();
    onAddEvent({
      title: 'New Event',
      startDate: dateString,
      allDay: true,
      status: 'scheduled',
      priority: 'medium'
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Weekday headers - responsive */}
      <div className="grid grid-cols-7 text-center text-xs md:text-sm font-semibold text-gray-400 border-b border-white/10">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-2 md:py-3">
            {/* Show abbreviated on mobile, full on desktop */}
            <span className="md:hidden">{day.charAt(0)}</span>
            <span className="hidden md:inline">{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid - mobile optimized */}
      <div className="calendar-grid flex-1 grid grid-cols-7 gap-px bg-white/5">
        {monthGrid.flat().map(({ date, isCurrentMonth }, index) => {
          const dayEvents = getDayEvents(date);
          const isToday = isSameDay(date, new Date());
          const isDragOver = dragOverDate ? isSameDay(date, dragOverDate) : false;

          return (
            <div
              key={index}
              className={`calendar-day-cell bg-gray-900/50 p-1 md:p-2 h-16 md:h-24 lg:h-32 flex flex-col group relative touch-manipulation ${
                isCurrentMonth ? '' : 'is-other-month opacity-50'
              } ${isDragOver ? 'bg-purple-500/20' : ''} hover:bg-white/5 transition-colors`}
              onDrop={(e) => handleDrop(e, date)}
              onDragOver={(e) => handleDragOver(e, date)}
              onDragLeave={() => setDragOverDate(null)}
            >
              {/* Date number and add button */}
              <div className="flex justify-between items-start mb-1">
                <span className={`text-xs md:text-sm font-semibold leading-none ${
                  isToday
                    ? 'bg-purple-600 text-white rounded-full flex items-center justify-center w-5 h-5 md:w-6 md:h-6 text-xs'
                    : isCurrentMonth ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  {date.getDate()}
                </span>
                {isCurrentMonth && (
                  <button
                    onClick={() => handleAddEvent(date)}
                    className="add-event-btn p-1 text-gray-500 hover:text-white hover:bg-white/20 rounded-full opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity touch-manipulation"
                    aria-label="Add event"
                  >
                    <PlusIcon className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                )}
              </div>

              {/* Events container - mobile optimized */}
              <div className="flex-1 min-h-0 space-y-0.5 overflow-hidden">
                {dayEvents.slice(0, 2).map((event) => (
                  <CalendarEvent
                    key={event.id}
                    event={event}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDelete={onDeleteEvent}
                    onSelect={onSelectEvent}
                  />
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-400 px-1 py-0.5 bg-gray-800/50 rounded text-center">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;

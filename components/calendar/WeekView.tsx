
import React, { useMemo, useState } from 'react';
import type { Event } from '../../types';
import { getWeekGrid, isSameDay } from './calendar-utils';
import CalendarEvent from './CalendarEvent';
import PlusIcon from '../icons/PlusIcon';

interface WeekViewProps {
  events: Event[];
  currentDate: Date;
  onAddEvent: (eventData: Partial<Event>) => void;
  onDeleteEvent: (id: string) => void;
  onUpdateEvent: (id: string, updates: Partial<Event>) => void;
  onSelectEvent: (id: string) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ events, currentDate, onAddEvent, onDeleteEvent, onUpdateEvent, onSelectEvent }) => {
    const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
    const [dragOverDate, setDragOverDate] = useState<Date | null>(null);

    const weekGrid = useMemo(() => getWeekGrid(currentDate), [currentDate]);
    
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
        setDragOverDate(null);
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
        <div className="flex-1 grid grid-cols-7 gap-px bg-white/10 border border-white/10 rounded-lg overflow-hidden">
            {weekGrid.map(day => {
                const dayEvents = getDayEvents(day);
                const isToday = isSameDay(day, new Date());
                const isDragOver = dragOverDate ? isSameDay(day, dragOverDate) : false;

                return (
                    <div
                        key={day.toISOString().split('T')[0]}
                        className={`bg-[#1a1a1a] flex flex-col ${isDragOver ? 'bg-purple-500/20' : ''}`}
                        onDrop={(e) => handleDrop(e, day)}
                        onDragOver={(e) => handleDragOver(e, day)}
                        onDragLeave={() => setDragOverDate(null)}
                    >
                        <div className="p-3 border-b border-white/10 flex items-center justify-between">
                             <div className="text-center">
                                <p className={`text-xs uppercase font-semibold ${isToday ? 'text-purple-400' : 'text-gray-400'}`}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                <p className={`text-2xl font-bold ${isToday ? 'text-white' : 'text-gray-300'}`}>{day.getDate()}</p>
                            </div>
                             <button onClick={() => handleAddEvent(day)} className="p-1 text-gray-500 hover:text-white hover:bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Add event">
                                <PlusIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 space-y-1 overflow-y-auto">
                            {dayEvents.map(event => (
                                <CalendarEvent
                                    key={event.id}
                                    event={event}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                    onSelect={onSelectEvent}
                                    onDelete={onDeleteEvent}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default WeekView;

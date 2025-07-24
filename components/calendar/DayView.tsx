

import React, { useMemo } from 'react';
import type { Event } from '../../types';
import { isSameDay } from './calendar-utils';
import PlusIcon from '../icons/PlusIcon';
import CalendarDaysIcon from '../icons/CalendarDaysIcon';
import TrashIcon from '../icons/TrashIcon';

interface DayViewProps {
  events: Event[];
  currentDate: Date;
  onAddEvent: (eventData: Partial<Event>) => void;
  onDeleteEvent: (id: string) => void;
  onSelectEvent: (id: string) => void;
}

const DayView: React.FC<DayViewProps> = ({ events, currentDate, onAddEvent, onDeleteEvent, onSelectEvent }) => {

    const dayEvents = useMemo(() => {
        return events.filter(event => {
            return isSameDay(new Date(event.startDate), currentDate);
        });
    }, [events, currentDate]);

    const handleAddEvent = () => {
        const dateString = currentDate.toISOString();
        onAddEvent({
            title: 'New Event',
            startDate: dateString,
            allDay: true,
            status: 'scheduled',
            priority: 'medium'
        });
    };

    return (
        <div className="flex-1 bg-black/20 backdrop-blur-lg border border-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-gray-200">
                    Tasks for {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </h3>
                <button onClick={handleAddEvent} className="flex items-center gap-2 p-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors">
                    <PlusIcon className="w-5 h-5" />
                    Add Event
                </button>
            </div>
                <div className="space-y-3">
                    {dayEvents.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No events scheduled for this day</p>
                    ) : (
                        dayEvents.map(event => (
                            <div key={event.id} className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/70 transition-colors group">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                        <CalendarDaysIcon className="w-6 h-6 text-gray-300 mt-0.5" />
                                        <div className="flex-1">
                                            <h3 className="text-white font-medium mb-1 cursor-pointer hover:text-purple-400" onClick={() => onSelectEvent(event.id)}>
                                                {event.title}
                                            </h3>
                                            {event.description && (
                                                <p className="text-sm text-gray-300 mb-2">{event.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                                <span>
                                                    {event.status === 'scheduled' && '📅 Scheduled'}
                                                    {event.status === 'completed' && '✅ Completed'}
                                                    {event.status === 'cancelled' && '❌ Cancelled'}
                                                </span>
                                                <span>
                                                    {event.priority === 'high' && '🔴 High'}
                                                    {event.priority === 'medium' && '🟡 Medium'}
                                                    {event.priority === 'low' && '🟢 Low'}
                                                </span>
                                                {event.allDay ? (
                                                    <span>All Day</span>
                                                ) : (
                                                    <span>{new Date(event.startDate).toLocaleTimeString()}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => onDeleteEvent(event.id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                                        aria-label="Delete event"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
        </div>
    );
};

export default DayView;
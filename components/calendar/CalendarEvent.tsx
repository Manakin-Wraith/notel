

import React from 'react';
import type { Event } from '../../types';
import CalendarDaysIcon from '../icons/CalendarDaysIcon';
import TrashIcon from '../icons/TrashIcon';

interface CalendarEventProps {
  event: Event;
  onDragStart: (e: React.DragEvent, eventId: string) => void;
  onDragEnd: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

const statusColors = {
    'scheduled': 'bg-blue-500/80',
    'completed': 'bg-green-500/80',
    'cancelled': 'bg-red-500/80'
};

const priorityColors = {
    'low': 'border-gray-400/50',
    'medium': 'border-yellow-400/50',
    'high': 'border-red-400/50'
};

const CalendarEvent: React.FC<CalendarEventProps> = ({ event, onDragStart, onDragEnd, onSelect, onDelete }) => {

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(event.id);
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(event.id);
    };

    return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, event.id)}
      onDragEnd={onDragEnd}
      onClick={handleClick}
      className={`group relative cursor-pointer p-1.5 md:p-2 rounded-md text-xs md:text-sm border-l-2 transition-all duration-200 ${
        statusColors[event.status]
      } ${priorityColors[event.priority]} hover:scale-[1.02] hover:shadow-lg`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <CalendarDaysIcon className="w-3 h-3 md:w-4 md:h-4 text-gray-300 flex-shrink-0" />
          <span className="text-white font-medium truncate leading-tight">
            {event.title || 'Untitled Event'}
          </span>
        </div>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 rounded transition-all"
          aria-label="Delete event"
        >
          <TrashIcon className="w-3 h-3 text-red-400" />
        </button>
      </div>
      {event.description && (
        <div className="mt-1 text-xs text-gray-400 truncate">
          {event.description}
        </div>
      )}
    </div>
  );
};

export default CalendarEvent;

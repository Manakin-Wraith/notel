

import React from 'react';
import type { Page } from '../../types';
import PageIcon from '../icons/PageIcon';
import TrashIcon from '../icons/TrashIcon';

interface CalendarEventProps {
  page: Page;
  onDragStart: (e: React.DragEvent, pageId: string) => void;
  onSelectPage: (id: string) => void;
  onDeletePage: (id: string) => void;
  isDragging: boolean;
}

const statusColors = {
    'todo': 'bg-gray-500/80',
    'in-progress': 'bg-yellow-500/80',
    'done': 'bg-green-500/80'
};

const CalendarEvent: React.FC<CalendarEventProps> = ({ page, onDragStart, onSelectPage, onDeletePage, isDragging }) => {

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDeletePage(page.id);
    };

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, page.id)}
            onClick={() => onSelectPage(page.id)}
            className={`group w-full flex items-center gap-2 p-1.5 rounded-md text-left text-xs font-semibold cursor-pointer transition-all ${isDragging ? 'opacity-30 scale-95' : 'opacity-100'} ${page.status ? statusColors[page.status] : 'bg-gray-500/80'} hover:opacity-80`}
            title={page.title}
        >
            <PageIcon icon={page.icon} className="w-4 h-4 flex-shrink-0 text-white/80" />
            <span className="flex-1 truncate text-white">{page.title}</span>
            <button onClick={handleDelete} className="p-0.5 text-white/70 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-white/20 rounded" aria-label="Delete page">
                <TrashIcon className="w-3 h-3" />
            </button>
        </div>
    );
};

export default CalendarEvent;

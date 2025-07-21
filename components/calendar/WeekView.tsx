
import React, { useMemo, useState } from 'react';
import type { Page } from '../../types';
import { getWeekGrid, isSameDay } from './calendar-utils';
import CalendarEvent from './CalendarEvent';
import PlusIcon from '../icons/PlusIcon';

interface WeekViewProps {
  pages: Page[];
  currentDate: Date;
  onAddPage: (initialData: Partial<Page>, openInEditor?: boolean) => void;
  onDeletePage: (id: string) => void;
  onUpdateDate: (id: string, date: string | null) => void;
  onSelectPage: (id: string) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ pages, currentDate, onAddPage, onDeletePage, onUpdateDate, onSelectPage }) => {
    const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
    const [dragOverDate, setDragOverDate] = useState<Date | null>(null);

    const weekGrid = useMemo(() => getWeekGrid(currentDate), [currentDate]);
    
    const pagesByDate = useMemo(() => {
        const map = new Map<string, Page[]>();
        pages.forEach(page => {
            const dateKey = page.dueDate!.split('T')[0];
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)!.push(page);
        });
        return map;
    }, [pages]);

    const handleDragStart = (e: React.DragEvent, pageId: string) => {
        setDraggedPageId(pageId);
        e.dataTransfer.setData('text/plain', pageId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (e: React.DragEvent, date: Date) => {
        e.preventDefault();
        if (draggedPageId) {
            onUpdateDate(draggedPageId, date.toISOString());
        }
        setDraggedPageId(null);
        setDragOverDate(null);
    };
    
    const handleDragOver = (e: React.DragEvent, date: Date) => {
        e.preventDefault();
        if (draggedPageId) {
            setDragOverDate(date);
        }
    };

    const handleAdd = (date: Date) => {
        onAddPage({ dueDate: date.toISOString(), status: 'todo' }, true);
    };

    return (
        <div className="flex-1 grid grid-cols-7 gap-px bg-white/10 border border-white/10 rounded-lg overflow-hidden">
            {weekGrid.map(day => {
                const dateKey = day.toISOString().split('T')[0];
                const dayPages = pagesByDate.get(dateKey) || [];
                const isToday = isSameDay(day, new Date());
                const isDragOver = dragOverDate ? isSameDay(day, dragOverDate) : false;

                return (
                    <div
                        key={dateKey}
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
                             <button onClick={() => handleAdd(day)} className="p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded-full" aria-label="Add event">
                                <PlusIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-2 space-y-2 overflow-y-auto flex-1">
                            {dayPages.map(page => (
                                <CalendarEvent
                                    key={page.id}
                                    page={page}
                                    onDragStart={handleDragStart}
                                    onSelectPage={onSelectPage}
                                    onDeletePage={onDeletePage}
                                    isDragging={draggedPageId === page.id}
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

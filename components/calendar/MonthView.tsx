
import React, { useMemo, useState } from 'react';
import type { Page } from '../../types';
import { getMonthGrid, isSameDay } from './calendar-utils';
import PlusIcon from '../icons/PlusIcon';
import CalendarEvent from './CalendarEvent';


interface MonthViewProps {
  pages: Page[];
  currentDate: Date;
  onAddPage: (initialData: Partial<Page>, openInEditor?: boolean) => void;
  onDeletePage: (id: string) => void;
  onUpdateDate: (id: string, date: string | null) => void;
  onSelectPage: (id: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MonthView: React.FC<MonthViewProps> = ({ pages, currentDate, onAddPage, onDeletePage, onUpdateDate, onSelectPage }) => {
    const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
    const [dragOverDate, setDragOverDate] = useState<Date | null>(null);

    const monthGrid = useMemo(() => getMonthGrid(currentDate), [currentDate]);
    
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
        const newPageData = {
            dueDate: date.toISOString(),
            status: 'todo' as const,
        };
        onAddPage(newPageData, true);
    };
    
    return (
        <div className="flex-1 flex flex-col">
            <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-400 border-b border-white/10">
                {WEEKDAYS.map(day => (
                    <div key={day} className="py-2">{day}</div>
                ))}
            </div>
            <div className="calendar-grid flex-1">
                {monthGrid.flat().map(({ date, isCurrentMonth }, index) => {
                    const dateKey = date.toISOString().split('T')[0];
                    const dayPages = pagesByDate.get(dateKey) || [];
                    const isToday = isSameDay(date, new Date());
                    const isDragOver = dragOverDate ? isSameDay(date, dragOverDate) : false;

                    return (
                        <div
                            key={index}
                            className={`calendar-day-cell p-2 h-36 flex flex-col group ${isCurrentMonth ? '' : 'is-other-month'} ${isDragOver ? 'bg-purple-500/20' : ''}`}
                            onDrop={(e) => handleDrop(e, date)}
                            onDragOver={(e) => handleDragOver(e, date)}
                            onDragLeave={() => setDragOverDate(null)}
                        >
                            <div className="flex justify-between items-center">
                                <span className={`text-sm font-semibold ${isToday ? 'bg-purple-600 text-white rounded-full flex items-center justify-center w-6 h-6' : 'text-gray-400'}`}>
                                    {date.getDate()}
                                </span>
                                {isCurrentMonth && (
                                    <button onClick={() => handleAdd(date)} className="add-event-btn p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded-full" aria-label="Add event">
                                        <PlusIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div className="mt-1 space-y-1 overflow-y-auto flex-1">
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
        </div>
    );
};

export default MonthView;

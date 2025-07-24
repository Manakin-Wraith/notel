
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
                    const dateKey = date.toISOString().split('T')[0];
                    const dayPages = pagesByDate.get(dateKey) || [];
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
                                        onClick={() => handleAdd(date)} 
                                        className="add-event-btn p-1 text-gray-500 hover:text-white hover:bg-white/20 rounded-full opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity touch-manipulation" 
                                        aria-label="Add event"
                                    >
                                        <PlusIcon className="w-3 h-3 md:w-4 md:h-4" />
                                    </button>
                                )}
                            </div>
                            
                            {/* Events container - mobile optimized */}
                            <div className="flex-1 min-h-0 space-y-0.5 overflow-hidden">
                                {dayPages.slice(0, 2).map((page) => (
                                    <CalendarEvent
                                        key={page.id}
                                        page={page}
                                        onDragStart={handleDragStart}
                                        onSelectPage={onSelectPage}
                                        onDeletePage={onDeletePage}
                                        isDragging={draggedPageId === page.id}
                                    />
                                ))}
                                {/* Show indicator for more events */}
                                {dayPages.length > 2 && (
                                    <div className="text-xs text-gray-400 px-1 py-0.5 bg-white/10 rounded text-center">
                                        +{dayPages.length - 2} more
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

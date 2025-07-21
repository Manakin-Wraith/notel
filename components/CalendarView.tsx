
import React, { useState, useMemo } from 'react';
import type { Page } from '../types';
import MonthView from './calendar/MonthView';
import WeekView from './calendar/WeekView';
import DayView from './calendar/DayView';
import { getMonthName } from './calendar/calendar-utils';
import ChevronRightIcon from './icons/ChevronRightIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';


type CalendarDisplayMode = 'month' | 'week' | 'day';

interface CalendarViewProps {
  pages: Page[];
  onAddPage: (initialData: Partial<Page>, openInEditor?: boolean) => void;
  onDeletePage: (id: string) => void;
  onUpdateDate: (id: string, date: string | null) => void;
  onSelectPage: (id: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ pages, onAddPage, onDeletePage, onUpdateDate, onSelectPage }) => {
    const [displayMode, setDisplayMode] = useState<CalendarDisplayMode>('month');
    const [currentDate, setCurrentDate] = useState(new Date());

    const datedPages = useMemo(() => pages.filter(p => p.dueDate), [pages]);

    const handleSetToday = () => setCurrentDate(new Date());
    
    const handleNext = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (displayMode === 'month') newDate.setMonth(prev.getMonth() + 1);
            if (displayMode === 'week') newDate.setDate(prev.getDate() + 7);
            if (displayMode === 'day') newDate.setDate(prev.getDate() + 1);
            return newDate;
        });
    };

    const handlePrev = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (displayMode === 'month') newDate.setMonth(prev.getMonth() - 1);
            if (displayMode === 'week') newDate.setDate(prev.getDate() - 7);
            if (displayMode === 'day') newDate.setDate(prev.getDate() - 1);
            return newDate;
        });
    };

    const headerTitle = useMemo(() => {
        if (displayMode === 'month') {
            return `${getMonthName(currentDate.getMonth())} ${currentDate.getFullYear()}`;
        }
        if (displayMode === 'week') {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            return `${startOfWeek.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} - ${endOfWeek.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}`;
        }
        if (displayMode === 'day') {
             return currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
    }, [currentDate, displayMode]);

    const renderGrid = () => {
        const props = { pages: datedPages, currentDate, onAddPage, onDeletePage, onUpdateDate, onSelectPage, setCurrentDate, setDisplayMode };
        switch(displayMode) {
            case 'month':
                return <MonthView {...props} />;
            case 'week':
                return <WeekView {...props} />;
            case 'day':
                return <DayView {...props} />;
            default:
                return <MonthView {...props} />;
        }
    }

    return (
        <main className="flex-1 flex flex-col p-8 md:p-12 overflow-y-auto">
             <div className="max-w-full mx-auto w-full flex-1 flex flex-col">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <h1 className="text-4xl font-bold text-gray-100 mb-4 md:mb-0 flex items-center gap-4">
                        <CalendarDaysIcon className="w-10 h-10" />
                        <span>Calendar</span>
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                             <button onClick={handlePrev} className="p-2 rounded-md hover:bg-white/10" aria-label="Previous">
                                <ChevronRightIcon className="w-5 h-5 rotate-180" />
                            </button>
                             <h2 className="text-xl font-semibold text-gray-200 w-48 text-center">{headerTitle}</h2>
                             <button onClick={handleNext} className="p-2 rounded-md hover:bg-white/10" aria-label="Next">
                                <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <button onClick={handleSetToday} className="px-4 py-2 text-sm font-semibold text-gray-200 bg-black/30 border border-white/20 rounded-md hover:bg-white/10 transition-colors">
                            Today
                        </button>
                        <div className="bg-black/30 border border-white/20 p-1 rounded-md flex items-center">
                           <button onClick={() => setDisplayMode('month')} className={`px-3 py-1 text-sm rounded ${displayMode === 'month' ? 'bg-white/20' : 'hover:bg-white/10'}`}>Month</button>
                           <button onClick={() => setDisplayMode('week')} className={`px-3 py-1 text-sm rounded ${displayMode === 'week' ? 'bg-white/20' : 'hover:bg-white/10'}`}>Week</button>
                           <button onClick={() => setDisplayMode('day')} className={`px-3 py-1 text-sm rounded ${displayMode === 'day' ? 'bg-white/20' : 'hover:bg-white/10'}`}>Day</button>
                        </div>
                    </div>
                </div>
                <div className="flex-1 flex flex-col">
                    {renderGrid()}
                </div>
            </div>
        </main>
    );
};

export default CalendarView;

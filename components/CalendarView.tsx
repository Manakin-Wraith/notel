
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
        <main className="flex-1 flex flex-col p-4 md:p-8 lg:p-12 overflow-y-auto">
             <div className="max-w-full mx-auto w-full flex-1 flex flex-col">
                {/* Mobile-optimized header */}
                <div className="flex flex-col space-y-4 mb-6 md:mb-8">
                    {/* Title and navigation row */}
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl md:text-4xl font-bold text-gray-100 flex items-center gap-2 md:gap-4">
                            <CalendarDaysIcon className="w-6 h-6 md:w-10 md:h-10" />
                            <span>Calendar</span>
                        </h1>
                        <button onClick={handleSetToday} className="px-3 py-2 md:px-4 text-xs md:text-sm font-semibold text-gray-200 bg-black/30 border border-white/20 rounded-md hover:bg-white/10 transition-colors">
                            Today
                        </button>
                    </div>
                    
                    {/* Navigation and controls row */}
                    <div className="flex items-center justify-between gap-2">
                        {/* Date navigation */}
                        <div className="flex items-center gap-1 md:gap-2">
                             <button onClick={handlePrev} className="p-2 md:p-3 rounded-md hover:bg-white/10 touch-manipulation" aria-label="Previous">
                                <ChevronRightIcon className="w-4 h-4 md:w-5 md:h-5 rotate-180" />
                            </button>
                             <h2 className="text-base md:text-xl font-semibold text-gray-200 min-w-0 text-center px-2">{headerTitle}</h2>
                             <button onClick={handleNext} className="p-2 md:p-3 rounded-md hover:bg-white/10 touch-manipulation" aria-label="Next">
                                <ChevronRightIcon className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                        </div>
                        
                        {/* View mode selector */}
                        <div className="bg-black/30 border border-white/20 p-1 rounded-md flex items-center">
                           <button onClick={() => setDisplayMode('month')} className={`px-2 md:px-3 py-1 text-xs md:text-sm rounded touch-manipulation ${displayMode === 'month' ? 'bg-white/20' : 'hover:bg-white/10'}`}>M</button>
                           <button onClick={() => setDisplayMode('week')} className={`px-2 md:px-3 py-1 text-xs md:text-sm rounded touch-manipulation ${displayMode === 'week' ? 'bg-white/20' : 'hover:bg-white/10'}`}>W</button>
                           <button onClick={() => setDisplayMode('day')} className={`px-2 md:px-3 py-1 text-xs md:text-sm rounded touch-manipulation ${displayMode === 'day' ? 'bg-white/20' : 'hover:bg-white/10'}`}>D</button>
                        </div>
                    </div>
                </div>
                {/* Calendar grid with mobile optimization */}
                <div className="flex-1 flex flex-col min-h-0">
                    {renderGrid()}
                </div>
            </div>
        </main>
    );
};

export default CalendarView;

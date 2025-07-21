

import React, { useMemo } from 'react';
import type { Page } from '../../types';
import { isSameDay } from './calendar-utils';
import PlusIcon from '../icons/PlusIcon';
import PageIcon from '../icons/PageIcon';
import TrashIcon from '../icons/TrashIcon';

interface DayViewProps {
  pages: Page[];
  currentDate: Date;
  onAddPage: (initialData: Partial<Page>, openInEditor?: boolean) => void;
  onDeletePage: (id: string) => void;
  onSelectPage: (id: string) => void;
}

const DayView: React.FC<DayViewProps> = ({ pages, currentDate, onAddPage, onDeletePage, onSelectPage }) => {

    const dayPages = useMemo(() => {
        return pages.filter(p => isSameDay(new Date(p.dueDate!), currentDate))
            .sort((a, b) => a.title.localeCompare(b.title));
    }, [pages, currentDate]);

    const handleAdd = () => {
        onAddPage({ dueDate: currentDate.toISOString(), status: 'todo' }, true);
    };

    return (
        <div className="flex-1 bg-black/20 backdrop-blur-lg border border-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-gray-200">
                    Tasks for {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </h3>
                <button onClick={handleAdd} className="flex items-center gap-2 text-sm bg-purple-600 hover:bg-purple-500 text-white font-semibold py-1 px-3 rounded-md transition-colors">
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Page</span>
                </button>
            </div>
            <div className="space-y-2">
                {dayPages.length > 0 ? (
                    dayPages.map(page => (
                        <div key={page.id} className="group flex items-center gap-3 p-3 rounded-md bg-black/40 hover:bg-black/60 transition-colors">
                            <button onClick={() => onSelectPage(page.id)} className="flex-1 flex items-center gap-3 text-left">
                                <PageIcon icon={page.icon} className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-200">{page.title}</span>
                            </button>
                            <button onClick={() => onDeletePage(page.id)} className="p-1 text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-400 rounded-full" aria-label="Delete page">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        <p>No pages scheduled for this day.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DayView;
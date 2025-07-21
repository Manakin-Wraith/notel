

import React, { useMemo, useState } from 'react';
import type { Page } from '../types';
import PageIcon from './icons/PageIcon';
import ViewColumnsIcon from './icons/ViewColumnsIcon';
import CircleIcon from './icons/CircleIcon';
import InProgressIcon from './icons/InProgressIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

type Status = 'todo' | 'in-progress' | 'done';

const statusDisplay: { [key in Status]: { text: string; icon: React.ReactNode } } = {
  'todo': { text: 'To Do', icon: <CircleIcon className="w-4 h-4 text-gray-500" /> },
  'in-progress': { text: 'In Progress', icon: <InProgressIcon className="w-4 h-4 text-yellow-400" /> },
  'done': { text: 'Done', icon: <CheckCircleIcon className="w-4 h-4 text-green-500" /> },
};

const COLUMNS: { id: Status, title: string }[] = [
    { id: 'todo', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
];

interface BoardProps {
  pages: Page[];
  onUpdateStatus: (id: string, status: Status | null) => void;
  onSelectPage: (id: string) => void;
}

const Board: React.FC<BoardProps> = ({ pages, onUpdateStatus, onSelectPage }) => {
    const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<Status | null>(null);

    const pagesByStatus = useMemo(() => {
        const grouped: { [key in Status]: Page[] } = {
            'todo': [],
            'in-progress': [],
            'done': [],
        };

        pages.forEach(page => {
            if (page.status && grouped[page.status]) {
                grouped[page.status].push(page);
            }
        });
        return grouped;
    }, [pages]);
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, pageId: string) => {
        setDraggedPageId(pageId);
        e.dataTransfer.setData('text/plain', pageId);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: Status) => {
        e.preventDefault();
        if (draggedPageId) {
            onUpdateStatus(draggedPageId, status);
        }
        setDraggedPageId(null);
        setDragOverColumn(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: Status) => {
        e.preventDefault();
        setDragOverColumn(status);
    };
    
    const hasTasks = pages.some(p => p.status);

    return (
        <main className="flex-1 flex flex-col p-8 md:p-12 overflow-x-auto">
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-100 mb-8">Board</h1>

                {!hasTasks ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <ViewColumnsIcon className="w-20 h-20 mx-auto text-gray-600 mb-4" />
                            <h2 className="text-2xl font-semibold text-gray-300">No Tasks on Board</h2>
                            <p className="text-gray-500 mt-1">Add a status to a page to see it here.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full flex-1">
                        {COLUMNS.map(column => (
                            <div
                                key={column.id}
                                onDrop={(e) => handleDrop(e, column.id)}
                                onDragOver={(e) => handleDragOver(e, column.id)}
                                onDragLeave={() => setDragOverColumn(null)}
                                className={`flex flex-col rounded-lg bg-black/20 backdrop-blur-lg border border-white/5 transition-colors ${dragOverColumn === column.id ? 'bg-white/10' : ''}`}
                            >
                                <div className="p-4 border-b border-white/5">
                                    <h2 className="text-sm font-semibold uppercase text-gray-400 tracking-wider flex items-center gap-2">
                                        {statusDisplay[column.id].icon}
                                        <span>{column.title}</span>
                                        <span className="ml-auto text-xs bg-black/30 text-gray-500 rounded-full px-2 py-0.5">{pagesByStatus[column.id].length}</span>
                                    </h2>
                                </div>
                                <div className="p-2 space-y-2 overflow-y-auto flex-1">
                                    {pagesByStatus[column.id].map(page => (
                                        <div
                                            key={page.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, page.id)}
                                            onClick={() => onSelectPage(page.id)}
                                            className={`p-3 rounded-md bg-black/40 border border-transparent hover:border-white/20 cursor-pointer transition-all ${draggedPageId === page.id ? 'opacity-50 scale-95' : 'opacity-100'}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <PageIcon icon={page.icon} className="w-5 h-5 flex-shrink-0 mt-0.5 text-gray-400" />
                                                <p className="text-gray-200 flex-1">{page.title || 'Untitled'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
};

export default Board;
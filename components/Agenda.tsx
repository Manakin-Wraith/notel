
import React, { useMemo } from 'react';
import type { Page } from '../types';
import CalendarIcon from './icons/CalendarIcon';
import PageIcon from './icons/PageIcon';

interface AgendaProps {
  pages: Page[];
  onSelectPage: (id: string) => void;
}

const Agenda: React.FC<AgendaProps> = ({ pages, onSelectPage }) => {
  const datedPages = useMemo(() => {
    return pages
      .filter(p => p.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  }, [pages]);

  const groupedPages = useMemo(() => {
    const groups: { [key: string]: Page[] } = {
      overdue: [],
      today: [],
      tomorrow: [],
      upcoming: [],
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    for (const page of datedPages) {
      const pageDate = new Date(page.dueDate!);
      pageDate.setHours(0, 0, 0, 0);

      if (pageDate.getTime() < today.getTime()) {
        groups.overdue.push(page);
      } else if (pageDate.getTime() === today.getTime()) {
        groups.today.push(page);
      } else if (pageDate.getTime() === tomorrow.getTime()) {
        groups.tomorrow.push(page);
      } else {
        groups.upcoming.push(page);
      }
    }
    // Sort overdue pages in reverse chronological order (most recent overdue first)
    groups.overdue.reverse();
    return groups;
  }, [datedPages]);
  
  const hasDatedPages = datedPages.length > 0;

  const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
      });
  };

  const renderGroup = (title: string, pagesInGroup: Page[]) => {
    if (pagesInGroup.length === 0) return null;
    return (
      <div key={title} className="mb-8">
        <h2 className="text-sm font-semibold uppercase text-gray-500 tracking-wider mb-3 px-2">
          {title}
        </h2>
        <ul className="space-y-1">
          {pagesInGroup.map(page => (
            <li key={page.id}>
              <button
                onClick={() => onSelectPage(page.id)}
                className="w-full flex items-center text-left p-2 rounded-md transition-colors text-gray-300 hover:bg-white/5 group"
              >
                <PageIcon icon={page.icon} className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />
                <span className="flex-1 truncate">{page.title || 'Untitled'}</span>
                <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                  {formatDate(page.dueDate!)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <main className="flex-1 p-8 md:p-12 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-100 mb-8">Agenda</h1>
        
        {!hasDatedPages ? (
          <div className="text-center text-gray-500 mt-16">
            <CalendarIcon className="w-20 h-20 mx-auto text-gray-600 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-300">No Dated Pages</h2>
            <p className="text-gray-500 mt-1">Add a date to a page to see it here.</p>
          </div>
        ) : (
          <div>
            {renderGroup('Overdue', groupedPages.overdue)}
            {renderGroup('Today', groupedPages.today)}
            {renderGroup('Tomorrow', groupedPages.tomorrow)}
            {renderGroup('Upcoming', groupedPages.upcoming)}
          </div>
        )}
      </div>
    </main>
  );
};

export default Agenda;
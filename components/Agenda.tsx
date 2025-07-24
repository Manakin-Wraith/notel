
import React, { useMemo } from 'react';
import type { Page, Event } from '../types';
import CalendarIcon from './icons/CalendarIcon';
import PageIcon from './icons/PageIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import InProgressIcon from './icons/InProgressIcon';

interface AgendaItem {
  id: string;
  title: string;
  icon?: string;
  date: string;
  type: 'page' | 'event';
  status?: string;
  priority?: string;
  allDay?: boolean;
  endDate?: string;
}

interface AgendaProps {
  pages: Page[];
  events: Event[];
  onSelectPage: (id: string) => void;
  onSelectEvent: (id: string) => void;
}

const Agenda: React.FC<AgendaProps> = ({ pages, events, onSelectPage, onSelectEvent }) => {
  // Convert Pages and Events to unified AgendaItems
  const agendaItems = useMemo(() => {
    const items: AgendaItem[] = [];
    
    // Add legacy Pages with dueDate
    pages
      .filter(p => p.dueDate)
      .forEach(page => {
        items.push({
          id: page.id,
          title: page.title || 'Untitled',
          icon: page.icon,
          date: page.dueDate!,
          type: 'page',
          status: page.status || undefined,
        });
      });
    
    // Add Events
    events.forEach(event => {
      items.push({
        id: event.id,
        title: event.title,
        icon: event.icon,
        date: event.startDate,
        type: 'event',
        status: event.status,
        priority: event.priority,
        allDay: event.allDay,
        endDate: event.endDate,
      });
    });
    
    // Sort all items by date
    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [pages, events]);

  const groupedItems = useMemo(() => {
    const groups: { [key: string]: AgendaItem[] } = {
      overdue: [],
      today: [],
      tomorrow: [],
      upcoming: [],
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    for (const item of agendaItems) {
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0);

      if (itemDate.getTime() < today.getTime()) {
        groups.overdue.push(item);
      } else if (itemDate.getTime() === today.getTime()) {
        groups.today.push(item);
      } else if (itemDate.getTime() === tomorrow.getTime()) {
        groups.tomorrow.push(item);
      } else {
        groups.upcoming.push(item);
      }
    }
    // Sort overdue items in reverse chronological order (most recent overdue first)
    groups.overdue.reverse();
    return groups;
  }, [agendaItems]);
  
  const hasAgendaItems = agendaItems.length > 0;

  const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
      });
  };

  const getStatusIcon = (item: AgendaItem) => {
    if (item.type === 'event') {
      // For events, show the custom icon if available, otherwise status-based icon
      if (item.icon) {
        return <PageIcon icon={item.icon} className="w-5 h-5 text-gray-400" />;
      }
      switch (item.status) {
        case 'completed':
          return <CheckCircleIcon className="w-4 h-4 text-green-400" />;
        case 'cancelled':
          return <div className="w-4 h-4 rounded-full bg-red-400" />;
        default:
          return <CalendarIcon className="w-4 h-4 text-blue-400" />;
      }
    } else {
      switch (item.status) {
        case 'done':
          return <CheckCircleIcon className="w-4 h-4 text-green-400" />;
        case 'in-progress':
          return <InProgressIcon className="w-4 h-4 text-yellow-400" />;
        default:
          return <PageIcon icon={item.icon || '📄'} className="w-5 h-5 text-gray-400" />;
      }
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-400';
      case 'medium': return 'border-l-yellow-400';
      case 'low': return 'border-l-green-400';
      default: return 'border-l-transparent';
    }
  };

  const formatTime = (dateString: string, allDay?: boolean, endDate?: string) => {
    const date = new Date(dateString);
    if (allDay) {
      return 'All day';
    }
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    if (endDate && endDate.trim() !== '') {
      const endTime = new Date(endDate).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      return `${timeStr} - ${endTime}`;
    }
    return timeStr;
  };

  const renderGroup = (title: string, itemsInGroup: AgendaItem[]) => {
    if (itemsInGroup.length === 0) return null;
    return (
      <div key={title} className="mb-8">
        <h2 className="text-sm font-semibold uppercase text-gray-500 tracking-wider mb-3 px-2">
          {title}
        </h2>
        <ul className="space-y-1">
          {itemsInGroup.map(item => (
            <li key={`${item.type}-${item.id}`}>
              <button
                onClick={() => item.type === 'page' ? onSelectPage(item.id) : onSelectEvent(item.id)}
                className={`w-full flex items-center text-left p-3 rounded-md transition-colors text-gray-300 hover:bg-white/5 group border-l-2 ${getPriorityColor(item.priority)}`}
              >
                <div className="mr-3 flex-shrink-0">
                  {getStatusIcon(item)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{item.title}</span>
                    {item.type === 'event' && (
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full flex-shrink-0">
                        Event
                      </span>
                    )}
                    {item.priority && item.priority !== 'medium' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                        item.priority === 'high' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                      }`}>
                        {item.priority}
                      </span>
                    )}
                  </div>
                  {item.type === 'event' && !item.allDay && (
                    <div className="text-xs text-gray-500 mt-1">
                      {formatTime(item.date, item.allDay, item.endDate)}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                    {formatDate(item.date)}
                  </span>
                  {item.type === 'event' && item.allDay && (
                    <div className="text-xs text-gray-600 mt-1">All day</div>
                  )}
                </div>
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
        
        {!hasAgendaItems ? (
          <div className="text-center text-gray-500 mt-16">
            <CalendarIcon className="w-20 h-20 mx-auto text-gray-600 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-300">No Scheduled Items</h2>
            <p className="text-gray-500 mt-1">Add dates to pages or create calendar events to see them here.</p>
          </div>
        ) : (
          <div>
            {renderGroup('Overdue', groupedItems.overdue)}
            {renderGroup('Today', groupedItems.today)}
            {renderGroup('Tomorrow', groupedItems.tomorrow)}
            {renderGroup('Upcoming', groupedItems.upcoming)}
          </div>
        )}
      </div>
    </main>
  );
};

export default Agenda;
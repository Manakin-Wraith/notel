import React from 'react';
import type { Event } from '../types';
import XIcon from './icons/XIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import CalendarIcon from './icons/CalendarIcon';
import ComponentIcon from './icons/ComponentIcon';
import TrashIcon from './icons/TrashIcon';
import ShareButton from './ShareButton';
import CalendarLinkButton from './CalendarLinkButton';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (eventId: string) => void;
  event: Event | null;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  event
}) => {
  if (!isOpen || !event) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'scheduled': return 'text-blue-400 bg-blue-900/20';
      case 'completed': return 'text-green-400 bg-green-900/20';
      case 'cancelled': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getPriorityColor = (priority: Event['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-green-400 bg-green-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      onDelete(event.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-gray-900 rounded-xl shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <CalendarDaysIcon className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Event Details</h2>
          </div>
          <div className="flex items-center gap-2">
            <ShareButton
              resourceId={event.id}
              resourceType="event"
              resourceTitle={event.title}
              size="sm"
              className="text-gray-400 hover:text-gray-300"
            />
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">{event.title}</h3>
            {event.description && (
              <p className="text-gray-300 leading-relaxed">{event.description}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-white font-medium">
                  {formatDate(event.startDate)}
                </p>
                {event.endDate && event.endDate !== event.startDate && (
                  <p className="text-gray-400 text-sm">
                    to {formatDate(event.endDate)}
                  </p>
                )}
              </div>
            </div>

            {!event.allDay && (
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white">
                    {formatTime(event.startDate)}
                    {event.endDate && (
                      <span className="text-gray-400"> - {formatTime(event.endDate)}</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {event.allDay && (
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <p className="text-white">All Day</p>
              </div>
            )}
          </div>

          {/* Status and Priority */}
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status)}`}>
              {event.status === 'scheduled' && '📅 Scheduled'}
              {event.status === 'completed' && '✅ Completed'}
              {event.status === 'cancelled' && '❌ Cancelled'}
            </div>
            
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(event.priority)}`}>
              {event.priority === 'high' && '🔴 High Priority'}
              {event.priority === 'medium' && '🟡 Medium Priority'}
              {event.priority === 'low' && '🟢 Low Priority'}
            </div>
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Created</p>
                <p className="text-white">
                  {new Date(event.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Last Updated</p>
                <p className="text-white">
                  {new Date(event.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                Delete Event
              </button>
              
              {/* Calendar Link Button */}
              <CalendarLinkButton
                event={event}
                variant="secondary"
                size="md"
                showCopyOption={true}
                onSuccess={() => {
                  console.log('Calendar link action successful');
                }}
                onError={(error) => {
                  console.error('Calendar link error:', error);
                }}
              />
            </div>
            
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <ComponentIcon className="w-4 h-4" />
              Edit Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;

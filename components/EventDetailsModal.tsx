import React from 'react';
import type { Event } from '../types';
import XIcon from './icons/XIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import CalendarIcon from './icons/CalendarIcon';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-gray-900 rounded-xl shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
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
          <div className="pt-6 space-y-8">
            {/* Calendar Integration Section */}
            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50">
              <div className="text-center">
                <h4 className="text-lg font-medium text-white mb-2">Add to your calendar</h4>
                <p className="text-sm text-gray-400 mb-6">Never miss this event by adding it to your calendar</p>
                <CalendarLinkButton
                  event={event}
                  variant="secondary"
                  size="lg"
                  showCopyOption={true}
                  onSuccess={() => {
                    console.log('Calendar link action successful');
                  }}
                  onError={(error) => {
                    console.error('Calendar link error:', error);
                  }}
                />
              </div>
            </div>
            
            {/* Main Action Buttons */}
            <div className="flex items-center justify-between pt-4 pb-2">
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2.5 text-sm text-gray-500 hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-all duration-200 border border-transparent hover:border-red-900/20"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete
              </button>
              
              <button
                onClick={onEdit}
                className="px-6 py-2.5 bg-white text-black hover:bg-gray-100 rounded-lg transition-all duration-200 text-sm font-medium min-w-[100px] shadow-sm"
              >
                Edit Event
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;

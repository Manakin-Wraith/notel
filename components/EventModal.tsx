import React, { useState, useEffect } from 'react';
import type { Event } from '../types';
import XIcon from './icons/XIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import CalendarIcon from './icons/CalendarIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import PageIcon from './icons/PageIcon';
import IconPicker from './IconPicker';
import ShareButton from './ShareButton';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Partial<Event>) => void;
  onDelete?: (eventId: string) => void;
  event?: Event | null; // null for create, Event for edit
  initialDate?: string; // For creating events on specific dates
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  initialDate
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: '📅',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    allDay: false,
    status: 'scheduled' as Event['status'],
    priority: 'medium' as Event['priority'],
  });

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Edit mode - populate with existing event data
        const startDate = new Date(event.startDate);
        const endDate = event.endDate ? new Date(event.endDate) : null;
        
        setFormData({
          title: event.title,
          description: event.description || '',
          icon: event.icon || '📅',
          startDate: startDate.toISOString().split('T')[0],
          startTime: event.allDay ? '' : startDate.toTimeString().slice(0, 5),
          endDate: endDate ? endDate.toISOString().split('T')[0] : '',
          endTime: event.allDay || !endDate ? '' : endDate.toTimeString().slice(0, 5),
          allDay: event.allDay,
          status: event.status,
          priority: event.priority,
        });
      } else {
        // Create mode - use initial date or current date
        const date = initialDate ? new Date(initialDate) : new Date();
        const dateString = date.toISOString().split('T')[0];
        
        setFormData({
          title: '',
          description: '',
          icon: '📅',
          startDate: dateString,
          startTime: initialDate ? date.toTimeString().slice(0, 5) : '09:00',
          endDate: '',
          endTime: '',
          allDay: false,
          status: 'scheduled',
          priority: 'medium',
        });
      }
      setErrors({});
    }
  }, [isOpen, event, initialDate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.allDay && !formData.startTime) {
      newErrors.startTime = 'Start time is required for timed events';
    }

    if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
      newErrors.endDate = 'End date cannot be before start date';
    }

    if (!formData.allDay && formData.endTime && formData.startTime && 
        formData.startDate === formData.endDate && formData.endTime <= formData.startTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const startDateTime = formData.allDay 
        ? new Date(formData.startDate).toISOString()
        : new Date(`${formData.startDate}T${formData.startTime}`).toISOString();

      const endDateTime = formData.endDate 
        ? (formData.allDay 
            ? new Date(formData.endDate).toISOString()
            : new Date(`${formData.endDate}T${formData.endTime || '23:59'}`).toISOString())
        : undefined;

      const eventData: Partial<Event> = {
        title: formData.title,
        description: formData.description,
        icon: formData.icon,
        startDate: startDateTime,
        endDate: endDateTime,
        allDay: formData.allDay,
        status: formData.status,
        priority: formData.priority,
      };

      await onSave(eventData);
      onClose();
    } catch (error) {
      console.error('Failed to save event:', error);
      setErrors({ submit: 'Failed to save event. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !onDelete) return;
    
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await onDelete(event.id);
        onClose();
      } catch (error) {
        console.error('Failed to delete event:', error);
        setErrors({ submit: 'Failed to delete event. Please try again.' });
      }
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-gray-900 rounded-xl shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <CalendarDaysIcon className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">
              {event ? 'Edit Event' : 'Create Event'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {event && (
              <ShareButton
                resourceId={event.id}
                resourceType="event"
                resourceTitle={event.title}
                size="sm"
                className="text-gray-400 hover:text-gray-300"
              />
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-6">
            {/* Icon and Title */}
            <div className="flex gap-3">
              {/* Icon Picker */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Icon
                </label>
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="w-12 h-10 bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                >
                  <PageIcon icon={formData.icon} className="w-6 h-6" />
                </button>
                {showIconPicker && (
                  <IconPicker
                    onSelect={(icon) => {
                      setFormData({ ...formData, icon });
                      setShowIconPicker(false);
                    }}
                    onClose={() => setShowIconPicker(false)}
                  />
                )}
              </div>
              
              {/* Title */}
              <div className="flex-1">
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter event title"
                  required
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4" />
                    {errors.title}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Add event description (optional)"
              />
            </div>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="allDay"
              checked={formData.allDay}
              onChange={(e) => handleFieldChange('allDay', e.target.checked)}
              className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
            />
            <label htmlFor="allDay" className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              All Day Event
            </label>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleFieldChange('startDate', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {errors.startDate && (
                <p className="mt-1 text-xs text-red-400">{errors.startDate}</p>
              )}
            </div>

            {/* Start Time */}
            {!formData.allDay && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleFieldChange('startTime', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {errors.startTime && (
                  <p className="mt-1 text-xs text-red-400">{errors.startTime}</p>
                )}
              </div>
            )}

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleFieldChange('endDate', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {errors.endDate && (
                <p className="mt-1 text-xs text-red-400">{errors.endDate}</p>
              )}
            </div>

            {/* End Time */}
            {!formData.allDay && formData.endDate && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleFieldChange('endTime', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {errors.endTime && (
                  <p className="mt-1 text-xs text-red-400">{errors.endTime}</p>
                )}
              </div>
            )}
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleFieldChange('status', e.target.value as Event['status'])}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="scheduled">📅 Scheduled</option>
                <option value="completed">✅ Completed</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleFieldChange('priority', e.target.value as Event['priority'])}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-sm text-red-400 flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4" />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
            <div>
              {event && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Delete Event
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {isSubmitting ? 'Saving...' : (event ? 'Update Event' : 'Create Event')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;

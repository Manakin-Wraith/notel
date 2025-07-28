import React, { useEffect } from 'react';
import type { Reminder } from '../types/notifications';
import { useNotifications } from '../contexts/NotificationContext';
import BellIcon from './icons/BellIcon';
import PlusIcon from './icons/PlusIcon';
import XIcon from './icons/XIcon';

interface ReminderSettingsProps {
  reminders: Reminder[];
  onChange: (reminders: Reminder[]) => void;
}

const ReminderSettings: React.FC<ReminderSettingsProps> = ({ reminders, onChange }) => {
  const { preferences, requestPermission } = useNotifications();
  // Removed unused showAddReminder state

  const defaultReminders: Reminder[] = [
    { type: 'in-app', minutes_before: 15, enabled: true },
    { type: 'push', minutes_before: 15, enabled: false },
    { type: 'email', minutes_before: 1440, enabled: false }, // 1 day before
  ];

  // Initialize with default reminders if none exist
  useEffect(() => {
    if (reminders.length === 0) {
      onChange(defaultReminders);
    }
  }, [reminders.length, onChange]);

  const addReminder = () => {
    const newReminder: Reminder = {
      type: 'in-app',
      minutes_before: 15,
      enabled: true
    };
    onChange([...reminders, newReminder]);
  };

  const updateReminder = (index: number, updates: Partial<Reminder>) => {
    const updated = reminders.map((reminder, i) => 
      i === index ? { ...reminder, ...updates } : reminder
    );
    onChange(updated);
  };

  const removeReminder = (index: number) => {
    onChange(reminders.filter((_, i) => i !== index));
  };

  // Removed unused formatMinutes function

  const getTypeIcon = (type: Reminder['type']) => {
    switch (type) {
      case 'in-app': return '🔔';
      case 'push': return '📱';
      case 'email': return '📧';
      default: return '🔔';
    }
  };

  // Removed unused getTypeLabel function

  const handlePushReminderToggle = async (index: number, enabled: boolean) => {
    if (enabled && !preferences?.push_enabled) {
      const granted = await requestPermission();
      if (!granted) {
        return; // Don't enable if permission denied
      }
    }
    updateReminder(index, { enabled });
  };

  const timeOptions = [
    { value: 0, label: 'At event time' },
    { value: 5, label: '5 minutes before' },
    { value: 10, label: '10 minutes before' },
    { value: 15, label: '15 minutes before' },
    { value: 30, label: '30 minutes before' },
    { value: 60, label: '1 hour before' },
    { value: 120, label: '2 hours before' },
    { value: 1440, label: '1 day before' },
    { value: 2880, label: '2 days before' },
    { value: 10080, label: '1 week before' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BellIcon className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-medium text-white">Reminders</h3>
      </div>

      <div className="space-y-3">
        {reminders.map((reminder, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700"
          >
            {/* Type Icon */}
            <div className="text-lg">{getTypeIcon(reminder.type)}</div>

            {/* Type Selector */}
            <select
              value={reminder.type}
              onChange={(e) => updateReminder(index, { type: e.target.value as Reminder['type'] })}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="in-app">In-app</option>
              <option value="push">Push</option>
              <option value="email">Email</option>
            </select>

            {/* Time Selector */}
            <select
              value={reminder.minutes_before}
              onChange={(e) => updateReminder(index, { minutes_before: parseInt(e.target.value) })}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500 flex-1"
            >
              {timeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Enable/Disable Toggle */}
            <button
              onClick={() => {
                if (reminder.type === 'push') {
                  handlePushReminderToggle(index, !reminder.enabled);
                } else {
                  updateReminder(index, { enabled: !reminder.enabled });
                }
              }}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                reminder.enabled 
                  ? 'bg-blue-500' 
                  : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  reminder.enabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>

            {/* Remove Button */}
            {reminders.length > 1 && (
              <button
                onClick={() => removeReminder(index)}
                className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded transition-colors"
                aria-label="Remove reminder"
              >
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        {/* Add Reminder Button */}
        <button
          onClick={addReminder}
          className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors w-full"
        >
          <PlusIcon className="w-4 h-4" />
          <span className="text-sm">Add reminder</span>
        </button>
      </div>

      {/* Permission Notice */}
      {reminders.some(r => r.type === 'push' && r.enabled) && !preferences?.push_enabled && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-yellow-400">
            Push notifications require permission. Click the toggle to enable.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReminderSettings;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import XIcon from './icons/XIcon';
import CheckIcon from './icons/CheckIcon.tsx';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (defaultView: 'editor' | 'agenda' | 'board' | 'calendar' | 'chat') => Promise<void>;
}

type ViewMode = 'editor' | 'agenda' | 'board' | 'calendar' | 'chat';

interface UserSettings {
  default_view: ViewMode;
  created_at?: string;
  updated_at?: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({ default_view: 'editor' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load user settings
  useEffect(() => {
    if (!user || !isOpen) return;

    const loadSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // Not found error
          console.error('Error loading settings:', error);
        } else if (data) {
          setSettings(data);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user, isOpen]);

  // Save settings
  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await onSave(settings.default_view);
      // Close modal after successful save
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const viewOptions: { value: ViewMode; label: string; description: string }[] = [
    { value: 'editor', label: 'Editor', description: 'Start with page editing view' },
    { value: 'agenda', label: 'Agenda', description: 'Start with agenda/task view' },
    { value: 'board', label: 'Board', description: 'Start with kanban board view' },
    { value: 'calendar', label: 'Calendar', description: 'Start with calendar view' },
    { value: 'chat', label: 'Chat', description: 'Start with social chat view' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            aria-label="Close settings"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading settings...</p>
            </div>
          ) : (
            <>
              {/* Default View Setting */}
              <div>
                <h3 className="text-sm font-medium text-white mb-3">Default Landing Page</h3>
                <p className="text-xs text-gray-400 mb-4">
                  Choose which view to show after login or refresh
                </p>
                
                <div className="space-y-2">
                  {viewOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSettings(prev => ({ ...prev, default_view: option.value }))}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        settings.default_view === option.value
                          ? 'border-blue-500 bg-blue-500/10 text-white'
                          : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-750'
                      }`}
                    >
                      <div className="text-left">
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-400">{option.description}</div>
                      </div>
                      {settings.default_view === option.value && (
                        <CheckIcon className="w-5 h-5 text-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

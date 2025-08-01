// Chat Invite Modal
// Send email invitations to start a chat conversation

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { EmailService } from '../../lib/email';

interface ChatInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

const ChatInviteModal: React.FC<ChatInviteModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !user) return;

    setLoading(true);
    setError(null);

    try {
      const emailService = EmailService.getInstance();
      
      // Generate chat invitation URL
      const chatUrl = `${window.location.origin}/chat?invite=${encodeURIComponent(email)}&from=${encodeURIComponent(user.email || '')}`;
      
      // Send chat invitation email
      const result = await emailService.sendChatInvitation({
        recipientEmail: email.trim(),
        senderName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Someone',
        senderEmail: user.email || '',
        chatUrl,
        personalMessage: message.trim()
      });

      if (result.success) {
        // Show success toast notification
        showSuccess(
          'Invitation Sent!', 
          `Chat invitation sent to ${email.trim()}`
        );
        
        onSuccess(email.trim());
        setEmail('');
        setMessage('');
        onClose();
      } else {
        throw new Error(result.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Failed to send chat invitation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invitation';
      
      // Show error toast notification
      showError('Failed to Send Invitation', errorMessage);
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Invite Someone to Chat</h2>
          <p className="text-gray-400 text-sm mt-1">
            Send an email invitation to start a conversation
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Personal Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hey! Want to chat on Notel?"
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              maxLength={200}
            />
            <div className="text-xs text-gray-500 mt-1">
              {message.length}/200 characters
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInviteModal;

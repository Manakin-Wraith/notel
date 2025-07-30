// Real-Time Chat Component
// Created: 2025-07-30
// Production chat interface connected to Supabase backend

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../contexts/AuthContext';
import ProfileAvatar from '../ProfileAvatar';
import MessageCircleIcon from '../icons/MessageCircleIcon';
import PlusIcon from '../icons/PlusIcon';
import type { CreateConversationRequest } from '../../types/chat';

// Message component with save functionality
interface MessageProps {
  message: any;
  isOwn: boolean;
  onSave: (messageId: string) => void;
}

const Message: React.FC<MessageProps> = ({ message, isOwn, onSave }) => {
  const [showActions, setShowActions] = useState(false);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isExpiring = message.expires_at && !message.is_saved && new Date(message.expires_at) > new Date();
  const expiresIn = isExpiring ? Math.ceil((new Date(message.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div 
      className={`flex gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group ${isOwn ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <ProfileAvatar 
        displayName={message.sender?.full_name || message.sender?.email || 'Unknown User'}
        avatarUrl={message.sender?.avatar_url || null}
        size="small"
        className="flex-shrink-0"
      />
      <div className={`flex-1 ${isOwn ? 'text-right' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-200">
            {message.sender?.full_name || message.sender?.email || 'Unknown User'}
          </span>
          <span className="text-xs text-gray-500">
            {formatTime(message.created_at)}
          </span>
          {message.edited_at && (
            <span className="text-xs text-gray-500 italic">(edited)</span>
          )}
          {message.is_saved && (
            <span className="text-xs text-purple-400 font-medium">📌 Saved</span>
          )}
          {isExpiring && !message.is_saved && (
            <span className="text-xs text-yellow-400">
              ⏰ Expires in {expiresIn}d
            </span>
          )}
        </div>
        <div className="text-gray-300 text-sm leading-relaxed">
          {message.content}
        </div>
        {showActions && !message.is_saved && (
          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onSave(message.id)}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              💾 Save Message
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Typing indicator component
const TypingIndicator: React.FC<{ typingUsers: any[] }> = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;

  const names = typingUsers.map(u => u.user?.full_name || 'Someone').join(', ');
  
  return (
    <div className="flex items-center gap-2 p-3 text-gray-400 text-sm">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{names} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
    </div>
  );
};

// New conversation modal
interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (request: CreateConversationRequest) => void;
}

const NewConversationModal: React.FC<NewConversationModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      // For now, we'll create with email - in production you'd look up user ID
      onCreate({
        type: 'direct',
        participant_ids: [], // This would be populated after user lookup
        name: `Chat with ${email}`
      });
      setEmail('');
      onClose();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Start New Conversation</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              User Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter user email..."
              required
            />
          </div>
          <div className="flex gap-3 justify-end">
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
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Start Chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main chat component
const RealTimeChat: React.FC = () => {
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    messages,
    typingUsers,
    userPresence,
    loading,
    error,
    selectConversation,
    sendMessage,
    createConversation,
    saveMessage,
    saveConversation,
    setTyping
  } = useChat();

  const [messageInput, setMessageInput] = useState('');
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message input
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const content = messageInput.trim();
    setMessageInput('');
    await sendMessage(content);
    inputRef.current?.focus();
  };

  // Handle typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    setTyping(true);
  };

  // Get presence status
  const getPresenceStatus = (userId: string) => {
    const presence = userPresence.get(userId);
    return presence?.status || 'offline';
  };

  const getPresenceColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Please sign in to use chat
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#111111] text-gray-200">
      {/* Conversation List */}
      <div className="w-80 border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Messages</h2>
            <button
              onClick={() => setShowNewConversationModal(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
              title="New conversation"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading && conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-400">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              <MessageCircleIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-sm">Start a new chat to get started</p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const otherParticipant = conversation.participants?.find(p => p.user_id !== user.id);
              const presenceStatus = otherParticipant ? getPresenceStatus(otherParticipant.user_id) : 'offline';
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => selectConversation(conversation.id)}
                  className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${
                    activeConversation?.id === conversation.id ? 'bg-white/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <ProfileAvatar 
                        displayName={otherParticipant?.user?.full_name || otherParticipant?.user?.email || 'Unknown User'}
                        avatarUrl={otherParticipant?.user?.avatar_url || null}
                        size="medium"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-900 ${getPresenceColor(presenceStatus)}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-white truncate">
                          {conversation.name || otherParticipant?.user?.full_name || 'Unknown User'}
                        </h3>
                        {conversation.is_persistent && (
                          <span className="text-xs text-purple-400">📌</span>
                        )}
                      </div>
                      {conversation.last_message && (
                        <p className="text-sm text-gray-400 truncate">
                          {conversation.last_message.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 bg-black/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-white">
                    {activeConversation.name || 'Chat'}
                  </h3>
                  {!activeConversation.is_persistent && (
                    <button
                      onClick={() => saveConversation(activeConversation.id)}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      📌 Save Chat
                    </button>
                  )}
                </div>
                <div className="text-sm text-gray-400">
                  {activeConversation.participants?.length || 0} participants
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((message) => (
                <Message
                  key={message.id}
                  message={message}
                  isOwn={message.sender_id === user.id}
                  onSave={saveMessage}
                />
              ))}
              <TypingIndicator typingUsers={typingUsers} />
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/10 bg-black/20">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={messageInput}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageCircleIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Welcome to Chat</h3>
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onCreate={createConversation}
      />
    </div>
  );
};

export default RealTimeChat;

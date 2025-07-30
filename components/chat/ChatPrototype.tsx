import React, { useState, useRef, useEffect } from 'react';
import MessageCircleIcon from '../icons/MessageCircleIcon';
import ProfileAvatar from '../ProfileAvatar';

// Mock data for prototype
const mockUsers = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    avatar_url: null,
    status: 'online' as const,
    lastSeen: new Date(),
  },
  {
    id: '2', 
    name: 'Bob Wilson',
    email: 'bob@example.com',
    avatar_url: null,
    status: 'offline' as const,
    lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
  },
  {
    id: '3',
    name: 'Carol Davis',
    email: 'carol@example.com', 
    avatar_url: null,
    status: 'away' as const,
    lastSeen: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
  }
];

const mockConversations = [
  {
    id: '1',
    type: 'direct' as const,
    participants: [mockUsers[0]],
    lastMessage: 'Can you review the project document I shared?',
    lastMessageTime: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    unreadCount: 2,
  },
  {
    id: '2',
    type: 'direct' as const, 
    participants: [mockUsers[1]],
    lastMessage: 'Meeting at 3pm tomorrow',
    lastMessageTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    unreadCount: 0,
  },
  {
    id: '3',
    type: 'group' as const,
    name: 'Team Alpha',
    participants: [mockUsers[0], mockUsers[1], mockUsers[2]],
    lastMessage: 'New sprint planning discussion started',
    lastMessageTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    unreadCount: 5,
  }
];

type Message = {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
};

type MessagesMap = {
  [conversationId: string]: Message[];
};

const mockMessages: MessagesMap = {
  '1': [
    {
      id: '1',
      senderId: '1',
      content: 'Hey, can you review the project document I shared with you yesterday?',
      timestamp: new Date(Date.now() - 3 * 60 * 1000),
      isOwn: false,
    },
    {
      id: '2', 
      senderId: 'current-user',
      content: 'Sure! I\'ll take a look and get back to you by end of day',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      isOwn: true,
    },
    {
      id: '3',
      senderId: '1', 
      content: 'Thanks! Let me know if you have any questions or suggestions',
      timestamp: new Date(Date.now() - 1 * 60 * 1000),
      isOwn: false,
    }
  ],
  '2': [
    {
      id: '4',
      senderId: '2',
      content: 'Don\'t forget about our meeting at 3pm tomorrow',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      isOwn: false,
    }
  ],
  '3': [
    {
      id: '5',
      senderId: '1',
      content: 'Should we start planning the next sprint?',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      isOwn: false,
    }
  ]
};

interface PresenceIndicatorProps {
  status: 'online' | 'away' | 'offline';
  className?: string;
}

const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({ status, className = "w-3 h-3" }) => {
  const statusColors = {
    online: 'bg-green-400',
    away: 'bg-yellow-400', 
    offline: 'bg-gray-500'
  };

  return (
    <div className={`${className} rounded-full border-2 border-black/50 ${statusColors[status]}`} />
  );
};

interface MessageBubbleProps {
  message: string;
  timestamp: Date;
  isOwn: boolean;
  senderName?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, timestamp, isOwn, senderName }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className={`max-w-xs lg:max-w-md p-3 rounded-lg mb-2 ${
      isOwn 
        ? 'ml-auto bg-blue-500/20 border border-blue-400/30' 
        : 'mr-auto bg-white/10 border border-white/20'
    }`}>
      {!isOwn && senderName && (
        <div className="text-xs text-gray-400 mb-1 font-medium">{senderName}</div>
      )}
      <div className="text-white text-sm leading-relaxed">{message}</div>
      <div className="text-xs text-gray-400 mt-1 text-right">{formatTime(timestamp)}</div>
    </div>
  );
};

interface ConversationListItemProps {
  conversation: typeof mockConversations[0];
  isActive: boolean;
  onClick: () => void;
}

const ConversationListItem: React.FC<ConversationListItemProps> = ({ conversation, isActive, onClick }) => {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const displayName = conversation.type === 'group' 
    ? conversation.name 
    : conversation.participants[0]?.name;
    
  const displayStatus = conversation.type === 'direct' 
    ? conversation.participants[0]?.status 
    : undefined;

  return (
    <div 
      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-white/10 ${
        isActive ? 'bg-white/20' : ''
      }`}
      onClick={onClick}
    >
      <div className="relative flex-shrink-0">
        {conversation.type === 'group' ? (
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {conversation.participants.length}
            </span>
          </div>
        ) : (
          <ProfileAvatar 
            displayName={displayName || ''}
            avatarUrl={conversation.participants[0]?.avatar_url || null}
            size="small"
          />
        )}
        {displayStatus && (
          <div className="absolute -bottom-0.5 -right-0.5">
            <PresenceIndicator status={displayStatus} />
          </div>
        )}
        {conversation.unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-medium flex items-center justify-center">
            {conversation.unreadCount}
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white text-sm truncate flex items-center gap-2">
          {displayName}
          {conversation.type === 'group' && (
            <span className="text-xs text-gray-400">({conversation.participants.length})</span>
          )}
        </div>
        <div className="text-gray-400 text-sm truncate mt-1">
          {conversation.lastMessage}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {formatTime(conversation.lastMessageTime)}
        </div>
      </div>
    </div>
  );
};

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="flex items-end gap-2 p-4 border-t border-white/10 bg-black/20">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={handleTextareaChange}
        onKeyPress={handleKeyPress}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-white/40 focus:bg-white/20 resize-none max-h-32 min-h-[40px]"
        rows={1}
      />
      <button
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        className="px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-400 hover:bg-blue-500/30 hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      >
        Send
      </button>
    </div>
  );
};

const ChatPrototype: React.FC = () => {
  const [activeConversationId, setActiveConversationId] = useState<string | null>('1');
  const [messages, setMessages] = useState<MessagesMap>(mockMessages);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = mockConversations.find(c => c.id === activeConversationId);
  const activeMessages = activeConversationId ? messages[activeConversationId] || [] : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]);

  const handleSendMessage = (content: string) => {
    if (!activeConversationId) return;

    const newMessage = {
      id: Date.now().toString(),
      senderId: 'current-user',
      content,
      timestamp: new Date(),
      isOwn: true,
    };

    setMessages(prev => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] || []), newMessage]
    }));

    // Simulate typing indicator and response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      
      // Simulate a response
      const responses = [
        "Thanks for the message!",
        "I'll get back to you on that.",
        "Sounds good to me.",
        "Let me think about it.",
        "Great idea!"
      ];
      
      const responseMessage = {
        id: (Date.now() + 1).toString(),
        senderId: activeConversation?.participants[0]?.id || '1',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
        isOwn: false,
      };

      setMessages(prev => ({
        ...prev,
        [activeConversationId]: [...(prev[activeConversationId] || []), responseMessage]
      }));
    }, 1500);
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Chat List Panel */}
      <div className="w-80 bg-black/20 backdrop-blur-xl border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-medium flex items-center gap-2">
              <MessageCircleIcon className="w-5 h-5" />
              Messages
            </h2>
            <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {mockConversations.map(conversation => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              isActive={activeConversationId === conversation.id}
              onClick={() => setActiveConversationId(conversation.id)}
            />
          ))}
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-t border-white/10">
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Start new conversation
          </button>
        </div>
      </div>

      {/* Active Chat Window */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 bg-black/20 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {activeConversation.type === 'group' ? (
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {activeConversation.participants.length}
                      </span>
                    </div>
                  ) : (
                    <ProfileAvatar 
                      displayName={activeConversation.participants[0]?.name || ''}
                      avatarUrl={activeConversation.participants[0]?.avatar_url || null}
                      size="small"
                    />
                  )}
                  {activeConversation.type === 'direct' && (
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <PresenceIndicator status={activeConversation.participants[0]?.status || 'offline'} />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-white font-medium">
                    {activeConversation.type === 'group' 
                      ? activeConversation.name 
                      : activeConversation.participants[0]?.name
                    }
                  </h3>
                  <p className="text-sm text-gray-400">
                    {activeConversation.type === 'direct' 
                      ? `${activeConversation.participants[0]?.status === 'online' ? 'Online' : 'Offline'}`
                      : `${activeConversation.participants.length} members`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {activeMessages.map((message: Message) => (
                <MessageBubble
                  key={message.id}
                  message={message.content}
                  timestamp={message.timestamp}
                  isOwn={message.isOwn}
                  senderName={message.isOwn ? undefined : mockUsers.find(u => u.id === message.senderId)?.name}
                />
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span>{activeConversation.participants[0]?.name} is typing...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <ChatInput onSendMessage={handleSendMessage} />
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <MessageCircleIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p className="text-sm">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPrototype;

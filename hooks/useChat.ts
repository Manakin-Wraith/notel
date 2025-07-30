// Real-time Chat Hook
// Created: 2025-07-30
// Manages chat state, real-time updates, and backend integration

import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '../lib/chat';
import { useAuth } from '../contexts/AuthContext';
import type {
  Conversation,
  ConversationWithDetails,
  Message,
  UserPresence,
  TypingIndicator,
  SendMessageRequest,
  CreateConversationRequest
} from '../types/chat';

interface UseChatReturn {
  // State
  conversations: Conversation[];
  activeConversation: ConversationWithDetails | null;
  messages: Message[];
  typingUsers: TypingIndicator[];
  userPresence: Map<string, UserPresence>;
  loading: boolean;
  error: string | null;

  // Actions
  loadConversations: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  createConversation: (request: CreateConversationRequest) => Promise<void>;
  saveMessage: (messageId: string) => Promise<void>;
  saveConversation: (conversationId: string) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  updatePresence: (status: 'online' | 'away' | 'busy' | 'offline') => void;
  markMessagesAsRead: (messageIds: string[]) => Promise<void>;
}

export function useChat(): UseChatReturn {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [userPresence, setUserPresence] = useState<Map<string, UserPresence>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await chatService.getConversations();
      if (response.success && response.data) {
        setConversations(response.data);
      } else {
        setError(response.error || 'Failed to load conversations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Select and load conversation details
  const selectConversation = useCallback(async (conversationId: string) => {
    if (!user || activeConversationIdRef.current === conversationId) return;

    setLoading(true);
    setError(null);

    try {
      // Unsubscribe from previous conversation
      if (activeConversationIdRef.current) {
        chatService.unsubscribeFromConversation(activeConversationIdRef.current);
      }

      // Load conversation details
      const response = await chatService.getConversationDetails(conversationId);
      if (response.success && response.data) {
        setActiveConversation(response.data);
        setMessages(response.data.messages || []);
        setTypingUsers(response.data.typing_users || []);
        activeConversationIdRef.current = conversationId;

        // Subscribe to real-time updates
        chatService.subscribeToConversation(conversationId, {
          onMessage: (message) => {
            setMessages(prev => {
              // Avoid duplicates
              const exists = prev.some(m => m.id === message.id);
              if (exists) return prev;
              return [...prev, message].sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            });
          },
          onTyping: (typing) => {
            setTypingUsers(prev => {
              // Remove expired typing indicators
              const now = new Date();
              const filtered = prev.filter(t => 
                new Date(t.expires_at) > now && t.user_id !== user.id
              );
              
              // Add new typing indicator if not from current user
              if (typing.user_id !== user.id) {
                const exists = filtered.some(t => t.user_id === typing.user_id);
                if (!exists) {
                  return [...filtered, typing];
                }
              }
              return filtered;
            });
          },
          onPresence: (presence) => {
            setUserPresence(prev => {
              const newMap = new Map(prev);
              newMap.set(presence.user_id, presence);
              return newMap;
            });
          }
        });

        // Mark messages as read
        const unreadMessages = response.data.messages
          ?.filter(m => !m.is_read && m.sender_id !== user.id)
          .map(m => m.id) || [];
        
        if (unreadMessages.length > 0) {
          await markMessagesAsRead(unreadMessages);
        }
      } else {
        setError(response.error || 'Failed to load conversation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!user || !activeConversation || !content.trim()) return;

    try {
      const request: SendMessageRequest = {
        conversation_id: activeConversation.id,
        content: content.trim(),
        message_type: 'text'
      };

      const response = await chatService.sendMessage(request);
      if (!response.success) {
        setError(response.error || 'Failed to send message');
      }
      // Message will be added via real-time subscription
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [user, activeConversation]);

  // Create conversation
  const createConversation = useCallback(async (request: CreateConversationRequest) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await chatService.createConversation(request);
      if (response.success && response.data) {
        // Reload conversations to include the new one
        await loadConversations();
        // Auto-select the new conversation
        await selectConversation(response.data.id);
      } else {
        setError(response.error || 'Failed to create conversation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user, loadConversations, selectConversation]);

  // Save message (prevent expiration)
  const saveMessage = useCallback(async (messageId: string) => {
    try {
      const response = await chatService.saveMessage(messageId);
      if (!response.success) {
        setError(response.error || 'Failed to save message');
      } else {
        // Update local message state
        setMessages(prev => prev.map(m => 
          m.id === messageId ? { ...m, is_saved: true, saved_at: new Date().toISOString() } : m
        ));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  // Save conversation (make persistent)
  const saveConversation = useCallback(async (conversationId: string) => {
    try {
      const response = await chatService.saveConversation(conversationId);
      if (!response.success) {
        setError(response.error || 'Failed to save conversation');
      } else {
        // Update local conversation state
        setActiveConversation(prev => prev ? 
          { ...prev, is_persistent: true, saved_at: new Date().toISOString() } : null
        );
        setConversations(prev => prev.map(c => 
          c.id === conversationId ? { ...c, is_persistent: true, saved_at: new Date().toISOString() } : c
        ));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  // Set typing indicator
  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!user || !activeConversation) return;

    if (isTyping) {
      try {
        await chatService.setTypingIndicator(activeConversation.id);
        
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Set timeout to stop typing after 3 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          setTyping(false);
        }, 3000);
      } catch (err) {
        console.error('Failed to set typing indicator:', err);
      }
    }
  }, [user, activeConversation]);

  // Update user presence
  const updatePresence = useCallback(async (status: 'online' | 'away' | 'busy' | 'offline') => {
    if (!user) return;

    try {
      await chatService.updatePresence(status);
    } catch (err) {
      console.error('Failed to update presence:', err);
    }
  }, [user]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (messageIds: string[]) => {
    if (!user || messageIds.length === 0) return;

    try {
      const response = await chatService.markMessagesAsRead(messageIds);
      if (!response.success) {
        console.error('Failed to mark messages as read:', response.error);
      }
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  }, [user]);

  // Initialize chat when user is available
  useEffect(() => {
    if (user) {
      loadConversations();
      updatePresence('online');
    }
  }, [user, loadConversations, updatePresence]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeConversationIdRef.current) {
        chatService.unsubscribeFromConversation(activeConversationIdRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      chatService.cleanup();
    };
  }, []);

  // Update presence to offline when window is closed
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user) {
        updatePresence('offline');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, updatePresence]);

  return {
    conversations,
    activeConversation,
    messages,
    typingUsers,
    userPresence,
    loading,
    error,
    loadConversations,
    selectConversation,
    sendMessage,
    createConversation,
    saveMessage,
    saveConversation,
    setTyping,
    updatePresence,
    markMessagesAsRead
  };
}

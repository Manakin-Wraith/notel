// Chat Service with Message Expiration and Persistence
// Created: 2025-07-30
// Handles all chat operations with privacy-first approach

import { supabase } from './supabase';
import type {
  Conversation,
  ConversationWithDetails,
  Message,
  UserPresence,
  TypingIndicator,
  SendMessageRequest,
  CreateConversationRequest,
  ChatServiceResponse
} from '../types/chat';
import { DEFAULT_CHAT_CONFIG } from '../types/chat';

export class ChatService {
  private static instance: ChatService;
  private realtimeSubscriptions: Map<string, any> = new Map();

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  // ==================== CONVERSATIONS ====================

  /**
   * Get all conversations for the current user
   */
  async getConversations(): Promise<ChatServiceResponse<Conversation[]>> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      // Directly query conversations the user is part of.
      // The RLS policy on 'conversations' table will ensure only accessible conversations are returned.
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        // Check for a specific error hint that suggests an RLS issue.
        if (error.message.includes('infinite recursion')) {
          console.error('Potential infinite recursion detected in RLS policy for conversations.');
          // Provide a more user-friendly error or attempt a fallback.
          throw new Error('Could not fetch conversations due to a database policy issue.');
        }
        throw error;
      }

      return { data: data || [], success: true };
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(request: CreateConversationRequest): Promise<ChatServiceResponse<Conversation>> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          name: request.name,
          type: request.type,
          created_by: user.id
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants (including creator)
      const participantIds = [...new Set([user.id, ...request.participant_ids])];
      const participants = participantIds.map(userId => ({
        conversation_id: conversation.id,
        user_id: userId,
        role: userId === user.id ? 'admin' : 'member'
      }));

      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (participantError) throw participantError;

      return { data: conversation, success: true };
    } catch (error) {
      console.error('Error creating conversation:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
  }

  /**
   * Get conversation details with messages and participants
   */
  async getConversationDetails(conversationId: string): Promise<ChatServiceResponse<ConversationWithDetails>> {
    try {
      // Get basic conversation info
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      // Get participants
      // Get participants
      const { data: participants, error: participantError } = await supabase
        .from('conversation_participants')
        .select('user_id, joined_at, left_at')
        .eq('conversation_id', conversationId);

      if (participantError) throw participantError;

      // Filter out participants who have left the conversation
      const activeParticipants = participants.filter(p => p.left_at === null);

      // Get user profiles for participants
      const participantIds = activeParticipants.map(p => p.user_id);
      const { data: participantProfilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, user_id, display_name, avatar_url')
        .in('user_id', participantIds);
      const participantProfiles = Array.isArray(participantProfilesData) ? participantProfilesData : [];

      if (profilesError) throw profilesError;

      // Get messages
      const { data: messages, error: messageError } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, content, created_at, updated_at, is_saved')
        .eq('conversation_id', conversationId);

      if (messageError) throw messageError;

      // Get user profiles for message senders
      const senderIds = Array.isArray(messages) ? messages.map(m => m.sender_id) : [];
      const { data: senderProfilesData, error: senderProfilesError } = await supabase
        .from('user_profiles')
        .select('id, user_id, display_name, avatar_url')
        .in('user_id', senderIds);
      const senderProfiles = Array.isArray(senderProfilesData) ? senderProfilesData : [];

      if (senderProfilesError) throw senderProfilesError;

      // Get active typing indicators
      const { data: typingIndicators, error: typingError } = await supabase
        .from('typing_indicators')
        .select('user_id, last_updated')
        .eq('conversation_id', conversationId);

      if (typingError) throw typingError;

      // Filter for active typing indicators (last 10 seconds)
      const activeTypingIndicators = Array.isArray(typingIndicators) 
        ? typingIndicators.filter(t => {
            const lastUpdated = new Date(t.last_updated);
            const tenSecondsAgo = new Date(Date.now() - 10000);
            return lastUpdated >= tenSecondsAgo;
          })
        : [];

      // Get user profiles for typing users
      const typingUserIds = activeTypingIndicators.map(t => t.user_id);
      const { data: typingUserProfilesData, error: typingProfilesError } = await supabase
        .from('user_profiles')
        .select('id, user_id, display_name')
        .in('user_id', typingUserIds);
      const typingUserProfiles = Array.isArray(typingUserProfilesData) ? typingUserProfilesData : [];

      if (typingProfilesError) throw typingProfilesError;

      // Combine all data
      const conversationWithDetails: ConversationWithDetails = {
        ...conversation,
        participants: activeParticipants.map(p => {
          const profile = participantProfiles.find(pp => pp.user_id === p.user_id);
          return {
            ...p,
            user: profile || null
          };
        }),
        messages: Array.isArray(messages) ? messages.map(m => {
          const sender = senderProfiles.find(sp => sp.user_id === m.sender_id);
          return {
            ...m,
            sender: sender || null
          };
        }) : [],
        typingUsers: typingUserProfiles
      };

      // Filter out expired messages unless they're saved or conversation is persistent
      const now = new Date();
      const filteredMessages = conversationWithDetails.messages.filter((msg: any) => {
        if (conversationWithDetails.is_persistent || msg.is_saved) return true;
        if (!msg.expires_at) return true;
        return new Date(msg.expires_at) > now;
      });

      return { 
        data: { 
          ...conversationWithDetails, 
          messages: filteredMessages.sort((a: any, b: any) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        }, 
        success: true 
      };
    } catch (error) {
      console.error('Error fetching conversation details:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
  }

  /**
   * Save a conversation (make it persistent)
   */
  async saveConversation(conversationId: string): Promise<ChatServiceResponse<boolean>> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('save_conversation', {
        conversation_id: conversationId,
        user_id: user.id
      });

      if (error) throw error;

      return { data: true, success: true };
    } catch (error) {
      console.error('Error saving conversation:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
  }

  // ==================== MESSAGES ====================

  /**
   * Send a message
   */
  async sendMessage(request: SendMessageRequest): Promise<ChatServiceResponse<Message>> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: request.conversation_id,
          sender_id: user.id,
          content: request.content,
          message_type: request.message_type || 'text',
          expires_at: new Date(Date.now() + DEFAULT_CHAT_CONFIG.message_expiration.default_expiration_days * 24 * 60 * 60 * 1000).toISOString()
        })
        .select(`
          *,
          sender:user_profiles(id, full_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Update conversation's updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', request.conversation_id);

      return { data, success: true };
    } catch (error) {
      console.error('Error sending message:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
  }

  /**
   * Save a message (prevent expiration)
   */
  async saveMessage(messageId: string): Promise<ChatServiceResponse<boolean>> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('save_message', {
        message_id: messageId,
        user_id: user.id
      });

      if (error) throw error;

      return { data: true, success: true };
    } catch (error) {
      console.error('Error saving message:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: string, content: string): Promise<ChatServiceResponse<Message>> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .update({ 
          content, 
          edited_at: new Date().toISOString() 
        })
        .eq('id', messageId)
        .select(`
          *,
          sender:user_profiles(id, full_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      return { data, success: true };
    } catch (error) {
      console.error('Error editing message:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<ChatServiceResponse<boolean>> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('messages')
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString(),
          deleted_by: user.id
        })
        .eq('id', messageId);

      if (error) throw error;

      return { data: true, success: true };
    } catch (error) {
      console.error('Error deleting message:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
  }

  // ==================== PRESENCE & TYPING ====================

  /**
   * Update user presence
   */
  async updatePresence(status: 'online' | 'away' | 'busy' | 'offline'): Promise<ChatServiceResponse<boolean>> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('update_user_presence', {
        target_user_id: user.id,
        new_status: status
      });

      if (error) throw error;

      return { data: true, success: true };
    } catch (error) {
      console.error('Error updating presence:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
  }

  /**
   * Set typing indicator
   */
  async setTypingIndicator(conversationId: string): Promise<ChatServiceResponse<boolean>> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('set_typing_indicator', {
        target_conversation_id: conversationId,
        target_user_id: user.id
      });

      if (error) throw error;

      return { data: true, success: true };
    } catch (error) {
      console.error('Error setting typing indicator:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
  }

  /**
   * Get user presence
   */
  async getUserPresence(userIds: string[]): Promise<ChatServiceResponse<UserPresence[]>> {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .in('user_id', userIds);

      if (error) throw error;

      return { data: data || [], success: true };
    } catch (error) {
      console.error('Error fetching user presence:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  /**
   * Subscribe to conversation messages
   */
  subscribeToConversation(conversationId: string, callbacks: {
    onMessage?: (message: Message) => void;
    onTyping?: (typing: TypingIndicator) => void;
    onPresence?: (presence: UserPresence) => void;
  }) {
    const subscriptionKey = `conversation_${conversationId}`;
    
    // Unsubscribe if already subscribed
    this.unsubscribeFromConversation(conversationId);

    const subscription = supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        if (callbacks.onMessage) {
          callbacks.onMessage(payload.new as Message);
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'typing_indicators',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        if (callbacks.onTyping) {
          callbacks.onTyping(payload.new as TypingIndicator);
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_presence'
      }, (payload) => {
        if (callbacks.onPresence) {
          callbacks.onPresence(payload.new as UserPresence);
        }
      })
      .subscribe();

    this.realtimeSubscriptions.set(subscriptionKey, subscription);
  }

  /**
   * Unsubscribe from conversation
   */
  unsubscribeFromConversation(conversationId: string) {
    const subscriptionKey = `conversation_${conversationId}`;
    const subscription = this.realtimeSubscriptions.get(subscriptionKey);
    
    if (subscription) {
      supabase.removeChannel(subscription);
      this.realtimeSubscriptions.delete(subscriptionKey);
    }
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup() {
    this.realtimeSubscriptions.forEach((subscription) => {
      supabase.removeChannel(subscription);
    });
    this.realtimeSubscriptions.clear();
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(messageIds: string[]): Promise<ChatServiceResponse<boolean>> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const readReceipts = messageIds.map(messageId => ({
        message_id: messageId,
        user_id: user.id
      }));

      const { error } = await supabase
        .from('message_read_receipts')
        .upsert(readReceipts, { onConflict: 'message_id,user_id' });

      if (error) throw error;

      return { data: true, success: true };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats(daysBack: number = 7): Promise<ChatServiceResponse<any>> {
    try {
      const { data, error } = await supabase.rpc('get_cleanup_stats', {
        days_back: daysBack
      });

      if (error) throw error;

      return { data: data?.[0] || null, success: true };
    } catch (error) {
      console.error('Error fetching cleanup stats:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
  }

  /**
   * Manually trigger cleanup (for testing)
   */
  async manualCleanup(): Promise<ChatServiceResponse<any>> {
    try {
      const { data, error } = await supabase.rpc('manual_chat_cleanup');

      if (error) throw error;

      return { data: data?.[0] || null, success: true };
    } catch (error) {
      console.error('Error running manual cleanup:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
  }
}

// Export singleton instance
export const chatService = ChatService.getInstance();

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
  CreateConversationRequest,
  SendMessageRequest,
  UpdatePresenceRequest,
  ChatServiceResponse,
  MessageReadReceipt,
  DEFAULT_CHAT_CONFIG
} from '../types/chat';

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
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants!inner(
            *,
            user:profiles(id, email, full_name, avatar_url)
          ),
          last_message:messages(
            id, content, created_at, sender_id, message_type,
            sender:profiles(full_name)
          )
        `)
        .eq('conversation_participants.user_id', (await supabase.auth.getUser()).data.user?.id)
        .is('conversation_participants.left_at', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;

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
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            *,
            user:profiles(id, email, full_name, avatar_url)
          ),
          messages(
            *,
            sender:profiles(id, full_name, avatar_url),
            read_receipts:message_read_receipts(
              *,
              user:profiles(id, full_name, avatar_url)
            )
          ),
          typing_users:typing_indicators(
            *,
            user:profiles(id, full_name)
          )
        `)
        .eq('id', conversationId)
        .single();

      if (error) throw error;

      // Filter out expired messages unless they're saved or conversation is persistent
      const now = new Date();
      const filteredMessages = data.messages.filter((msg: any) => {
        if (data.is_persistent || msg.is_saved) return true;
        if (!msg.expires_at) return true;
        return new Date(msg.expires_at) > now;
      });

      return { 
        data: { 
          ...data, 
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
          sender:profiles(id, full_name, avatar_url)
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
          sender:profiles(id, full_name, avatar_url)
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
  async updatePresence(status: UpdatePresenceRequest['status']): Promise<ChatServiceResponse<boolean>> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.rpc('update_user_presence', {
        user_id: user.id,
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
        conversation_id: conversationId,
        user_id: user.id
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

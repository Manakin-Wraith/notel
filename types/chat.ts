// Chat System TypeScript Types
// Created: 2025-07-30
// Matches database schema with message expiration and persistence features

export interface Conversation {
  id: string;
  name?: string;
  type: 'direct' | 'group';
  created_by: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  // Persistence settings
  is_persistent: boolean;
  saved_by?: string;
  saved_at?: string;
  // Computed fields
  participants?: ConversationParticipant[];
  last_message?: Message;
  unread_count?: number;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  left_at?: string;
  role: 'admin' | 'member';
  notifications_enabled: boolean;
  // User profile data (joined from profiles)
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  created_at: string;
  updated_at: string;
  edited_at?: string;
  // Expiration and persistence
  expires_at?: string;
  is_saved: boolean;
  saved_by?: string;
  saved_at?: string;
  // Status
  is_deleted: boolean;
  deleted_at?: string;
  deleted_by?: string;
  // Computed fields
  sender?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  read_receipts?: MessageReadReceipt[];
  is_read?: boolean;
}

export interface UserPresence {
  user_id: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_seen: string;
  updated_at: string;
}

export interface TypingIndicator {
  id: string;
  conversation_id: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  // User data
  user?: {
    id: string;
    full_name?: string;
  };
}

export interface MessageReadReceipt {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
  // User data
  user?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface ChatCleanupLog {
  id: string;
  messages_deleted: number;
  typing_indicators_cleaned: number;
  executed_at: string;
}

// API Request/Response types
export interface CreateConversationRequest {
  name?: string;
  type: 'direct' | 'group';
  participant_ids: string[];
}

export interface SendMessageRequest {
  conversation_id: string;
  content: string;
  message_type?: 'text' | 'image' | 'file';
}

export interface UpdatePresenceRequest {
  status: 'online' | 'away' | 'busy' | 'offline';
}

export interface SaveMessageRequest {
  message_id: string;
}

export interface SaveConversationRequest {
  conversation_id: string;
}

// Real-time event types
export interface ChatRealtimeEvent {
  type: 'message' | 'typing' | 'presence' | 'conversation_updated';
  payload: any;
}

export interface MessageRealtimeEvent extends ChatRealtimeEvent {
  type: 'message';
  payload: {
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    message: Message;
  };
}

export interface TypingRealtimeEvent extends ChatRealtimeEvent {
  type: 'typing';
  payload: {
    action: 'INSERT' | 'DELETE';
    typing_indicator: TypingIndicator;
  };
}

export interface PresenceRealtimeEvent extends ChatRealtimeEvent {
  type: 'presence';
  payload: {
    action: 'UPDATE';
    presence: UserPresence;
  };
}

// Chat service response types
export interface ChatServiceResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface ConversationWithDetails extends Conversation {
  participants: ConversationParticipant[];
  messages: Message[];
  typing_users: TypingIndicator[];
}

// Message expiration settings
export interface MessageExpirationSettings {
  default_expiration_days: number;
  max_expiration_days: number;
  allow_persistent_conversations: boolean;
  allow_message_saving: boolean;
}

// Chat system configuration
export interface ChatConfig {
  message_expiration: MessageExpirationSettings;
  max_conversation_participants: number;
  max_message_length: number;
  typing_indicator_timeout_seconds: number;
  presence_update_interval_seconds: number;
  cleanup_interval_hours: number;
}

// Default configuration
export const DEFAULT_CHAT_CONFIG: ChatConfig = {
  message_expiration: {
    default_expiration_days: 7,
    max_expiration_days: 30,
    allow_persistent_conversations: true,
    allow_message_saving: true,
  },
  max_conversation_participants: 50,
  max_message_length: 2000,
  typing_indicator_timeout_seconds: 10,
  presence_update_interval_seconds: 30,
  cleanup_interval_hours: 6,
};

// Utility types for chat operations
export type ConversationSortBy = 'updated_at' | 'created_at' | 'name';
export type MessageSortBy = 'created_at' | 'updated_at';
export type PresenceStatus = UserPresence['status'];
export type MessageType = Message['message_type'];
export type ConversationType = Conversation['type'];
export type ParticipantRole = ConversationParticipant['role'];

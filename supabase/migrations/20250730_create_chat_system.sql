-- Chat System with Message Expiration and Selective Persistence
-- Created: 2025-07-30
-- Features: Auto-delete messages, save important chats, presence tracking

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT, -- Optional name for group chats
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')) DEFAULT 'direct',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE,
  -- Persistence settings
  is_persistent BOOLEAN DEFAULT FALSE, -- If true, messages won't auto-delete
  saved_by UUID REFERENCES auth.users(id), -- User who saved this conversation
  saved_at TIMESTAMP WITH TIME ZONE
);

-- Conversation participants
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  -- Notification preferences
  notifications_enabled BOOLEAN DEFAULT TRUE,
  UNIQUE(conversation_id, user_id)
);

-- Messages table with expiration
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE,
  
  -- Expiration and persistence
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'), -- Default 7-day expiration
  is_saved BOOLEAN DEFAULT FALSE, -- Individual message can be saved
  saved_by UUID REFERENCES auth.users(id), -- User who saved this message
  saved_at TIMESTAMP WITH TIME ZONE,
  
  -- Message status
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES auth.users(id)
);

-- User presence tracking
CREATE TABLE user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('online', 'away', 'busy', 'offline')) DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Typing indicators (temporary data, auto-cleanup)
CREATE TABLE typing_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 seconds'),
  UNIQUE(conversation_id, user_id)
);

-- Message read receipts
CREATE TABLE message_read_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_conversations_created_by ON conversations(created_by);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at);
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_expires_at ON messages(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_user_presence_status ON user_presence(status);
CREATE INDEX idx_typing_indicators_expires_at ON typing_indicators(expires_at);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_presence_updated_at BEFORE UPDATE ON user_presence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired messages
CREATE OR REPLACE FUNCTION cleanup_expired_messages()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired messages that are not saved and not in persistent conversations
    DELETE FROM messages 
    WHERE expires_at < NOW() 
      AND is_saved = FALSE 
      AND conversation_id NOT IN (
          SELECT id FROM conversations WHERE is_persistent = TRUE
      );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up expired typing indicators
    DELETE FROM typing_indicators WHERE expires_at < NOW();
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to save a message (prevent expiration)
CREATE OR REPLACE FUNCTION save_message(message_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE messages 
    SET is_saved = TRUE, 
        saved_by = user_id, 
        saved_at = NOW()
    WHERE id = message_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to save an entire conversation (make persistent)
CREATE OR REPLACE FUNCTION save_conversation(conversation_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE conversations 
    SET is_persistent = TRUE, 
        saved_by = user_id, 
        saved_at = NOW()
    WHERE id = conversation_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(user_id UUID, new_status TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_presence (user_id, status, last_seen, updated_at)
    VALUES (user_id, new_status, NOW(), NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        status = new_status,
        last_seen = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to set typing indicator
CREATE OR REPLACE FUNCTION set_typing_indicator(conversation_id UUID, user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO typing_indicators (conversation_id, user_id, created_at, expires_at)
    VALUES (conversation_id, user_id, NOW(), NOW() + INTERVAL '10 seconds')
    ON CONFLICT (conversation_id, user_id) 
    DO UPDATE SET 
        created_at = NOW(),
        expires_at = NOW() + INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE conversations IS 'Chat conversations with optional persistence';
COMMENT ON TABLE messages IS 'Messages with automatic expiration unless saved';
COMMENT ON TABLE user_presence IS 'Real-time user presence status';
COMMENT ON TABLE typing_indicators IS 'Temporary typing indicators with auto-cleanup';
COMMENT ON COLUMN messages.expires_at IS 'When message will be auto-deleted (unless saved)';
COMMENT ON COLUMN messages.is_saved IS 'Prevents auto-deletion when true';
COMMENT ON COLUMN conversations.is_persistent IS 'Prevents message auto-deletion for entire conversation';

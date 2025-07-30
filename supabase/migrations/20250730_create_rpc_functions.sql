-- RPC Functions for Chat System
-- Created: 2025-07-30
-- Provides helper functions for presence management and other chat operations

-- Function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(
  user_id UUID,
  new_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update user presence
  INSERT INTO user_presence (user_id, status, last_seen)
  VALUES (user_id, new_status, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    last_seen = EXCLUDED.last_seen,
    updated_at = NOW();
END;
$$;

-- Function to get conversation participants with user details
CREATE OR REPLACE FUNCTION get_conversation_participants(
  conversation_id UUID
)
RETURNS TABLE (
  user_id UUID,
  role TEXT,
  joined_at TIMESTAMPTZ,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.user_id,
    cp.role,
    cp.joined_at,
    p.full_name,
    p.email,
    p.avatar_url
  FROM conversation_participants cp
  JOIN profiles p ON cp.user_id = p.id
  WHERE cp.conversation_id = get_conversation_participants.conversation_id
    AND cp.left_at IS NULL;
END;
$$;

-- Function to get conversation with last message
CREATE OR REPLACE FUNCTION get_conversation_with_last_message(
  conversation_id UUID
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  created_by UUID,
  is_persistent BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_message_id UUID,
  last_message_content TEXT,
  last_message_created_at TIMESTAMPTZ,
  last_message_sender_id UUID,
  last_message_sender_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.type,
    c.created_by,
    c.is_persistent,
    c.created_at,
    c.updated_at,
    m.id as last_message_id,
    m.content as last_message_content,
    m.created_at as last_message_created_at,
    m.sender_id as last_message_sender_id,
    p.full_name as last_message_sender_name
  FROM conversations c
  LEFT JOIN LATERAL (
    SELECT id, content, created_at, sender_id
    FROM messages 
    WHERE conversation_id = c.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) m ON true
  LEFT JOIN profiles p ON m.sender_id = p.id
  WHERE c.id = get_conversation_with_last_message.conversation_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_user_presence(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_participants(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_with_last_message(UUID) TO authenticated;

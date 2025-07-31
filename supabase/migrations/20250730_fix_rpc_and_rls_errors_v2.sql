-- Fix RPC and RLS Policy Errors (Version 2)
-- Created: 2025-07-30
-- Fixes ambiguous column reference in update_user_presence and infinite recursion in RLS policies
-- Handles existing policies gracefully

-- Fix 1: Update the update_user_presence RPC function to avoid ambiguous column references
DROP FUNCTION IF EXISTS update_user_presence(UUID, TEXT);

CREATE OR REPLACE FUNCTION update_user_presence(
  p_user_id UUID,
  p_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update user presence with explicit parameter names
  INSERT INTO user_presence (user_id, status, last_seen)
  VALUES (p_user_id, p_status, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    last_seen = EXCLUDED.last_seen,
    updated_at = NOW();
END;
$$;

-- Fix 2: Drop ALL existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Conversation creators and admins can update conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations they're invited to" ON conversation_participants;
DROP POLICY IF EXISTS "Users can leave conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Users can edit their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- Recreate conversation policies (simple, no recursion)
CREATE POLICY "Users can view conversations they participate in" ON conversations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp 
    WHERE cp.conversation_id = conversations.id 
    AND cp.user_id = auth.uid() 
    AND cp.left_at IS NULL
  )
);

CREATE POLICY "Users can create conversations" ON conversations
FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update conversations they created" ON conversations
FOR UPDATE USING (created_by = auth.uid());

-- Recreate conversation_participants policies (avoid self-reference)
CREATE POLICY "Users can view conversation participants for their conversations" ON conversation_participants
FOR SELECT USING (
  -- User can see participants of conversations they're part of
  conversation_id IN (
    SELECT cp2.conversation_id 
    FROM conversation_participants cp2 
    WHERE cp2.user_id = auth.uid() 
    AND cp2.left_at IS NULL
  )
);

CREATE POLICY "Users can insert themselves as participants" ON conversation_participants
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participation" ON conversation_participants
FOR UPDATE USING (user_id = auth.uid());

-- Recreate messages policies (no recursion)
CREATE POLICY "Users can view messages in their conversations" ON messages
FOR SELECT USING (
  conversation_id IN (
    SELECT cp.conversation_id 
    FROM conversation_participants cp 
    WHERE cp.user_id = auth.uid() 
    AND cp.left_at IS NULL
  )
);

CREATE POLICY "Users can insert messages in their conversations" ON messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  conversation_id IN (
    SELECT cp.conversation_id 
    FROM conversation_participants cp 
    WHERE cp.user_id = auth.uid() 
    AND cp.left_at IS NULL
  )
);

CREATE POLICY "Users can update their own messages" ON messages
FOR UPDATE USING (sender_id = auth.uid());

-- Fix 3: Update other RPC functions to use explicit parameter names
DROP FUNCTION IF EXISTS get_conversation_participants(UUID);

CREATE OR REPLACE FUNCTION get_conversation_participants(
  p_conversation_id UUID
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
  WHERE cp.conversation_id = p_conversation_id
    AND cp.left_at IS NULL;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_user_presence(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_participants(UUID) TO authenticated;

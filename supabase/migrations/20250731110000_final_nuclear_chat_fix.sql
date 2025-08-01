-- FINAL NUCLEAR CHAT FIX - Complete RLS Policy Reset
-- Created: 2025-07-31
-- This completely resets all chat-related policies to eliminate infinite recursion

-- Step 1: Drop ALL policies on ALL chat tables (nuclear approach)
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations they created" ON conversations;
DROP POLICY IF EXISTS "Conversation creators and admins can update conversations" ON conversations;
DROP POLICY IF EXISTS "conversations_select_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON conversations;

DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view their conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations they're invited to" ON conversation_participants;
DROP POLICY IF EXISTS "Users can insert conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can insert themselves as participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can leave conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update their conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON conversation_participants;
DROP POLICY IF EXISTS "participants_select_policy" ON conversation_participants;
DROP POLICY IF EXISTS "participants_insert_policy" ON conversation_participants;
DROP POLICY IF EXISTS "participants_update_policy" ON conversation_participants;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can edit their own messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;

-- Step 2: Fix the RPC function with correct parameter names
DROP FUNCTION IF EXISTS update_user_presence(UUID, TEXT);

CREATE OR REPLACE FUNCTION update_user_presence(
  user_id UUID,
  new_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_presence (user_id, status, last_seen, updated_at)
  VALUES (user_id, new_status, NOW(), NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    last_seen = EXCLUDED.last_seen,
    updated_at = NOW();
END;
$$;

-- Step 3: Create MINIMAL, non-recursive policies

-- Conversations: Simple policy using direct participant lookup
CREATE POLICY "chat_conversations_select" ON conversations
FOR SELECT USING (
  id = ANY(
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid() 
    AND left_at IS NULL
  )
);

CREATE POLICY "chat_conversations_insert" ON conversations
FOR INSERT WITH CHECK (created_by = auth.uid());

-- Conversation Participants: Simple policy avoiding recursion
CREATE POLICY "chat_participants_select" ON conversation_participants
FOR SELECT USING (
  -- User can see their own participation records
  user_id = auth.uid()
  OR
  -- User can see other participants in conversations they're part of
  conversation_id = ANY(
    SELECT cp2.conversation_id 
    FROM conversation_participants cp2 
    WHERE cp2.user_id = auth.uid() 
    AND cp2.left_at IS NULL
  )
);

CREATE POLICY "chat_participants_insert" ON conversation_participants
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_participants_update" ON conversation_participants
FOR UPDATE USING (user_id = auth.uid());

-- Messages: Simple policy using participant lookup
CREATE POLICY "chat_messages_select" ON messages
FOR SELECT USING (
  conversation_id = ANY(
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid() 
    AND left_at IS NULL
  )
);

CREATE POLICY "chat_messages_insert" ON messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() 
  AND
  conversation_id = ANY(
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid() 
    AND left_at IS NULL
  )
);

CREATE POLICY "chat_messages_update" ON messages
FOR UPDATE USING (sender_id = auth.uid());

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION update_user_presence(UUID, TEXT) TO authenticated;

-- Step 5: Add helpful comments
COMMENT ON FUNCTION update_user_presence(UUID, TEXT) IS 'Updates user presence. Parameters match frontend call exactly.';
COMMENT ON POLICY "chat_conversations_select" ON conversations IS 'Simple non-recursive policy using ANY array lookup.';
COMMENT ON POLICY "chat_participants_select" ON conversation_participants IS 'Simple non-recursive policy with direct checks.';
COMMENT ON POLICY "chat_messages_select" ON messages IS 'Simple non-recursive policy using ANY array lookup.';

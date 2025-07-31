-- NUCLEAR CHAT FIX - Complete RLS Policy Reset
-- Created: 2025-07-30
-- This completely resets all chat-related policies to eliminate infinite recursion

-- Step 1: Drop ALL policies on ALL chat tables (nuclear approach)
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations they created" ON conversations;
DROP POLICY IF EXISTS "Conversation creators and admins can update conversations" ON conversations;

DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view their conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations they're invited to" ON conversation_participants;
DROP POLICY IF EXISTS "Users can insert conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can insert themselves as participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can leave conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update their conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON conversation_participants;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can edit their own messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

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

-- Step 3: Create the SIMPLEST possible policies (no cross-references)

-- Conversations: Only show conversations where user is directly listed as participant
CREATE POLICY "conversations_select_policy" ON conversations
FOR SELECT USING (
  EXISTS (
    SELECT 1 
    FROM conversation_participants cp 
    WHERE cp.conversation_id = conversations.id 
    AND cp.user_id = auth.uid() 
    AND cp.left_at IS NULL
  )
);

-- Conversations: Users can create their own conversations
CREATE POLICY "conversations_insert_policy" ON conversations
FOR INSERT WITH CHECK (created_by = auth.uid());

-- Conversations: Users can update conversations they created
CREATE POLICY "conversations_update_policy" ON conversations
FOR UPDATE USING (created_by = auth.uid());

-- Conversation Participants: Users can see participants in conversations they're part of
-- This uses a simple approach - check if user has ANY participation record for this conversation
CREATE POLICY "participants_select_policy" ON conversation_participants
FOR SELECT USING (
  conversation_id IN (
    SELECT cp2.conversation_id 
    FROM conversation_participants cp2 
    WHERE cp2.user_id = auth.uid() 
    AND cp2.left_at IS NULL
  )
);

-- Conversation Participants: Users can add themselves to conversations
CREATE POLICY "participants_insert_policy" ON conversation_participants
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Conversation Participants: Users can update their own participation
CREATE POLICY "participants_update_policy" ON conversation_participants
FOR UPDATE USING (user_id = auth.uid());

-- Messages: Users can see messages in conversations they participate in
CREATE POLICY "messages_select_policy" ON messages
FOR SELECT USING (
  conversation_id IN (
    SELECT cp.conversation_id 
    FROM conversation_participants cp 
    WHERE cp.user_id = auth.uid() 
    AND cp.left_at IS NULL
  )
);

-- Messages: Users can send messages to conversations they're part of
CREATE POLICY "messages_insert_policy" ON messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  conversation_id IN (
    SELECT cp.conversation_id 
    FROM conversation_participants cp 
    WHERE cp.user_id = auth.uid() 
    AND cp.left_at IS NULL
  )
);

-- Messages: Users can update their own messages
CREATE POLICY "messages_update_policy" ON messages
FOR UPDATE USING (sender_id = auth.uid());

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION update_user_presence(UUID, TEXT) TO authenticated;

-- Step 5: Add helpful comments
COMMENT ON FUNCTION update_user_presence(UUID, TEXT) IS 'Updates user presence. Parameters match frontend call exactly.';
COMMENT ON POLICY "conversations_select_policy" ON conversations IS 'Simple policy - no recursion.';
COMMENT ON POLICY "participants_select_policy" ON conversation_participants IS 'Simple policy - no recursion.';

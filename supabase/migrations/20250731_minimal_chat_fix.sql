-- MINIMAL CHAT FIX - Absolute Simplest Approach
-- Created: 2025-07-31
-- This uses the absolute minimum policies to eliminate ALL recursion

-- Step 1: DISABLE RLS temporarily to clear everything
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies completely
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all policies on conversations
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'conversations') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON conversations';
    END LOOP;
    
    -- Drop all policies on conversation_participants
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'conversation_participants') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON conversation_participants';
    END LOOP;
    
    -- Drop all policies on messages
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'messages') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON messages';
    END LOOP;
    
    -- Drop all policies on user_presence
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_presence') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON user_presence';
    END LOOP;
END $$;

-- Step 3: Fix RPC function with exact parameter names
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

-- Step 4: Create ULTRA-SIMPLE policies (no joins, no subqueries)

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Conversations: Only show if user created it (simplest possible)
CREATE POLICY "conversations_simple" ON conversations
FOR ALL USING (created_by = auth.uid());

-- Participants: Only show user's own participation records
CREATE POLICY "participants_simple" ON conversation_participants
FOR ALL USING (user_id = auth.uid());

-- Messages: Only show messages user sent (simplest possible)
CREATE POLICY "messages_simple" ON messages
FOR ALL USING (sender_id = auth.uid());

-- User presence: Allow all authenticated users to see all presence
CREATE POLICY "presence_simple" ON user_presence
FOR ALL USING (true);

-- Step 5: Grant permissions
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversation_participants TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON user_presence TO authenticated;
GRANT ALL ON user_profiles TO authenticated;

GRANT EXECUTE ON FUNCTION update_user_presence(UUID, TEXT) TO authenticated;

-- Step 6: Add helpful comments
COMMENT ON POLICY "conversations_simple" ON conversations IS 'Ultra-simple: only creator can see conversation';
COMMENT ON POLICY "participants_simple" ON conversation_participants IS 'Ultra-simple: only own participation records';
COMMENT ON POLICY "messages_simple" ON messages IS 'Ultra-simple: only own messages';
COMMENT ON POLICY "presence_simple" ON user_presence IS 'Ultra-simple: all users can see all presence';

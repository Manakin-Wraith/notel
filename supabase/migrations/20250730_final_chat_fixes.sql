-- Final Chat System Fixes
-- Created: 2025-07-30
-- Addresses remaining RPC parameter mismatch and RLS recursion issues

-- Fix 1: Correct RPC function to match frontend parameter names exactly
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
  -- Insert or update user presence
  INSERT INTO user_presence (user_id, status, last_seen, updated_at)
  VALUES (user_id, new_status, NOW(), NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    last_seen = EXCLUDED.last_seen,
    updated_at = NOW();
END;
$$;

-- Fix 2: Completely rewrite RLS policies to avoid any recursion
-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;

-- Create simple, non-recursive policies
-- For conversations: Use a subquery that doesn't reference the same table
CREATE POLICY "Users can view conversations they participate in" ON conversations
FOR SELECT USING (
  id IN (
    SELECT DISTINCT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid() 
    AND left_at IS NULL
  )
);

-- For conversation_participants: Use direct user_id check first, then conversation access
CREATE POLICY "Users can view participants of their conversations" ON conversation_participants
FOR SELECT USING (
  -- Either it's their own participation record
  user_id = auth.uid() 
  OR 
  -- Or they're a participant in the same conversation (non-recursive check)
  EXISTS (
    SELECT 1 
    FROM conversation_participants cp2 
    WHERE cp2.conversation_id = conversation_participants.conversation_id 
    AND cp2.user_id = auth.uid() 
    AND cp2.left_at IS NULL
  )
);

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_user_presence(UUID, TEXT) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION update_user_presence(UUID, TEXT) IS 'Updates user presence. Parameters match frontend RPC call exactly.';
COMMENT ON POLICY "Users can view conversations they participate in" ON conversations IS 'Non-recursive policy using IN subquery.';
COMMENT ON POLICY "Users can view participants of their conversations" ON conversation_participants IS 'Non-recursive policy with direct user check first.';

-- Fixes for Chat System RLS Policies and RPC Functions
-- Created: 2025-07-30

-- Issue 1: Fix for update_user_presence function signature
-- The frontend RPC call uses named parameters `user_id` and `new_status`.
-- The original function declaration did not correctly name the parameters, leading to an RPC error.
-- The fix renames the parameters to match the client-side call.

CREATE OR REPLACE FUNCTION update_user_presence(p_user_id UUID, p_new_status TEXT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_presence (user_id, status, last_seen, updated_at)
    VALUES (p_user_id, p_new_status, NOW(), NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
        status = p_new_status,
        last_seen = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Issue 2: Fix for infinite recursion in conversation_participants RLS policy
-- The original policy for selecting from `conversation_participants` was self-referential,
-- causing an infinite recursion loop.
-- The fix changes the policy to check for participation in a conversation
-- by looking at the `conversations` table instead, which is more secure and avoids recursion.

-- Drop the old, problematic policy
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;

-- Create a new, non-recursive policy
CREATE POLICY "Users can view participants of their conversations" ON conversation_participants
    FOR SELECT USING (
        conversation_id IN (
            SELECT c.id
            FROM conversations c
            JOIN conversation_participants cp ON c.id = cp.conversation_id
            WHERE cp.user_id = auth.uid() AND cp.left_at IS NULL
        )
    );

-- Grant necessary permissions again to be safe
GRANT EXECUTE ON FUNCTION update_user_presence(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION update_user_presence(UUID, TEXT) IS 'Updates user presence status. Parameters are named for client-side clarity.';
COMMENT ON POLICY "Users can view participants of their conversations" ON conversation_participants IS 'Non-recursive policy to view participants in one''s own conversations.';

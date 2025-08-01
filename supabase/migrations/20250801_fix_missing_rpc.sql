-- Fix Missing RPC Functions
-- Created: 2025-08-01
-- Ensures update_user_presence and set_typing_indicator RPC functions exist

-- Drop functions if exist (to handle any conflicts)
DROP FUNCTION IF EXISTS update_user_presence(uuid, text);
DROP FUNCTION IF EXISTS set_typing_indicator(uuid, uuid);

-- Create the update_user_presence RPC function
CREATE OR REPLACE FUNCTION update_user_presence(target_user_id uuid, new_status text)
RETURNS void AS $$
BEGIN
  INSERT INTO user_presence (user_id, status, last_seen, updated_at)
  VALUES (target_user_id, new_status, NOW(), NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    last_seen = EXCLUDED.last_seen,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the set_typing_indicator RPC function
CREATE OR REPLACE FUNCTION set_typing_indicator(target_conversation_id uuid, target_user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO typing_indicators (conversation_id, user_id, created_at, expires_at)
  VALUES (target_conversation_id, target_user_id, NOW(), NOW() + INTERVAL '10 seconds')
  ON CONFLICT (conversation_id, user_id)
  DO UPDATE SET
    created_at = NOW(),
    expires_at = NOW() + INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_presence(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION set_typing_indicator(uuid, uuid) TO authenticated;

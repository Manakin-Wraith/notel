-- Fix Missing RPC Function
-- Created: 2025-08-01
-- Ensures update_user_presence RPC function exists

-- Drop function if exists (to handle any conflicts)
DROP FUNCTION IF EXISTS update_user_presence(UUID, TEXT);

-- Create the update_user_presence RPC function
CREATE OR REPLACE FUNCTION update_user_presence(
  target_user_id UUID,
  new_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_presence (user_id, status, last_seen, updated_at)
  VALUES (target_user_id, new_status, NOW(), NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    last_seen = EXCLUDED.last_seen,
    updated_at = NOW();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_presence(UUID, TEXT) TO authenticated;

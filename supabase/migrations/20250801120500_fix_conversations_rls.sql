-- Fix Conversations RLS Policies
-- Created: 2025-08-01
-- Ensures users can create conversations while maintaining security

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "chat_conversations_insert" ON conversations;

-- Create proper insert policy for conversations
CREATE POLICY "chat_conversations_insert" ON conversations
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Add helpful comment
COMMENT ON POLICY "chat_conversations_insert" ON conversations IS 'Users can create conversations where they are the creator.';

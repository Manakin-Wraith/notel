-- Migration script to update existing sharing schema for pending invitations
-- Run this in Supabase SQL Editor

-- First, backup existing share_access data (if any)
CREATE TABLE IF NOT EXISTS share_access_backup AS 
SELECT * FROM share_access;

-- Drop existing share_access table and recreate with new structure
DROP TABLE IF EXISTS share_access CASCADE;

-- Recreate share_access table with pending invitation support
CREATE TABLE share_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('page', 'event')),
  user_id TEXT NOT NULL, -- Can be UUID for existing users or 'pending_email' for invitations
  user_email TEXT, -- Store email for pending invitations
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit', 'admin')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_pending BOOLEAN DEFAULT false, -- Track if this is a pending invitation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique access per user per resource
  UNIQUE(resource_id, resource_type, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_share_access_resource ON share_access(resource_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_share_access_user ON share_access(user_id);
CREATE INDEX IF NOT EXISTS idx_share_access_pending ON share_access(is_pending) WHERE is_pending = true;
CREATE INDEX IF NOT EXISTS idx_share_access_email ON share_access(user_email) WHERE user_email IS NOT NULL;

-- Enable RLS
ALTER TABLE share_access ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage share access for their resources" ON share_access;
DROP POLICY IF EXISTS "Users can view share access for resources they have access to" ON share_access;

-- Create RLS policies for share_access
CREATE POLICY "Users can manage share access for their resources" ON share_access
  FOR ALL USING (
    invited_by = auth.uid() OR
    user_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM share_links sl 
      WHERE sl.resource_id = share_access.resource_id 
      AND sl.resource_type = share_access.resource_type 
      AND sl.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can view share access for resources they have access to" ON share_access
  FOR SELECT USING (
    user_id = auth.uid()::text OR
    invited_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM share_links sl 
      WHERE sl.resource_id = share_access.resource_id 
      AND sl.resource_type = share_access.resource_type 
      AND (sl.is_public = true OR sl.created_by = auth.uid())
    )
  );

-- Restore any backed up data (modify user_id format if needed)
-- INSERT INTO share_access (resource_id, resource_type, user_id, permission, invited_by, is_pending, created_at, updated_at)
-- SELECT resource_id, resource_type, user_id::text, permission, invited_by, false, created_at, updated_at
-- FROM share_access_backup;

-- Clean up backup table (uncomment when ready)
-- DROP TABLE share_access_backup;

-- Verify the migration
SELECT 'Migration completed successfully' as status;

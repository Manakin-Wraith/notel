-- Fix RLS policies to properly handle pending invitations
-- Run this in Supabase SQL Editor after the migration

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can manage share access for their resources" ON share_access;
DROP POLICY IF EXISTS "Users can view share access for resources they have access to" ON share_access;

-- Create updated policies that handle pending invitations properly
CREATE POLICY "Users can manage share access for their resources" ON share_access
  FOR ALL USING (
    -- User created the invitation
    invited_by = auth.uid() OR
    -- User is the target of the invitation (for existing users)
    (NOT is_pending AND user_id = auth.uid()::text) OR
    -- User owns the resource being shared
    EXISTS (
      SELECT 1 FROM share_links sl 
      WHERE sl.resource_id = share_access.resource_id 
      AND sl.resource_type = share_access.resource_type 
      AND sl.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can view share access for resources they have access to" ON share_access
  FOR SELECT USING (
    -- User is the target of the invitation (for existing users)
    (NOT is_pending AND user_id = auth.uid()::text) OR
    -- User created the invitation
    invited_by = auth.uid() OR
    -- Resource has a public share link OR user owns the resource
    EXISTS (
      SELECT 1 FROM share_links sl 
      WHERE sl.resource_id = share_access.resource_id 
      AND sl.resource_type = share_access.resource_type 
      AND (sl.is_public = true OR sl.created_by = auth.uid())
    )
  );

-- Allow resource owners to see all access records for their resources (including pending)
CREATE POLICY "Resource owners can view all access records" ON share_access
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM share_links sl 
      WHERE sl.resource_id = share_access.resource_id 
      AND sl.resource_type = share_access.resource_type 
      AND sl.created_by = auth.uid()
    )
  );

SELECT 'RLS policies updated successfully' as status;

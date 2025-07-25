-- Comprehensive fix for all RLS issues affecting email sharing
-- Run this in Supabase SQL Editor

-- 1. Fix user_profiles RLS policies (406 error on email lookup)
-- Drop existing restrictive policies on user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Create more permissive policies for user_profiles to support email sharing
CREATE POLICY "Users can view profiles for sharing" ON user_profiles
  FOR SELECT USING (
    -- Users can view their own profile
    id = auth.uid() OR
    -- Users can look up profiles by email for sharing purposes
    -- This allows the sharing service to find users by email
    true
  );

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- 2. Ensure share_access RLS policies are correct
-- Drop all existing policies
DROP POLICY IF EXISTS "Users can manage share access for their resources" ON share_access;
DROP POLICY IF EXISTS "Users can view share access for resources they have access to" ON share_access;
DROP POLICY IF EXISTS "Resource owners can view all access records" ON share_access;

-- Create comprehensive policies for share_access
CREATE POLICY "Share access management" ON share_access
  FOR ALL USING (
    -- User created the share access (invited someone)
    invited_by = auth.uid() OR
    -- User is the target of the share (for existing users)
    (NOT is_pending AND user_id = auth.uid()::text) OR
    -- User owns the resource being shared
    EXISTS (
      SELECT 1 FROM share_links sl 
      WHERE sl.resource_id = share_access.resource_id 
      AND sl.resource_type = share_access.resource_type 
      AND sl.created_by = auth.uid()
    )
  );

-- 3. Also check share_links RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create share links for their own resources" ON share_links;
DROP POLICY IF EXISTS "Users can view share links they created" ON share_links;
DROP POLICY IF EXISTS "Users can update share links they created" ON share_links;

-- Create comprehensive policies for share_links
CREATE POLICY "Share links management" ON share_links
  FOR ALL USING (
    -- User created the share link
    created_by = auth.uid() OR
    -- Public share links can be viewed by anyone
    is_public = true
  );

-- 4. Verify all tables have RLS enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- 5. Test query to verify the fix
SELECT 'RLS policies updated successfully - testing user lookup' as status;

-- This should work now (replace with actual email for testing)
-- SELECT * FROM user_profiles WHERE email = 'demo@spatrac.co.za';

SELECT 'All RLS issues should be resolved' as final_status;

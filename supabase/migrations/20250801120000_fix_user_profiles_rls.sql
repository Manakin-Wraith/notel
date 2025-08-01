-- Fix User Profiles RLS Policies
-- Created: 2025-08-01
-- Ensures user profiles can be automatically created while maintaining security

-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage their own profile" ON user_profiles;

-- Create more permissive policies that still maintain security
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Ensure the trigger function can still create profiles for new users
-- The function already has SECURITY DEFINER so it bypasses RLS
COMMENT ON FUNCTION public.handle_new_user_profile() IS 'Automatically creates user profile on signup. Bypasses RLS due to SECURITY DEFINER.';

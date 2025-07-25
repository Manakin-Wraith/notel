-- Create user profiles for existing users who don't have them yet
-- Run this AFTER running schema_sharing.sql to fix email sharing for existing users

-- Insert profiles for existing auth users who don't have profiles
INSERT INTO user_profiles (id, email, name, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'name', 
    au.raw_user_meta_data->>'full_name',
    split_part(au.email, '@', 1)
  ) as name,
  au.created_at,
  NOW() as updated_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL
  AND au.email IS NOT NULL;

-- Verify the profiles were created
SELECT 
  'Profiles created:' as status,
  COUNT(*) as count
FROM user_profiles;

-- Show all user profiles
SELECT 
  id,
  email,
  name,
  created_at
FROM user_profiles
ORDER BY created_at DESC;

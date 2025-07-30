-- Step 2: Add indexes and RLS (FIXED VERSION)
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own profile" ON user_profiles;

-- Create RLS policies with explicit table qualification
CREATE POLICY "Users can manage their own profile" ON user_profiles
  FOR ALL USING (auth.uid() = user_profiles.user_id);

-- Alternative syntax if the above still fails:
-- CREATE POLICY "Users can manage their own profile" ON user_profiles
--   FOR ALL USING (auth.uid()::text = user_id::text);

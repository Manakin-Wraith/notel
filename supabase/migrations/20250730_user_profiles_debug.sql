-- DEBUGGING VERSION: Run each step separately to isolate the issue

-- Step 2a: Just add the index first
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Step 2b: Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 2c: Try the RLS policy with different syntax options
-- Option 1: Explicit table qualification
CREATE POLICY "Users can manage their own profile" ON user_profiles
  FOR ALL USING (auth.uid() = user_profiles.user_id);

-- If Option 1 fails, try Option 2: Type casting
-- DROP POLICY IF EXISTS "Users can manage their own profile" ON user_profiles;
-- CREATE POLICY "Users can manage their own profile" ON user_profiles
--   FOR ALL USING (auth.uid()::text = user_id::text);

-- If Option 2 fails, try Option 3: Separate policies for different operations
-- DROP POLICY IF EXISTS "Users can manage their own profile" ON user_profiles;
-- CREATE POLICY "Users can view their own profile" ON user_profiles
--   FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Users can update their own profile" ON user_profiles
--   FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "Users can insert their own profile" ON user_profiles
--   FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Users can delete their own profile" ON user_profiles
--   FOR DELETE USING (auth.uid() = user_id);

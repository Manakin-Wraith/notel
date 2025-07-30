-- MINIMAL TEST: Isolate the exact issue
-- Since table creation worked, let's test each component separately

-- Test 1: Just enable RLS without any policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Test 2: Create a simple policy that doesn't reference any columns
-- CREATE POLICY "test_policy" ON user_profiles FOR ALL USING (true);

-- Test 3: Check if the user_id column actually exists and is visible
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'user_profiles' AND column_name = 'user_id';

-- Test 4: Try a policy with explicit schema qualification
-- CREATE POLICY "test_policy_2" ON public.user_profiles 
--   FOR ALL USING (auth.uid() = public.user_profiles.user_id);

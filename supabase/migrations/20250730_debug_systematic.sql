-- SYSTEMATIC DEBUGGING APPROACH
-- Run these one by one to isolate the exact issue

-- Step 1: Verify the table and column exist
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Step 2: Just enable RLS (no policies yet)
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create a simple policy that always allows access (no column references)
-- CREATE POLICY "allow_all_test" ON user_profiles FOR ALL USING (true);

-- Step 4: If Step 3 works, try referencing auth.uid() without user_id
-- DROP POLICY IF EXISTS "allow_all_test" ON user_profiles;
-- CREATE POLICY "auth_test" ON user_profiles FOR ALL USING (auth.uid() IS NOT NULL);

-- Step 5: If Step 4 works, try the actual policy with different syntax variations
-- Option A: Standard syntax
-- CREATE POLICY "user_policy_a" ON user_profiles FOR ALL USING (auth.uid() = user_id);

-- Option B: Explicit table qualification
-- CREATE POLICY "user_policy_b" ON user_profiles FOR ALL USING (auth.uid() = user_profiles.user_id);

-- Option C: Schema qualification
-- CREATE POLICY "user_policy_c" ON public.user_profiles FOR ALL USING (auth.uid() = public.user_profiles.user_id);

-- Option D: Type casting
-- CREATE POLICY "user_policy_d" ON user_profiles FOR ALL USING (auth.uid()::text = user_id::text);

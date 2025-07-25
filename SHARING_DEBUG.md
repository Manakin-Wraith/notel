# 🔧 Email Sharing Debug Guide

## 🐛 Issues Fixed

### 1. Foreign Key Reference Error (400)
**Problem**: Query was using `user_profiles!share_access_user_id_fkey(*)` which failed
**Solution**: Changed to `user_profiles!user_id(*)` to use column name instead of constraint name

### 2. User Profile Missing Error (406)
**Problem**: Users don't have profiles in `user_profiles` table when they sign up
**Solution**: Added database trigger to automatically create user profiles on signup

## 🔄 Updated Database Schema

The `schema_sharing.sql` file now includes:

1. **Automatic User Profile Creation**:
   ```sql
   -- Function to automatically create user profile when user signs up
   CREATE OR REPLACE FUNCTION create_user_profile()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO user_profiles (id, email, name)
     VALUES (
       NEW.id,
       NEW.email,
       COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
     );
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- Trigger to create user profile on signup
   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE FUNCTION create_user_profile();
   ```

## 🚀 How to Apply the Fix

### Step 1: Update Database Schema
1. Open Supabase SQL Editor
2. **IMPORTANT**: Run the updated `schema_sharing.sql` file again
3. This will add the trigger for automatic user profile creation

### Step 2: Test Email Sharing
1. Make sure you have at least 2 user accounts in your app
2. Both users should have signed up through your app (this creates profiles automatically)
3. Try sharing a page/event with the other user's email

### Step 3: Manual Profile Creation (if needed)
If you have existing users without profiles, run this in Supabase SQL Editor:
```sql
-- Create profiles for existing users who don't have them
INSERT INTO user_profiles (id, email, name)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL;
```

## 🧪 Testing Checklist

- [ ] Link creation works ✅ (already confirmed)
- [ ] Link copying works ✅ (already confirmed)
- [ ] Email invitation shows proper error messages
- [ ] Email invitation works for existing users with profiles
- [ ] New user signup automatically creates profile
- [ ] Share access list displays correctly

## 🔍 Debugging Tips

### If email sharing still fails:
1. **Check user exists**: Verify the user you're inviting has signed up
2. **Check profile exists**: Run `SELECT * FROM user_profiles WHERE email = 'user@example.com'`
3. **Check browser console**: Look for specific error messages
4. **Check Supabase logs**: Go to Logs > API in your Supabase dashboard

### Common Error Messages:
- `"User not found. They need to sign up and create a profile first."` - User hasn't signed up yet
- `"Failed to create user profile"` - Database permissions issue
- `"User not authenticated"` - Current user not logged in

## 🎯 Expected Behavior

After applying the fix:
1. **Link sharing**: ✅ Works (already confirmed)
2. **Email invitations**: Should work for users who have signed up
3. **User profiles**: Automatically created on signup
4. **Share access list**: Should display user names and permissions
5. **Permission management**: Users can change permissions and remove access

---

**Next Steps**: Run the updated schema and test email sharing with existing users!

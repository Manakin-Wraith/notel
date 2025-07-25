# 🔗 Sharing Features Setup Guide

## 📋 Prerequisites

Before the sharing functionality will work, you need to set up the database schema in your Supabase project.

## 🗄️ Database Setup

### Step 1: Run the Sharing Schema

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `schema_sharing.sql` into the editor
4. Click "Run" to execute the schema

This will create the following tables:
- `share_links` - For public/private link sharing
- `share_access` - For user-specific sharing permissions
- `user_profiles` - For user information in sharing UI
- `collaboration_presence` - For real-time collaboration features

### Step 2: Verify Tables Created

After running the schema, verify these tables exist in your Database > Tables section:
- ✅ share_links
- ✅ share_access  
- ✅ user_profiles
- ✅ collaboration_presence

## 🎯 Features Now Available

Once the database is set up, users can:

### 📄 Page Sharing
- Click the share icon in any page's title section
- Generate shareable links with view/edit/admin permissions
- Invite specific users by email
- Manage access and permissions

### 📅 Event Sharing
- Click the share icon in the event modal header
- Share individual events with others
- Control who can view or edit event details

### 🔐 Permission Levels
- **View**: Read-only access to content
- **Edit**: Can modify content and collaborate
- **Admin**: Full control including sharing management

## 🎨 UI/UX Features

### Dark Theme Integration
- Share modal matches your app's dark minimalist aesthetic
- Consistent with Notion-inspired design language
- Purple accent colors for primary actions

### User Journeys
- **New Users**: Immediate content access → engagement prompts → optional sign-up
- **Authenticated Users**: Full collaboration features and workspace integration
- **Content Owners**: Easy sharing with granular permission control

## 🚀 Testing the Features

1. **Create a page** in your app
2. **Click the share icon** in the title section
3. **Click "Create Link"** to generate a shareable URL
4. **Copy the link** and test it in a new browser/incognito window
5. **Try inviting users** by email (requires user profiles to exist)

## 🔧 Troubleshooting

### "Failed to create share link" Error
- **Cause**: Database tables not created yet
- **Solution**: Run `schema_sharing.sql` in Supabase SQL Editor

### Share Modal Not Opening
- **Cause**: Component integration issue
- **Solution**: Verify ShareButton is properly imported and used

### Permission Errors
- **Cause**: Row Level Security (RLS) policies
- **Solution**: The schema includes proper RLS policies - ensure user is authenticated

## 📱 Mobile Optimization

The sharing features are fully responsive:
- Touch-friendly share buttons (44px minimum)
- Mobile-optimized modal layout
- Gesture-friendly interactions

## 🔒 Security Features

- **Row Level Security**: Users can only access their own shared content
- **Permission-based access**: Granular control over what users can do
- **Secure link generation**: UUID-based share link IDs
- **Optional expiration**: Links can be set to expire

---

**Need help?** The sharing system is fully integrated and ready to use once the database schema is applied!

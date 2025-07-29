# Google OAuth Setup Guide

## 🚨 **URGENT FIX**: "Unsupported provider: provider is not enabled"

This error occurs when Google OAuth is not properly configured in Supabase. Follow these steps to fix it immediately.

## Step 1: Google Cloud Console Setup

### 1.1 Create OAuth 2.0 Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **+ CREATE CREDENTIALS** > **OAuth 2.0 Client IDs**
5. Select **Web application** as the application type
6. Name it "Notel OAuth Client"

### 1.2 Configure Authorized Redirect URIs
Add these exact URLs to **Authorized redirect URIs**:

**For Development:**
```
https://your-project-ref.supabase.co/auth/v1/callback
```

**For Production:**
```
https://your-project-ref.supabase.co/auth/v1/callback
```

**Replace `your-project-ref` with your actual Supabase project reference**

### 1.3 Save Credentials
- Copy the **Client ID** and **Client Secret**
- You'll need these for Supabase configuration

## Step 2: Supabase Dashboard Configuration

### 2.1 Access Authentication Settings
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your Notel project
3. Navigate to **Authentication** > **Providers**

### 2.2 Enable Google Provider
1. Find **Google** in the providers list
2. Toggle the **Enable** switch to ON
3. Enter your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console

### 2.3 Configure Redirect URLs
In the **Site URL** field, add:
- Development: `http://localhost:5173`
- Production: `https://notel-wine.vercel.app`

### 2.4 Save Configuration
Click **Save** to apply the changes

## Step 3: Verification

### 3.1 Test the Integration
1. Start your development server: `npm run dev`
2. Navigate to the landing page
3. Click "Get Started" or "Sign In" button
4. You should be redirected to Google OAuth flow

### 3.2 Expected Behavior
- Google OAuth popup/redirect appears
- User can select Google account
- After authorization, user is redirected back to your app
- User is signed in and can access the main application

## Step 4: Troubleshooting

### Common Issues

**Issue**: "Invalid redirect URI"
**Solution**: Ensure redirect URIs in Google Cloud Console exactly match Supabase format

**Issue**: "Client ID not found"
**Solution**: Double-check Client ID and Secret are correctly copied from Google Cloud Console

**Issue**: "Access blocked"
**Solution**: Ensure your Google Cloud project has the necessary APIs enabled

### Debug Steps
1. Check browser console for detailed error messages
2. Verify Supabase project reference in redirect URIs
3. Ensure Google Cloud Console project is active
4. Check that Google+ API is enabled in Google Cloud Console

## Step 5: Production Deployment

### Environment Variables
Ensure these are set in your production environment:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Production URLs
Update redirect URIs when deploying to production:
- Replace `localhost:5173` with your production domain
- Update both Google Cloud Console and Supabase settings

## Quick Reference

### Supabase Project URL Format
```
https://[project-ref].supabase.co
```

### Google OAuth Redirect URI Format
```
https://[project-ref].supabase.co/auth/v1/callback
```

### Site URL Examples
- Development: `http://localhost:5173`
- Production: `https://your-domain.com`

---

**⚡ After completing these steps, your Google OAuth should work immediately!**

*Last updated: July 29, 2025*

# Notel App Deployment Guide

## 🚀 Vercel Deployment

### Prerequisites
- GitHub repository with your code
- Supabase project set up with database schema
- Vercel account connected to GitHub

### Step 1: Environment Variables Setup

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 2: Deployment Configuration

The project includes a `vercel.json` file with:
- Build command: `npm run build`
- Output directory: `dist`
- Framework: `vite`
- SPA routing support

### Step 3: Automatic Deployments

Once connected to GitHub:
- **Main branch** pushes trigger production deployments
- **Pull requests** create preview deployments
- **Environment variables** are automatically injected during build

### Step 4: Post-Deployment Verification

After deployment, verify:
1. ✅ App loads without errors
2. ✅ Authentication works (sign up/sign in)
3. ✅ Data persistence and sync across devices
4. ✅ Mobile responsiveness
5. ✅ All features functional

## 🔧 Troubleshooting

### Common Issues:

1. **Environment Variables Missing**
   - Check Vercel dashboard → Settings → Environment Variables
   - Ensure `VITE_` prefix is used for client-side variables

2. **Build Failures**
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in `package.json`

3. **Routing Issues**
   - Verify `vercel.json` rewrites configuration
   - Check for SPA routing setup

4. **Supabase Connection Issues**
   - Verify environment variables are correct
   - Check Supabase project URL and anon key
   - Ensure RLS policies are properly configured

## 📱 Testing Checklist

- [ ] Desktop browser functionality
- [ ] Mobile responsiveness
- [ ] Cross-device data synchronization
- [ ] Authentication flow
- [ ] Emoji picker functionality
- [ ] Page creation and editing
- [ ] Sidebar navigation (mobile hamburger menu)

## 🔄 Continuous Deployment

The app is configured for automatic deployment on:
- Push to main branch → Production deployment
- Pull request → Preview deployment
- Environment changes → Automatic rebuild
# Test deployment trigger

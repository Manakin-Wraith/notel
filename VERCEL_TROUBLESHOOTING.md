# Vercel Auto-Deployment Troubleshooting Guide

## 🚨 Common Issues & Solutions

### Issue 1: Project Not Connected to GitHub

**Symptoms**: No deployments triggered on push

**Solution**:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project" → "Import Git Repository"
3. Select `Manakin-Wraith/notel` repository
4. Configure with these settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Issue 2: Wrong Branch Configuration

**Symptoms**: Deployments not triggered on main branch pushes

**Solution**:
1. Go to Project Settings → Git
2. Set **Production Branch** to `main`
3. Enable **Automatic Deployments**

### Issue 3: GitHub Integration Not Authorized

**Symptoms**: Repository not visible in Vercel

**Solution**:
1. Go to Vercel Settings → Git Integration
2. Reconnect GitHub account
3. Grant repository access permissions

### Issue 4: Webhook Issues

**Symptoms**: Intermittent deployment triggers

**Solution**:
1. Go to GitHub Repository → Settings → Webhooks
2. Look for Vercel webhook
3. If missing, reconnect in Vercel Project Settings → Git

### Issue 5: Environment Variables Missing

**Symptoms**: Build succeeds but app doesn't work

**Solution**:
Add these environment variables in Vercel:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## ✅ Verification Checklist

After setup, verify these items:

- [ ] Repository connected in Vercel Project Settings → Git
- [ ] Production branch set to `main`
- [ ] Automatic deployments enabled
- [ ] Environment variables configured
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Framework preset: Vite

## 🧪 Test Deployment

1. Make a small change to any file
2. Commit and push to main branch:
   ```bash
   git add .
   git commit -m "test: trigger deployment"
   git push origin main
   ```
3. Check Vercel dashboard for new deployment

## 🔄 Manual Deployment (Fallback)

If auto-deployment still doesn't work:

1. Go to Vercel Project → Deployments
2. Click "Deploy" button
3. Select main branch
4. Click "Deploy"

## 📞 Getting Help

If issues persist:
1. Check Vercel deployment logs for errors
2. Verify GitHub repository permissions
3. Contact Vercel support with project details

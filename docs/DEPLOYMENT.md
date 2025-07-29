# Deployment Guide

## Overview

This guide covers the complete deployment process for the Notel productivity app with the new landing page and Google OAuth integration.

## Pre-Deployment Checklist

### 1. Code Quality
- [ ] All tests passing (current: 37/41 - 90% success rate)
- [ ] TypeScript compilation successful
- [ ] ESLint warnings resolved
- [ ] Code reviewed and approved

### 2. Authentication Setup
- [ ] Supabase project configured
- [ ] Google OAuth provider enabled in Supabase
- [ ] Google Cloud Console OAuth client created
- [ ] Redirect URIs configured for production

### 3. Environment Configuration
- [ ] Production environment variables set
- [ ] Database migrations applied
- [ ] RLS policies configured

## Supabase Configuration

### Google OAuth Setup

1. **Supabase Dashboard**
   ```
   Authentication > Providers > Google
   - Enable Google provider
   - Add Google Client ID
   - Add Google Client Secret
   - Configure redirect URL: https://your-domain.com/
   ```

2. **Google Cloud Console**
   ```
   APIs & Services > Credentials > OAuth 2.0 Client IDs
   - Application type: Web application
   - Authorized redirect URIs:
     - https://your-project-ref.supabase.co/auth/v1/callback
     - https://your-domain.com/
   ```

### Database Migrations

Ensure all migrations are applied:
```sql
-- User settings table (if not already applied)
CREATE TABLE user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  default_view TEXT DEFAULT 'agenda' CHECK (default_view IN ('editor', 'agenda', 'board', 'calendar')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);
```

## Deployment Platforms

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

2. **Environment Variables**
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Build Settings**
   ```
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

### Netlify Alternative

1. **Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

2. **Environment Variables**
   - Same as Vercel configuration
   - Set in Netlify dashboard under Site settings > Environment variables

## Post-Deployment Verification

### 1. Functional Testing
- [ ] Landing page loads correctly
- [ ] Google OAuth sign-in works
- [ ] User redirected to app after auth
- [ ] All navigation links functional
- [ ] Mobile responsiveness verified

### 2. Performance Testing
- [ ] Page load speed < 3 seconds
- [ ] Core Web Vitals passing
- [ ] Images optimized and loading
- [ ] CSS/JS bundles optimized

### 3. Security Testing
- [ ] HTTPS enabled
- [ ] OAuth flow secure
- [ ] No sensitive data exposed
- [ ] CSP headers configured

## Monitoring & Analytics

### Error Tracking
```javascript
// Add to main.tsx or App.tsx
if (import.meta.env.PROD) {
  // Initialize error tracking service
  // e.g., Sentry, LogRocket, etc.
}
```

### Analytics Setup
```javascript
// Google Analytics or similar
// Track landing page conversions
// Monitor auth success rates
```

## Rollback Plan

### Quick Rollback
1. **Vercel**: Use previous deployment from dashboard
2. **Netlify**: Deploy previous build from dashboard
3. **Manual**: Revert to previous Git commit and redeploy

### Database Rollback
```sql
-- If needed, rollback migrations
-- Keep backups of production data
```

## Common Issues & Solutions

### OAuth Issues
- **Problem**: "Invalid redirect URI"
- **Solution**: Verify redirect URIs in Google Cloud Console match exactly

### Build Failures
- **Problem**: TypeScript compilation errors
- **Solution**: Run `npm run type-check` locally first

### Environment Variables
- **Problem**: Variables not loading
- **Solution**: Ensure VITE_ prefix for client-side variables

## Performance Optimization

### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npm run preview
```

### Image Optimization
- Use WebP format where possible
- Implement lazy loading
- Optimize image sizes for different breakpoints

### Code Splitting
```javascript
// Implement route-based code splitting
const LandingPage = lazy(() => import('./components/landing/LandingPage'));
```

## Security Considerations

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline';
               connect-src 'self' https://*.supabase.co;">
```

### HTTPS Enforcement
- Ensure all production traffic uses HTTPS
- Configure HSTS headers
- Use secure cookies for authentication

## Maintenance Schedule

### Weekly
- [ ] Monitor error rates
- [ ] Check OAuth success rates
- [ ] Review performance metrics

### Monthly
- [ ] Update dependencies
- [ ] Review security patches
- [ ] Analyze user feedback

### Quarterly
- [ ] Performance audit
- [ ] Security audit
- [ ] User experience review

---

*Last updated: July 29, 2025*
*Deployment Version: 1.0.0*

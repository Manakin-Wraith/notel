# 📧 Supabase Email Setup Guide

## 🎯 Step-by-Step Setup for Supabase Built-in Email

### Step 1: Access Your Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/yoqcitfxarpbfldxanhi
2. Make sure you're logged in to your Supabase account

### Step 2: Navigate to Authentication Settings
1. In the left sidebar, click **"Authentication"**
2. Click on **"Settings"** (under Authentication)
3. Look for the **"SMTP Settings"** section

### Step 3: Configure SMTP Settings
You have two options:

#### Option A: Use Supabase's Default Email Service (Recommended)
- Supabase provides a default email service for development
- **No configuration needed** - it should work out of the box
- Limited to development/testing use

#### Option B: Configure Custom SMTP (For Production)
If you want to use your own email service:

1. **Enable Custom SMTP**: Toggle the "Enable custom SMTP" switch
2. **Fill in SMTP Details**:
   ```
   SMTP Host: smtp.gmail.com (for Gmail)
   SMTP Port: 587
   SMTP User: your-email@gmail.com
   SMTP Pass: your-app-password
   SMTP Sender Name: Notel
   SMTP Sender Email: your-email@gmail.com
   ```

### Step 4: Configure Email Templates
1. Still in Authentication, click **"Email Templates"**
2. You'll see templates for:
   - **Confirm signup**
   - **Invite user** ← This is what we need!
   - **Magic link**
   - **Change email address**
   - **Reset password**

3. **Click on "Invite user"** template
4. **Customize the template** (optional) or leave default

### Step 5: Test Email Configuration
1. In Authentication → Users, click **"Invite a user"**
2. Enter a test email address (like your own)
3. Click **"Send invitation"**
4. Check if you receive the email

### Step 6: Enable Email Confirmations (Optional)
1. In Authentication → Settings
2. Under **"User Signups"**, you can configure:
   - Enable email confirmations
   - Enable phone confirmations
   - Double confirm email changes

## 🔧 For Your Share Email Function

### Current Implementation Status
Your Edge Function is already set up to use Supabase's email service! It tries:

1. **Supabase Auth Admin API** (generateLink with type: 'invite')
2. **Direct Email API** (if available)
3. **Graceful fallback** (simulation if email not configured)

### Testing Your Implementation
1. **Complete the setup above**
2. **Test email sharing** in your app
3. **Check Function logs** at: https://supabase.com/dashboard/project/yoqcitfxarpbfldxanhi/functions
4. **Look for these log messages**:
   - "📧 Email sent successfully via Supabase Auth"
   - "📧 Email sent successfully via Supabase direct API"
   - "📧 Email simulation completed" (if not configured yet)

## 🎨 Customizing Email Templates

### For Share Emails
The current implementation uses Supabase's invite system, but you can customize:

1. **Email Template**: Modify the "Invite user" template in Supabase
2. **Custom Data**: The function passes custom data like:
   - `share_url`: The actual share link
   - `content_title`: Title of shared content
   - `sender_name`: Name of person sharing

### Template Variables Available
In your email template, you can use:
- `{{ .SiteURL }}` - Your site URL
- `{{ .ConfirmationURL }}` - The confirmation/invite URL
- `{{ .Email }}` - Recipient email
- Custom data from the function

## 🚀 Production Considerations

### For Development
- Supabase's default email service works fine
- Limited sending volume
- Good for testing and development

### For Production
- Consider setting up custom SMTP
- Use services like:
  - **Gmail** (with app passwords)
  - **SendGrid** (via SMTP)
  - **Mailgun** (via SMTP)
  - **Amazon SES** (via SMTP)

### Rate Limits
- Supabase default: Limited sends per day
- Custom SMTP: Depends on your provider
- Monitor usage in Supabase dashboard

## ✅ Next Steps
1. **Follow steps 1-4 above** to configure Supabase email
2. **Test the invite function** in Supabase dashboard
3. **Test your share email feature** in your app
4. **Check function logs** to see which method succeeded
5. **Customize email templates** if needed

Your email sharing system is **architecturally complete** and will work as soon as Supabase email is configured! 🎉

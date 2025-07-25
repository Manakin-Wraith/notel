# Supabase-Only Email Solution (No Third-Party Providers)

## 🎯 Option 1: Supabase Edge Function with Resend (Built-in)

Supabase has a partnership with Resend for email delivery. You can use this without setting up external accounts.

### Implementation:

```typescript
// supabase/functions/send-share-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { email, shareUrl, pageTitle, senderName } = await req.json()
  
  // Use Supabase's built-in email via Resend
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Send email using Supabase's email functionality
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      to: email,
      subject: `${senderName} shared "${pageTitle}" with you`,
      html: generateEmailHTML(shareUrl, pageTitle, senderName)
    }
  })

  return new Response(JSON.stringify({ success: !error }))
})
```

## 🎯 Option 2: Pure JavaScript SMTP (No Dependencies)

Use Node.js built-in capabilities with your own SMTP server or free services:

```typescript
// api/send-share-email.ts
import nodemailer from 'nodemailer';

// Use free SMTP services like Gmail, Outlook, or your domain's SMTP
const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com', // or your domain's SMTP
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER, // your email
    pass: process.env.SMTP_PASS  // app password
  }
});

export default async function handler(req, res) {
  const { to, subject, html } = req.body;
  
  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject,
    html
  });
  
  res.json({ success: true });
}
```

## 🎯 Option 3: Browser-Based Email (Client-Side)

Use `mailto:` links to open user's email client with pre-filled content:

```typescript
// In ShareModal.tsx
const handleInviteUser = async () => {
  const shareUrl = sharingService.generateShareUrl(shareLink);
  const subject = `${user.name} shared "${resourceTitle}" with you`;
  const body = `Hi there!\n\n${user.name} has shared "${resourceTitle}" with you.\n\nView it here: ${shareUrl}\n\nBest regards,\nThe Notel Team`;
  
  const mailtoLink = `mailto:${inviteEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoLink);
  
  // Show success message
  setInviteSuccess(true);
};
```

## 🎯 Option 4: Supabase Database + Email Queue

Store email requests in database and process them via cron job:

```sql
-- Create email queue table
CREATE TABLE email_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

```typescript
// Store email in queue instead of sending immediately
const { data, error } = await supabase
  .from('email_queue')
  .insert({
    to_email: inviteEmail,
    subject: `${user.name} shared "${resourceTitle}" with you`,
    html_content: generateEmailHTML(shareUrl, resourceTitle, user.name)
  });
```

## 🚀 Recommended: Option 2 (SMTP with Gmail/Outlook)

**Pros:**
- ✅ No third-party email service accounts needed
- ✅ Use your existing Gmail/Outlook account
- ✅ Free for reasonable volumes
- ✅ Full control over email content
- ✅ Professional sender address

**Setup:**
1. Use your Gmail/Outlook account
2. Generate app password for SMTP
3. Add to environment variables
4. Works immediately

**Environment Variables:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com
```

Would you like me to implement Option 2 (SMTP with your existing email) or would you prefer one of the other approaches?

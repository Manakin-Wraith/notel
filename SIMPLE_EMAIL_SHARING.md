# Simple Email Sharing Implementation

## Current Problem
- 406 errors persist due to `pending_email` format in `user_id` field
- Complex RLS policies aren't solving the core issue
- No actual email delivery implemented yet

## Simple Solution: Use Supabase Edge Functions

Instead of storing pending invitations, let's send emails directly using Supabase.

### Implementation Plan

1. **Create Supabase Edge Function** for email sending
2. **Simplify the sharing flow** - no more pending invitations
3. **Use Supabase's email capabilities** or integrate with email service

### Step 1: Create Edge Function

```typescript
// supabase/functions/send-share-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { email, shareUrl, pageTitle, senderName } = await req.json()
  
  // Send email using Supabase or external service
  const emailContent = `
    Hi there!
    
    ${senderName} has shared "${pageTitle}" with you.
    
    Click here to view: ${shareUrl}
    
    Best regards,
    Notel Team
  `
  
  // Use Supabase's email or external service like SendGrid
  // Implementation details below...
  
  return new Response(JSON.stringify({ success: true }))
})
```

### Step 2: Update ShareModal

```typescript
// In ShareModal.tsx - simplified approach
const handleInviteUser = async () => {
  try {
    setIsInviting(true)
    
    // 1. Create public share link (if not exists)
    const shareLink = await sharingService.createShareLink(
      resourceId, 
      resourceType, 
      'view', 
      true // public
    )
    
    // 2. Send email via Edge Function
    const response = await fetch('/api/send-share-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inviteEmail,
        shareUrl: `${window.location.origin}/shared/${resourceType}/${shareLink.id}`,
        pageTitle: title,
        senderName: user?.name || 'Someone'
      })
    })
    
    if (response.ok) {
      setInviteSuccess('Email sent successfully!')
      setInviteEmail('')
    } else {
      setInviteError('Failed to send email')
    }
  } catch (error) {
    setInviteError('Failed to send email')
  } finally {
    setIsInviting(false)
  }
}
```

### Benefits of This Approach

1. **No more 406 errors** - we don't store pending invitations
2. **Actual email delivery** - recipients get real emails
3. **Simpler database schema** - just public share links
4. **Better user experience** - immediate email delivery
5. **Uses Supabase capabilities** - leverages platform features

### Email Service Options

**Option A: Supabase + SendGrid/Mailgun**
- Use Edge Function with external email service
- Full control over email templates
- Reliable delivery

**Option B: Supabase Auth Emails**
- Use Supabase's built-in email system
- Simpler setup
- Limited customization

## Next Steps

1. **Remove pending invitation complexity**
2. **Create Edge Function for email sending**
3. **Update ShareModal to use direct email approach**
4. **Test with actual email delivery**

This approach eliminates the 406 errors and provides actual email functionality!

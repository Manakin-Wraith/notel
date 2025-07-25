# Email Delivery Implementation Plan

## Current Status
- ✅ Pending invitations are stored in database
- ✅ UI shows success/failure feedback
- ❌ No actual emails are sent to recipients

## Option 1: Supabase Auth Invitations (Recommended)
Use Supabase's built-in invitation system for seamless integration.

### Implementation Steps:
1. **Use Supabase Auth `inviteUserByEmail`**:
   ```typescript
   const { data, error } = await supabase.auth.admin.inviteUserByEmail(
     email,
     {
       redirectTo: `${window.location.origin}/shared/page/${resourceId}`,
       data: {
         resource_id: resourceId,
         resource_type: resourceType,
         permission: permission,
         invited_by: currentUser.id
       }
     }
   );
   ```

2. **Custom Email Template** in Supabase Dashboard:
   - Go to Authentication → Email Templates
   - Customize "Invite User" template
   - Include sharing context and direct link to shared content

3. **Handle Signup Flow**:
   - When user signs up via invitation, link pending invitation to new user
   - Update `share_access` record: set `is_pending = false`, `user_id = new_user_id`

### Pros:
- Built into Supabase (no external service needed)
- Handles signup flow automatically
- Secure invitation tokens
- Custom email templates

### Cons:
- Requires users to create accounts
- Limited customization of email content

## Option 2: External Email Service
Use SendGrid, Mailgun, or similar for more control.

### Implementation Steps:
1. **Add email service integration**
2. **Create custom email templates**
3. **Send invitation emails with share links**
4. **Handle both signup and direct access flows**

### Pros:
- Full control over email content and design
- Can send to users without requiring signup
- Rich HTML templates

### Cons:
- Additional service dependency
- More complex implementation
- Additional costs

## Option 3: Hybrid Approach
Combine both approaches for maximum flexibility.

### Implementation:
1. **For existing users**: Direct email with share link
2. **For new users**: Supabase invitation with signup flow
3. **Detect user status** and choose appropriate method

## Recommended Next Steps

1. **Fix 406 RLS Error First**:
   - Apply `FIX_RLS_POLICIES.sql` to resolve current issues
   - Test that pending invitations work without errors

2. **Implement Supabase Auth Invitations**:
   - Start with Option 1 for quick implementation
   - Customize email templates in Supabase Dashboard
   - Test end-to-end invitation flow

3. **Enhance User Experience**:
   - Add email delivery status feedback
   - Handle invitation acceptance flow
   - Link pending invitations to new user accounts

## Email Template Ideas

### Subject: "You've been invited to collaborate on [Page Title]"

### Content:
```
Hi there!

[Inviter Name] has invited you to collaborate on "[Page Title]" in their Notel workspace.

[Preview of page content]

Access Level: [View/Edit/Admin]

[Accept Invitation Button] → Links to shared content

If you don't have a Notel account yet, you'll be able to create one when you accept the invitation.

Best regards,
The Notel Team
```

## Technical Considerations

1. **Security**: Use Supabase's secure invitation tokens
2. **Expiration**: Set reasonable expiration times for invitations
3. **Rate Limiting**: Prevent spam by limiting invitation frequency
4. **Analytics**: Track invitation open/acceptance rates
5. **Fallback**: Handle email delivery failures gracefully

# 📧 SMTP Email Setup (No Third-Party Providers)

## 🎯 Perfect Solution: Use Your Existing Email

You can now send emails using your existing Gmail or Outlook account - no third-party services needed!

## 📦 Install Dependencies

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

## 🔧 Environment Variables

Add these to your `.env.local` file:

### For Gmail:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com
```

### For Outlook:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
FROM_EMAIL=your-email@outlook.com
```

## 🔐 Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** in your Google Account
2. **Generate App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this as `SMTP_PASS`

## 🔐 Outlook Setup

1. Use your regular email and password
2. Or generate an app password if 2FA is enabled

## 🚀 Test the Implementation

1. **Install dependencies**:
   ```bash
   npm install nodemailer @types/nodemailer
   ```

2. **Add environment variables** to `.env.local`

3. **Test email sharing**:
   - Open Share Modal
   - Enter an email address
   - Click "Send Email"
   - Check recipient's inbox!

## ✅ Benefits

- ✅ **No third-party accounts** needed
- ✅ **Use existing email** (Gmail/Outlook)
- ✅ **Free for reasonable volumes**
- ✅ **Professional sender address**
- ✅ **Full control** over email content
- ✅ **Minimalist email templates** included

## 🎨 Email Template Features

The emails will be sent with your beautiful minimalist template:
- Clean dark theme design
- Professional typography
- Mobile-responsive layout
- Clear call-to-action buttons
- Consistent with your app's aesthetic

## 🔧 How It Works

1. **User enters email** in Share Modal
2. **Creates public share link** (if needed)
3. **Sends email via SMTP** using your Gmail/Outlook
4. **Recipient gets beautiful email** with direct link
5. **Clicks link** → views content immediately

Perfect solution - no external dependencies, uses your existing email, and maintains your minimalist design principles! 🎯

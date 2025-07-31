// Simple email service for sharing functionality
// Uses Supabase Edge Functions for email delivery

interface ShareEmailData {
  recipientEmail: string;
  shareUrl: string;
  contentTitle: string;
  contentType: 'page' | 'event';
  senderName: string;
  senderEmail: string;
}

interface ChatInvitationData {
  recipientEmail: string;
  senderName: string;
  senderEmail: string;
  chatUrl: string;
  personalMessage?: string;
}

interface EmailResponse {
  success: boolean;
  error?: string;
}

export class EmailService {
  private static instance: EmailService;

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Send a share email using Supabase Edge Function (more reliable than SMTP)
   */
  async sendShareEmail(data: ShareEmailData): Promise<EmailResponse> {
    try {
      // Use Supabase Edge Function for reliable email delivery
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/send-share-email`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          recipientEmail: data.recipientEmail,
          shareUrl: data.shareUrl,
          contentTitle: data.contentTitle,
          contentType: data.contentType,
          senderName: data.senderName,
          senderEmail: data.senderEmail
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Email service error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      return { success: result.success };
    } catch (error) {
      console.error('Failed to send share email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Generate email subject with minimalist approach
   */
  private generateSubject(data: ShareEmailData): string {
    const contentTypeLabel = data.contentType === 'page' ? 'page' : 'event';
    return `${data.senderName} shared a ${contentTypeLabel} with you`;
  }

  /**
   * Generate minimalist email content (both HTML and text)
   */
  private generateEmailContent(data: ShareEmailData): { html: string; text: string } {
    const contentTypeLabel = data.contentType === 'page' ? 'page' : 'event';
    
    // Text version (fallback)
    const text = `
Hi there!

${data.senderName} (${data.senderEmail}) has shared "${data.contentTitle}" with you.

View the ${contentTypeLabel}: ${data.shareUrl}

Want to edit or save to your workspace? You can sign up when you're ready.

Best regards,
The Notel Team
    `.trim();

    // HTML version with minimalist styling
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shared ${contentTypeLabel}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #374151;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9fafb;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      margin-bottom: 24px;
    }
    .title {
      font-size: 24px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 8px 0;
    }
    .subtitle {
      color: #6b7280;
      margin: 0;
    }
    .content {
      margin: 24px 0;
    }
    .shared-item {
      background: #f3f4f6;
      border-radius: 6px;
      padding: 16px;
      margin: 16px 0;
      border-left: 3px solid #3b82f6;
    }
    .shared-title {
      font-weight: 500;
      color: #111827;
      margin: 0 0 4px 0;
    }
    .shared-type {
      color: #6b7280;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .cta-button {
      display: inline-block;
      background: #111827;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 500;
      margin: 20px 0;
      transition: background-color 0.2s;
    }
    .cta-button:hover {
      background: #374151;
    }
    .footer {
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    .sender-info {
      color: #374151;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">You've been shared something</h1>
      <p class="subtitle">View and collaborate on shared content</p>
    </div>
    
    <div class="content">
      <div class="sender-info">
        <strong>${data.senderName}</strong> (${data.senderEmail}) shared this with you:
      </div>
      
      <div class="shared-item">
        <div class="shared-type">${contentTypeLabel}</div>
        <div class="shared-title">${data.contentTitle}</div>
      </div>
      
      <a href="${data.shareUrl}" class="cta-button">View ${contentTypeLabel}</a>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 16px;">
        Want to edit or save to your workspace? You can sign up when you're ready.
      </p>
    </div>
    
    <div class="footer">
      <p>This email was sent because someone shared content with you using Notel.</p>
      <p>Notel - Minimalist productivity, inspired by Notion</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return { html, text };
  }

  /**
   * Send a chat invitation email
   */
  async sendChatInvitation(data: ChatInvitationData): Promise<EmailResponse> {
    try {
      const subject = `${data.senderName} wants to chat with you on Notel`;
      const { html, text } = this.generateChatInvitationContent(data);
      
      return await this.sendEmail({
        to: data.recipientEmail,
        subject,
        html,
        text
      });
    } catch (error) {
      console.error('Failed to send chat invitation:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Generate chat invitation email content
   */
  private generateChatInvitationContent(data: ChatInvitationData): { html: string; text: string } {
    // Text version
    const text = `
Hi there!

${data.senderName} (${data.senderEmail}) wants to start a chat conversation with you on Notel.

${data.personalMessage ? `Personal message: "${data.personalMessage}"\n\n` : ''}Join the conversation: ${data.chatUrl}

Notel is a minimalist productivity app with real-time chat features. You can sign up when you're ready.

Best regards,
The Notel Team
    `.trim();

    // HTML version
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chat Invitation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #374151;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9fafb;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
      margin: 0 0 8px 0;
    }
    .subtitle {
      color: #6b7280;
      margin: 0;
    }
    .sender-info {
      background: #f3f4f6;
      padding: 16px;
      border-radius: 8px;
      margin: 24px 0;
      border-left: 4px solid #8b5cf6;
    }
    .personal-message {
      background: #fef3c7;
      padding: 16px;
      border-radius: 8px;
      margin: 24px 0;
      border-left: 4px solid #f59e0b;
      font-style: italic;
    }
    .cta-button {
      display: inline-block;
      background: #8b5cf6;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 24px 0;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">💬 Chat Invitation</h1>
      <p class="subtitle">Someone wants to start a conversation with you</p>
    </div>
    
    <div class="sender-info">
      <strong>${data.senderName}</strong> (${data.senderEmail}) wants to chat with you on Notel.
    </div>
    
    ${data.personalMessage ? `<div class="personal-message">"${data.personalMessage}"</div>` : ''}
    
    <div style="text-align: center;">
      <a href="${data.chatUrl}" class="cta-button">Join Chat Conversation</a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 16px;">
      Notel is a minimalist productivity app with real-time chat. You can sign up when you're ready.
    </p>
    
    <div class="footer">
      <p>This chat invitation was sent via Notel.</p>
      <p>Notel - Minimalist productivity, inspired by Notion</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return { html, text };
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();

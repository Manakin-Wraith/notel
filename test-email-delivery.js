// Test Email Delivery to Different Addresses
// Run with: node test-email-delivery.js

import { config } from 'dotenv';
import sgMail from '@sendgrid/mail';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Set API key
const apiKey = process.env.VITE_SENDGRID_API_KEY;
if (!apiKey) {
  console.error('❌ VITE_SENDGRID_API_KEY not found in .env.local');
  process.exit(1);
}

sgMail.setApiKey(apiKey);

// Test different email addresses
const testEmails = [
  'g.mostertpot@gmail.com',  // Your personal email
  'info@lovecode.co.za',     // Verified sender email
  // Add more test emails here
];

async function testEmailDelivery() {
  console.log('🚀 Testing email delivery to multiple addresses...\n');

  for (const testEmail of testEmails) {
    console.log(`📧 Testing delivery to: ${testEmail}`);
    
    const msg = {
      to: testEmail,
      from: process.env.VITE_FROM_EMAIL || 'info@lovecode.co.za',
      subject: 'Chat Invitation Test - ' + new Date().toISOString(),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You're Invited to Chat!</h2>
          <p>This is a test email to verify chat invitation delivery.</p>
          <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
          <div style="margin: 20px 0;">
            <a href="http://localhost:5173/chat?test=true" 
               style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Join Chat
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This is a test message from your productivity app.
          </p>
        </div>
      `,
      text: `
        You're Invited to Chat!
        
        This is a test email to verify chat invitation delivery.
        Sent at: ${new Date().toLocaleString()}
        
        Join the chat: http://localhost:5173/chat?test=true
        
        This is a test message from your productivity app.
      `
    };

    try {
      const response = await sgMail.send(msg);
      console.log(`✅ Email sent successfully to ${testEmail}!`);
      console.log(`📊 Response status: ${response[0].statusCode}`);
      console.log(`📊 Message ID: ${response[0].headers['x-message-id']}\n`);
    } catch (error) {
      console.error(`❌ Failed to send to ${testEmail}:`, error.message);
      if (error.response && error.response.body) {
        console.error('📊 Error details:', error.response.body);
      }
      console.log('');
    }
  }

  console.log('🎉 Email delivery test complete!');
  console.log('💡 Check your email inboxes (including spam folders) for test messages.');
}

testEmailDelivery().catch(console.error);

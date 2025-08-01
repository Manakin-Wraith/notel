// Test SendGrid email sending
// Run with: node test-sendgrid.js

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

const msg = {
  to: 'info@lovecode.co.za', // Send to yourself for testing
  from: 'info@lovecode.co.za', // Must be verified in SendGrid
  subject: 'SendGrid Test Email',
  text: 'This is a test email from your Notel app to verify SendGrid is working.',
  html: '<p>This is a test email from your <strong>Notel app</strong> to verify SendGrid is working.</p>',
};

async function testSendGrid() {
  try {
    console.log('🚀 Testing SendGrid email sending...');
    console.log('📧 From:', msg.from);
    console.log('📧 To:', msg.to);
    
    const response = await sgMail.send(msg);
    console.log('✅ Email sent successfully!');
    console.log('📊 Response status:', response[0].statusCode);
    console.log('📊 Response headers:', response[0].headers);
    
    console.log('\n🎉 SendGrid is working! Check your email inbox.');
    
  } catch (error) {
    console.error('❌ SendGrid error:', error);
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📊 Body:', error.response.body);
      
      if (error.response.body?.errors) {
        error.response.body.errors.forEach((err, index) => {
          console.error(`❌ Error ${index + 1}:`, err.message);
          if (err.field) console.error(`   Field: ${err.field}`);
          if (err.help) console.error(`   Help: ${err.help}`);
        });
      }
    }
    
    console.log('\n💡 Common solutions:');
    console.log('1. Verify sender email in SendGrid Dashboard');
    console.log('2. Check API key permissions');
    console.log('3. Ensure from email matches verified sender');
  }
}

testSendGrid();

// API route for sending share emails using SMTP (no third-party providers needed)
// Uses nodemailer with existing Gmail/Outlook accounts

import { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text: string;
}

interface EmailResponse {
  success: boolean;
  error?: string;
}

// Create SMTP transporter using environment variables
const createTransporter = () => {
  // Support multiple SMTP providers
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.FROM_EMAIL || user;

  if (!user || !pass) {
    throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS environment variables.');
  }

  return nodemailer.createTransporter({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass
    },
    // Additional options for Gmail
    ...(host.includes('gmail') && {
      service: 'gmail'
    })
  });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EmailResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { to, subject, html, text }: EmailRequest = req.body;

    // Validate required fields
    if (!to || !subject || !html) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: to, subject, html' 
      });
    }

    // Create SMTP transporter
    const transporter = createTransporter();

    // Email options
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to,
      subject,
      text,
      html
    };

    // Send email
    console.log('📧 Sending share email via SMTP:', {
      to,
      subject,
      from: mailOptions.from
    });

    await transporter.sendMail(mailOptions);
    
    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('SMTP email sending error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    });
  }
}

/*
Environment Variables needed:

SMTP_HOST=smtp.gmail.com (or smtp-mail.outlook.com for Outlook)
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com

For Gmail:
1. Enable 2-factor authentication
2. Generate an "App Password" in Google Account settings
3. Use the app password as SMTP_PASS

For Outlook:
1. Use your regular email and password
2. Or generate an app password if 2FA is enabled
*/

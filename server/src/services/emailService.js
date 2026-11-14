/**
 * @file emailService.js
 * @description Email Dispatch & Verification Service for StudyPilot.
 * Handles transmission of activation codes and one-click verification links
 * using Nodemailer. Supports SMTP configurations (Gmail, SendGrid, etc.)
 * with intelligent local development fallbacks.
 */

import nodemailer from 'nodemailer';

let transporter = null;

/**
 * Initializes and caches the Nodemailer transporter instance based on environment variables.
 */
function getTransporter() {
  if (transporter) return transporter;

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    GMAIL_USER,
    GMAIL_APP_PASSWORD
  } = process.env;

  // Option 1: Direct Gmail Service with App Password
  if (GMAIL_USER && GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD
      }
    });
    return transporter;
  }

  // Option 2: Generic SMTP Host & Port (e.g. Brevo, SendGrid, Mailgun, Amazon SES)
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
    return transporter;
  }

  return null;
}

/**
 * Sends an email verification message containing both a 6-digit code and a one-click activation link.
 *
 * @param {Object} options
 * @param {string} options.email - Recipient email address
 * @param {string} options.name - Student's display name
 * @param {string} options.code - 6-digit verification OTP
 * @param {string} options.token - Cryptographic URL token
 * @returns {Promise<{ success: boolean, simulated?: boolean, previewUrl?: string }>}
 */
export async function sendVerificationEmail({ email, name, code, token }) {
  const clientOrigin = process.env.CLIENT_ORIGIN?.split(',')[0]?.trim() || 'http://localhost:5173';
  const verificationUrl = `${clientOrigin}?verify_token=${token}&verify_email=${encodeURIComponent(email)}`;
  const senderAddress = process.env.EMAIL_FROM || process.env.GMAIL_USER || '"StudyPilot" <noreply@studypilot.app>';

  const mailOptions = {
    from: senderAddress,
    to: email,
    subject: `Verify your StudyPilot account (Code: ${code})`,
    text: `Hello ${name},\n\nWelcome to StudyPilot! To activate your account and verify your email address, please use the following 6-digit code:\n\n${code}\n\nOr click the link below to verify instantly:\n${verificationUrl}\n\nThis verification code will expire in 24 hours.\n\nHappy studying,\nThe StudyPilot Team`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }
          .container { max-width: 560px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; }
          .header h1 { margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0; color: #e0e7ff; font-size: 14px; }
          .content { padding: 32px 28px; line-height: 1.6; font-size: 15px; color: #d1d5db; }
          .content h2 { color: #ffffff; font-size: 18px; margin-top: 0; }
          .code-box { background-color: #1f2937; border: 2px dashed #4f46e5; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }
          .code-box span { font-size: 13px; text-transform: uppercase; color: #9ca3af; letter-spacing: 1px; display: block; margin-bottom: 8px; }
          .code-box strong { font-size: 36px; letter-spacing: 8px; color: #a5b4fc; font-family: 'Courier New', Courier, monospace; font-weight: 700; }
          .cta-btn { display: block; width: fit-content; margin: 24px auto 0; background-color: #4f46e5; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; text-align: center; }
          .cta-btn:hover { background-color: #4338ca; }
          .footer { padding: 20px 28px; border-top: 1px solid #1f2937; font-size: 12px; color: #6b7280; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>StudyPilot</h1>
            <p>Adaptive Study Planner & Intelligent Timetable</p>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Hi <strong>${name}</strong>,</p>
            <p>Thanks for creating an account with StudyPilot. To protect your student workspace and verify that <strong>${email}</strong> belongs to you, please enter the verification code below:</p>
            
            <div class="code-box">
              <span>Your 6-Digit Activation Code</span>
              <strong>${code}</strong>
            </div>

            <p style="text-align: center;">Or click the button below to verify your email automatically:</p>
            <a href="${verificationUrl}" class="cta-btn" target="_blank">Verify Email & Access StudyPilot</a>

            <p style="margin-top: 28px; font-size: 13px; color: #9ca3af;">
              ⏳ This verification link and code will expire in <strong>24 hours</strong>.<br/>
              🔒 If you did not create a StudyPilot account, you can safely ignore this email.
            </p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} StudyPilot. Designed for university students.
          </div>
        </div>
      </body>
      </html>
    `
  };

  const activeTransporter = getTransporter();

  if (activeTransporter) {
    try {
      const info = await activeTransporter.sendMail(mailOptions);
      console.log(`[EmailService] Verification email sent to ${email}:`, info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error('[EmailService] Failed to send email via SMTP transporter:', err.message);
      // Fall through to console logging so local dev is not blocked
    }
  }

  // Development Fallback / Console Simulation Mode
  console.log('\n===============================================================');
  console.log('✉️  [STUDYPILOT EMAIL SIMULATION / DEV MODE]');
  console.log(`To:                 ${email} (${name})`);
  console.log(`Verification Code:  ${code}`);
  console.log(`Verification Link:  ${verificationUrl}`);
  console.log('Note: To send real emails, set GMAIL_USER/GMAIL_APP_PASSWORD or SMTP_* in server/.env');
  console.log('===============================================================\n');

  return {
    success: true,
    simulated: true,
    code,
    verificationUrl
  };
}

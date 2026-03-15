import { Resend } from 'resend';

// Resend client - handles missing API key gracefully for development
const resendApiKey = process.env.RESEND_API_KEY;

// Create Resend instance only if API key is available
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Default sender email
const defaultFrom = process.env.EMAIL_FROM || 'Osassy\'s Kitchen <noreply@osassyskitchen.com>';

/**
 * Email sending parameters
 */
export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

/**
 * Email sending result
 */
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email using Resend
 *
 * @param params - Email parameters
 * @returns Promise with the result of sending the email
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, subject, html, text, from = defaultFrom, replyTo } = params;

  // Handle missing Resend configuration gracefully
  if (!resend) {
    console.warn('[Email] Resend API key not configured. Email not sent:', {
      to,
      subject,
      timestamp: new Date().toISOString(),
    });

    // In development, log the email content for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[Email] Development mode - Email content:');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('HTML preview:', html.substring(0, 200) + '...');
    }

    return {
      success: false,
      error: 'Email service not configured. Please set RESEND_API_KEY environment variable.',
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || stripHtml(html),
      replyTo,
    });

    if (error) {
      console.error('[Email] Failed to send email:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('[Email] Email sent successfully:', {
      messageId: data?.id,
      to,
      subject,
    });

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[Email] Error sending email:', errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send a verification email
 *
 * @param to - Recipient email address
 * @param name - Recipient's name
 * @param verificationUrl - URL to verify the email
 */
export async function sendVerificationEmail(
  to: string,
  name: string,
  verificationUrl: string
): Promise<SendEmailResult> {
  // Import template dynamically to avoid circular dependencies
  const { getVerificationEmailHtml, getVerificationEmailText } = await import('./emailTemplates');

  return sendEmail({
    to,
    subject: 'Verify your email - Osassy\'s Kitchen',
    html: getVerificationEmailHtml(name, verificationUrl),
    text: getVerificationEmailText(name, verificationUrl),
  });
}

/**
 * Send a password reset email
 *
 * @param to - Recipient email address
 * @param name - Recipient's name
 * @param resetUrl - URL to reset the password
 */
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
): Promise<SendEmailResult> {
  // Import template dynamically to avoid circular dependencies
  const { getPasswordResetEmailHtml, getPasswordResetEmailText } = await import('./emailTemplates');

  return sendEmail({
    to,
    subject: 'Reset your password - Osassy\'s Kitchen',
    html: getPasswordResetEmailHtml(name, resetUrl),
    text: getPasswordResetEmailText(name, resetUrl),
  });
}

/**
 * Strip HTML tags to create plain text version
 *
 * @param html - HTML string
 * @returns Plain text string
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return resend !== null;
}

export { resend };

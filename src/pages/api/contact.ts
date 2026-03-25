import { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail, isEmailConfigured } from '@/lib/email';
import {
  getContactSupportEmailHtml,
  getContactSupportEmailText,
  getContactConfirmationEmailHtml,
  getContactConfirmationEmailText,
  ContactFormData,
} from '@/lib/emailTemplates';

interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface ContactResponse {
  success: boolean;
  message: string;
  data?: {
    supportMessageId?: string;
    confirmationMessageId?: string;
    timestamp: string;
  };
  errors?: Record<string, string>;
  error?: string;
  retryAfter?: number;
}

// Support email address - where contact form submissions are sent
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'hello@osassyskitchen.com';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ContactResponse>
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} not allowed`,
    });
  }

  // Content type validation
  if (!req.headers['content-type']?.includes('application/json')) {
    return res.status(400).json({
      success: false,
      message: 'Content-Type must be application/json',
    });
  }

  // Request body validation
  if (!req.body) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request body',
    });
  }

  const { name, email, subject, message }: ContactRequest = req.body;

  // Validate required fields
  const errors: Record<string, string> = {};
  
  if (!name?.trim()) errors.name = 'Name is required';
  if (!email?.trim()) errors.email = 'Email is required';
  if (!subject?.trim()) errors.subject = 'Subject is required';
  if (!message?.trim()) errors.message = 'Message is required';

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required',
      errors,
    });
  }

  // Validate field lengths and formats
  const validationErrors: Record<string, string> = {};
  
  if (name.length > 100) validationErrors.name = 'Name must be less than 100 characters';
  if (subject.length > 200) validationErrors.subject = 'Subject must be less than 200 characters';
  if (message.length < 10) validationErrors.message = 'Message must be at least 10 characters long';
  if (message.length > 2000) validationErrors.message = 'Message must be less than 2000 characters';

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    validationErrors.email = 'Please enter a valid email address';
  }

  if (Object.keys(validationErrors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input data',
      errors: validationErrors,
    });
  }

  try {
    const contactData: ContactFormData = { name, email, subject, message };

    // Log the submission
    console.log('[Contact] Form submission received:', { name, email, subject, timestamp: new Date().toISOString() });

    // Check if email is configured
    if (!isEmailConfigured()) {
      console.warn('[Contact] Email service not configured. Logging submission only.');
      console.log('[Contact] Message content:', message);

      // Still return success in development - form works, just no emails sent
      return res.status(200).json({
        success: true,
        message: "Your message has been received. We'll get back to you soon!",
        data: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Send email to support team
    const supportEmailResult = await sendEmail({
      to: SUPPORT_EMAIL,
      subject: `[Contact Form] ${subject} - from ${name}`,
      html: getContactSupportEmailHtml(contactData),
      text: getContactSupportEmailText(contactData),
      replyTo: email, // Allow support to reply directly to customer
    });

    if (!supportEmailResult.success) {
      console.error('[Contact] Failed to send support notification:', supportEmailResult.error);
      // Continue anyway - we still want to confirm to the user
    }

    // Send confirmation email to the customer
    const confirmationEmailResult = await sendEmail({
      to: email,
      subject: `We've received your message - Osassy's Kitchen`,
      html: getContactConfirmationEmailHtml(contactData),
      text: getContactConfirmationEmailText(contactData),
    });

    if (!confirmationEmailResult.success) {
      console.error('[Contact] Failed to send confirmation email:', confirmationEmailResult.error);
    }

    // Success response
    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully. We'll get back to you soon!",
      data: {
        supportMessageId: supportEmailResult.messageId,
        confirmationMessageId: confirmationEmailResult.messageId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Contact] Form submission error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.',
      error: 'Internal server error',
    });
  }
}
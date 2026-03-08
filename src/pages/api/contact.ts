import { NextApiRequest, NextApiResponse } from 'next';

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
    supportMessageId: string;
    confirmationMessageId: string;
    timestamp: string;
  };
  errors?: Record<string, string>;
  error?: string;
  retryAfter?: number;
}

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
    // In a real implementation, you would:
    // 1. Send email to support team
    // 2. Send confirmation email to user
    // 3. Store the message in a database
    // 4. Implement proper rate limiting

    // For now, we'll simulate the email sending
    console.log('Contact form submission:', { name, email, subject, message });

    // Success response
    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully. We'll get back to you soon!",
      data: {
        supportMessageId: 'msg-' + Math.random().toString(36).substr(2, 9),
        confirmationMessageId: 'conf-' + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Contact form error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.',
      error: 'Internal server error',
    });
  }
}
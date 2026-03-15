import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { passwordResetRateLimiter } from '@/lib/rateLimit';
import { sendPasswordResetEmail } from '@/lib/email';

/**
 * Validates email format using a standard regex pattern
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generates a cryptographically secure reset token
 */
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * POST /api/auth/forgot-password
 *
 * Initiates the password reset flow by:
 * 1. Validating the email format
 * 2. Checking if user exists (but not revealing this to prevent enumeration)
 * 3. Generating a secure reset token
 * 4. Storing the token in the database with expiry
 * 5. Sending the reset email
 *
 * Always returns success message to prevent email enumeration attacks.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  // Apply rate limiting - 3 attempts per IP per hour
  const rateLimitResult = passwordResetRateLimiter(req, res);
  if (!rateLimitResult.success) {
    return; // Response already sent by rate limiter
  }

  const { email } = req.body;

  // Validate email presence and format
  if (!email || typeof email !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Email address is required'
    });
  }

  const normalisedEmail = email.toLowerCase().trim();

  if (!isValidEmail(normalisedEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address'
    });
  }

  try {
    // Check if user exists (silently - don't reveal to client)
    const user = await prisma.user.findUnique({
      where: { email: normalisedEmail },
      select: { id: true, name: true, email: true }
    });

    // If user exists, generate token and send email
    if (user) {
      // Generate secure token
      const token = generateSecureToken();

      // Set expiry to 1 hour from now
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      // Create identifier for password reset
      const identifier = `password-reset:${normalisedEmail}`;

      // Delete any existing password reset tokens for this user
      await prisma.verificationToken.deleteMany({
        where: { identifier }
      });

      // Store the new token
      await prisma.verificationToken.create({
        data: {
          identifier,
          token,
          expires
        }
      });

      // Build reset URL
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

      // Send password reset email
      try {
        await sendPasswordResetEmail(
          user.email,
          user.name || 'Customer',
          resetUrl
        );
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't expose email sending failure to user
        // The token is still valid if they somehow get the link
      }
    }

    // Always return success to prevent email enumeration
    // This is a security best practice
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email address, you will receive a password reset link shortly.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);

    // Return generic error to not expose internal details
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.'
    });
  }
}

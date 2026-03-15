import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';

// Simple in-memory rate limiting for resend requests
const resendAttempts = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 3;

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const attempts = resendAttempts.get(email);

  if (!attempts) {
    resendAttempts.set(email, { count: 1, lastAttempt: now });
    return true;
  }

  // Reset if outside window
  if (now - attempts.lastAttempt > RATE_LIMIT_WINDOW) {
    resendAttempts.set(email, { count: 1, lastAttempt: now });
    return true;
  }

  // Check if within limit
  if (attempts.count >= MAX_ATTEMPTS) {
    return false;
  }

  // Increment count
  attempts.count += 1;
  attempts.lastAttempt = now;
  return true;
}

/**
 * Resend verification email API endpoint
 * Generates a new token and sends a fresh verification email
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Email address is required',
    });
  }

  // Apply rate limiting
  if (!checkRateLimit(email.toLowerCase())) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please wait a minute before trying again.',
    });
  }

  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    // But only actually send email if user exists and isn't verified
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a verification link will be sent.',
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Your email is already verified. You can sign in.',
        alreadyVerified: true,
      });
    }

    // Delete any existing verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { identifier: email.toLowerCase() },
    });

    // Generate new verification token
    const verificationToken = crypto.randomUUID();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store new verification token
    await prisma.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token: verificationToken,
        expires: tokenExpiry,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, user.name || 'there', verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again later.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again.',
    });
  }
}

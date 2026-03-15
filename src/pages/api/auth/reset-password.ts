import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { createRateLimiter } from '@/lib/rateLimit';

/**
 * Rate limiter for password reset completion
 * Allows 5 attempts per IP per 15 minutes
 */
const resetPasswordRateLimiter = createRateLimiter({
  limit: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many password reset attempts. Please try again later.',
});

/**
 * Validates password strength requirements
 * Returns null if valid, or an error message if invalid
 *
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  return null;
}

/**
 * POST /api/auth/reset-password
 *
 * Completes the password reset flow by:
 * 1. Validating the reset token
 * 2. Checking token hasn't expired
 * 3. Validating the new password strength
 * 4. Hashing the new password
 * 5. Updating the user's password
 * 6. Deleting the used token
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

  // Apply rate limiting
  const rateLimitResult = resetPasswordRateLimiter(req, res);
  if (!rateLimitResult.success) {
    return; // Response already sent by rate limiter
  }

  const { token, password, confirmPassword } = req.body;

  // Validate required fields
  if (!token || typeof token !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Reset token is required'
    });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'New password is required'
    });
  }

  if (!confirmPassword || typeof confirmPassword !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Password confirmation is required'
    });
  }

  // Check passwords match
  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match'
    });
  }

  // Validate password strength
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({
      success: false,
      message: passwordError
    });
  }

  try {
    // Find the token in the database
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        identifier: { startsWith: 'password-reset:' }
      }
    });

    // Check if token exists
    if (!verificationToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset link. Please request a new password reset.'
      });
    }

    // Check if token has expired
    if (verificationToken.expires < new Date()) {
      // Delete the expired token
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token
          }
        }
      });

      return res.status(400).json({
        success: false,
        message: 'This reset link has expired. Please request a new password reset.'
      });
    }

    // Extract email from identifier (format: "password-reset:email@example.com")
    const email = verificationToken.identifier.replace('password-reset:', '');

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (!user) {
      // User no longer exists - clean up token
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token
          }
        }
      });

      return res.status(400).json({
        success: false,
        message: 'Unable to reset password. Please contact support.'
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Delete the used token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token
        }
      }
    });

    // Return success
    return res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);

    return res.status(500).json({
      success: false,
      message: 'An error occurred while resetting your password. Please try again later.'
    });
  }
}

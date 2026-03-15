import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

/**
 * Email verification API endpoint
 * Validates the token and marks the user's email as verified
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = req.method === 'GET' ? req.query.token : req.body.token;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Verification token is required',
    });
  }

  try {
    // Find the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token. Please request a new verification email.',
      });
    }

    // Check if token has expired
    if (new Date() > verificationToken.expires) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token },
      });

      return res.status(400).json({
        success: false,
        message: 'Verification token has expired. Please request a new verification email.',
        expired: true,
      });
    }

    // Find the user by email (identifier)
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found. Please sign up again.',
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      // Clean up the token since it's no longer needed
      await prisma.verificationToken.delete({
        where: { token },
      });

      return res.status(200).json({
        success: true,
        message: 'Your email is already verified. You can sign in.',
        alreadyVerified: true,
      });
    }

    // Update user's emailVerified field
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    // Delete the used verification token
    await prisma.verificationToken.delete({
      where: { token },
    });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now sign in.',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during verification. Please try again.',
    });
  }
}

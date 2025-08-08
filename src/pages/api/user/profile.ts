import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';
import { hash, compare } from 'bcryptjs';
import { NotificationPreferences } from '../../../types/user';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the user from the JWT token
    const token = await getToken({ req });
    
    if (!token || !token.email) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get user from database
    const user = await prisma.user.findUnique({ 
      where: { email: token.email } 
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle GET request
    if (req.method === 'GET') {
      // In a real implementation, you would fetch addresses and notification preferences from separate tables
      // For now, we'll include mock data that matches our enhanced profile structure
      const addresses: any[] = []; // This would come from a separate addresses table
      
      const defaultNotificationPreferences: NotificationPreferences = {
        id: `notif_${user.id}`,
        userId: user.id,
        emailNotifications: {
          orderConfirmation: true,
          orderStatusUpdates: true,
          deliveryReminders: true,
          subscriptionUpdates: true,
          promotionsAndOffers: false,
          newsletter: false
        },
        smsNotifications: {
          orderConfirmation: false,
          deliveryReminders: false,
          orderStatusUpdates: false
        },
        pushNotifications: {
          orderConfirmation: true,
          orderStatusUpdates: true,
          deliveryReminders: true,
          promotions: false
        },
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: user.updatedAt?.toISOString() || new Date().toISOString()
      };

      const userProfile = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        addresses,
        notificationPreferences: defaultNotificationPreferences,
        // Keep backward compatibility
        address: user.address,
        role: user.role,
        createdAt: user.createdAt,
        emailVerified: user.emailVerified
      };

      return res.status(200).json({ profile: userProfile });
    }

    // Handle PUT request (update profile)
    if (req.method === 'PUT') {
      const { name, phone, address, currentPassword, newPassword } = req.body;

      // Prepare update data
      const updateData: any = {};

      if (name !== undefined && name !== user.name) {
        updateData.name = name;
      }

      if (phone !== undefined && phone !== user.phone) {
        updateData.phone = phone;
      }

      if (address !== undefined) {
        updateData.address = address;
      }

      // Handle password change if provided
      if (currentPassword && newPassword) {
        // Verify current password
        if (!user.password) {
          return res.status(400).json({ 
            message: 'Password change not available for social login accounts' 
          });
        }

        const isPasswordValid = await compare(currentPassword, user.password);
        if (!isPasswordValid) {
          return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Validate new password
        if (newPassword.length < 8) {
          return res.status(400).json({ 
            message: 'New password must be at least 8 characters long' 
          });
        }

        // Hash new password
        const hashedPassword = await hash(newPassword, 12);
        updateData.password = hashedPassword;
      }

      // Update user profile
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          emailVerified: true
        }
      });

      return res.status(200).json({ 
        message: 'Profile updated successfully',
        profile: updatedUser 
      });
    }

  } catch (error) {
    console.error('Profile API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
    res.status(500).json({ 
      message: 'Failed to process profile request', 
      error: errorMessage 
    });
  }
}
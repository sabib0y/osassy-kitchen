import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';
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

    // Handle GET request - fetch notification preferences
    if (req.method === 'GET') {
      // In a real implementation, you would fetch from a notification_preferences table
      // For now, we'll return default preferences
      const defaultPreferences: NotificationPreferences = {
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return res.status(200).json({ preferences: defaultPreferences });
    }

    // Handle PUT request - update notification preferences
    if (req.method === 'PUT') {
      const preferencesData: Partial<NotificationPreferences> = req.body;

      // Validate the structure
      if (!preferencesData.emailNotifications && 
          !preferencesData.smsNotifications && 
          !preferencesData.pushNotifications) {
        return res.status(400).json({ message: 'At least one notification preference category must be provided' });
      }

      // In a real implementation, you would:
      // 1. Validate each notification preference object structure
      // 2. Update or create the notification preferences in the database
      // 3. Return the updated preferences

      const updatedPreferences: NotificationPreferences = {
        id: preferencesData.id || `notif_${user.id}`,
        userId: user.id,
        emailNotifications: preferencesData.emailNotifications || {
          orderConfirmation: true,
          orderStatusUpdates: true,
          deliveryReminders: true,
          subscriptionUpdates: true,
          promotionsAndOffers: false,
          newsletter: false
        },
        smsNotifications: preferencesData.smsNotifications || {
          orderConfirmation: false,
          deliveryReminders: false,
          orderStatusUpdates: false
        },
        pushNotifications: preferencesData.pushNotifications || {
          orderConfirmation: true,
          orderStatusUpdates: true,
          deliveryReminders: true,
          promotions: false
        },
        createdAt: preferencesData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return res.status(200).json({ 
        message: 'Notification preferences updated successfully',
        preferences: updatedPreferences 
      });
    }

  } catch (error) {
    console.error('Notification preferences API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
    res.status(500).json({ 
      message: 'Failed to process notification preferences request', 
      error: errorMessage 
    });
  } finally {
    await prisma.$disconnect();
  }
}
import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';
import { AddressFormData } from '../../../../types/user';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT' && req.method !== 'DELETE') {
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

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Address ID is required' });
    }

    // Handle PUT request - update address
    if (req.method === 'PUT') {
      const addressData: AddressFormData = req.body;

      // Validate required fields
      if (!addressData.label || !addressData.street || !addressData.city || 
          !addressData.state || !addressData.postalCode || !addressData.country) {
        return res.status(400).json({ message: 'All required address fields must be provided' });
      }

      // In a real implementation, you would:
      // 1. Check if the address belongs to the user
      // 2. Update the address in the database
      // 3. If isDefault is true, update other addresses to not be default

      const updatedAddress = {
        id,
        type: addressData.type,
        label: addressData.label,
        street: addressData.street,
        city: addressData.city,
        state: addressData.state,
        postalCode: addressData.postalCode,
        country: addressData.country,
        isDefault: addressData.isDefault,
        deliveryInstructions: addressData.deliveryInstructions || null,
        createdAt: new Date().toISOString(), // This would be preserved from DB
        updatedAt: new Date().toISOString()
      };

      return res.status(200).json({ 
        message: 'Address updated successfully',
        address: updatedAddress 
      });
    }

    // Handle DELETE request - delete address
    if (req.method === 'DELETE') {
      // In a real implementation, you would:
      // 1. Check if the address belongs to the user
      // 2. Prevent deletion if it's the only address or default address with other addresses
      // 3. Delete the address from the database

      return res.status(200).json({ 
        message: 'Address deleted successfully' 
      });
    }

  } catch (error) {
    console.error('Address API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
    res.status(500).json({ 
      message: 'Failed to process address request', 
      error: errorMessage 
    });
  } finally {
    await prisma.$disconnect();
  }
}
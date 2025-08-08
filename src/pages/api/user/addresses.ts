import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';
import { AddressFormData } from '../../../types/user';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
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

    // Handle GET request - fetch user addresses
    if (req.method === 'GET') {
      // Note: In a real implementation, you would have a separate addresses table
      // For now, we'll return mock data structure that matches our types
      const addresses: any[] = []; // This would come from database query

      return res.status(200).json({ addresses });
    }

    // Handle POST request - create new address
    if (req.method === 'POST') {
      const addressData: AddressFormData = req.body;

      // Validate required fields
      if (!addressData.label || !addressData.street || !addressData.city || 
          !addressData.state || !addressData.postalCode || !addressData.country) {
        return res.status(400).json({ message: 'All required address fields must be provided' });
      }

      // In a real implementation, you would:
      // 1. Create the address in the database
      // 2. If isDefault is true, update other addresses to not be default
      // For now, we'll return success response
      
      const newAddress = {
        id: `addr_${Date.now()}`,
        type: addressData.type,
        label: addressData.label,
        street: addressData.street,
        city: addressData.city,
        state: addressData.state,
        postalCode: addressData.postalCode,
        country: addressData.country,
        isDefault: addressData.isDefault,
        deliveryInstructions: addressData.deliveryInstructions || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return res.status(201).json({ 
        message: 'Address created successfully',
        address: newAddress 
      });
    }

  } catch (error) {
    console.error('Addresses API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
    res.status(500).json({ 
      message: 'Failed to process addresses request', 
      error: errorMessage 
    });
  } finally {
    await prisma.$disconnect();
  }
}
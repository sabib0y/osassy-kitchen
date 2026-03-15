import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import prisma from '../../../lib/prisma';
import { AddressFormData } from '../../../types/user';

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
      const addresses = await prisma.address.findMany({
        where: { userId: user.id },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' }
        ]
      });

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

      // If this address is set as default, unset other defaults first
      if (addressData.isDefault) {
        await prisma.address.updateMany({
          where: { userId: user.id, isDefault: true },
          data: { isDefault: false }
        });
      }

      // Create the address in the database
      const newAddress = await prisma.address.create({
        data: {
          userId: user.id,
          type: addressData.type || 'HOME',
          label: addressData.label,
          street: addressData.street,
          city: addressData.city,
          state: addressData.state,
          postalCode: addressData.postalCode,
          country: addressData.country,
          isDefault: addressData.isDefault || false,
          deliveryInstructions: addressData.deliveryInstructions || null,
        }
      });

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
  }
}

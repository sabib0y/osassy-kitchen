import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';
import { AddressFormData } from '../../../../types/user';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Address ID is required' });
  }

  if (!['GET', 'PUT', 'DELETE', 'PATCH'].includes(req.method || '')) {
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

    // Verify the address belongs to this user
    const existingAddress = await prisma.address.findFirst({
      where: { id, userId: user.id }
    });

    if (!existingAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Handle GET request - fetch single address
    if (req.method === 'GET') {
      return res.status(200).json({ address: existingAddress });
    }

    // Handle PUT request - update address
    if (req.method === 'PUT') {
      const addressData: AddressFormData = req.body;

      // Validate required fields
      if (!addressData.label || !addressData.street || !addressData.city ||
          !addressData.state || !addressData.postalCode || !addressData.country) {
        return res.status(400).json({ message: 'All required address fields must be provided' });
      }

      // If this address is set as default, unset other defaults first
      if (addressData.isDefault && !existingAddress.isDefault) {
        await prisma.address.updateMany({
          where: { userId: user.id, isDefault: true },
          data: { isDefault: false }
        });
      }

      const updatedAddress = await prisma.address.update({
        where: { id },
        data: {
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

      return res.status(200).json({
        message: 'Address updated successfully',
        address: updatedAddress
      });
    }

    // Handle DELETE request - delete address
    if (req.method === 'DELETE') {
      await prisma.address.delete({
        where: { id }
      });

      return res.status(200).json({ message: 'Address deleted successfully' });
    }

    // Handle PATCH request - used for setting default
    if (req.method === 'PATCH') {
      // Unset all other defaults for this user
      await prisma.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false }
      });

      // Set this address as default
      const updatedAddress = await prisma.address.update({
        where: { id },
        data: { isDefault: true }
      });

      return res.status(200).json({
        message: 'Default address updated',
        address: updatedAddress
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

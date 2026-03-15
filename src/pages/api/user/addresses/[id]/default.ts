import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Address ID is required' });
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

  } catch (error) {
    console.error('Set default address error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to set default address';
    res.status(500).json({
      message: 'Failed to set default address',
      error: errorMessage
    });
  } finally {
    await prisma.$disconnect();
  }
}

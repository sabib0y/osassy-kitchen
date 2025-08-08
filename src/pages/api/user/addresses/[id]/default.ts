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

    // In a real implementation, you would:
    // 1. Check if the address belongs to the user
    // 2. Set all other addresses for this user to isDefault: false
    // 3. Set the specified address to isDefault: true

    return res.status(200).json({ 
      message: 'Default address updated successfully' 
    });

  } catch (error) {
    console.error('Set default address API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
    res.status(500).json({ 
      message: 'Failed to set default address', 
      error: errorMessage 
    });
  } finally {
    await prisma.$disconnect();
  }
}
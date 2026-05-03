import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  try {
    const count = await prisma.menuItem.count();
    const dbUrl = process.env.DATABASE_URL?.replace(/:[^@]+@/, ':***@') || 'not set';
    return res.status(200).json({
      status: 'ok',
      database: { connected: true, menuItems: count, url: dbUrl },
    });
  } catch (error) {
    const dbUrl = process.env.DATABASE_URL?.replace(/:[^@]+@/, ':***@') || 'not set';
    return res.status(500).json({
      status: 'error',
      database: { connected: false, url: dbUrl },
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export default handler;

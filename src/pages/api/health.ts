import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: { available: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    const categories = Array.from(new Set(menuItems.map((item: any) => item.category))).sort();
    const dbUrl = process.env.DATABASE_URL?.replace(/:[^@]+@/, ':***@') || 'not set';
    return res.status(200).json({
      status: 'ok',
      database: { connected: true, menuItems: menuItems.length, categories, url: dbUrl },
      sample: menuItems[0] ? { id: menuItems[0].id, name: menuItems[0].name, available: menuItems[0].available } : null,
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

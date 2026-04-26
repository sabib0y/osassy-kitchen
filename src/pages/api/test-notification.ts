import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import { getToken } from 'next-auth/jwt';
import { EventType, EventCategory } from '@/types/websocket';

type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: HTTPServer & {
      io?: any;
    };
  };
};

const handler = async (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  // This endpoint is for development/testing only
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = await getToken({ req });
  if (!token?.id) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  const io = res.socket.server.io;
  if (!io) {
    return res.status(503).json({ error: 'WebSocket server not initialised. Visit /api/socket first.' });
  }

  const userId = token.id as string;
  const notification = {
    id: `test-${Date.now()}`,
    title: 'Order Confirmed',
    message: 'Your weekly meal subscription has been confirmed! Delivery is on its way.',
    type: 'success' as const,
    actionUrl: '/user/subscriptions',
    actionText: 'View subscription',
    timestamp: new Date().toISOString(),
    priority: 'normal' as const,
  };

  const wsMessage = {
    id: `notification-${Date.now()}`,
    type: EventType.NOTIFICATION_NEW,
    category: EventCategory.NOTIFICATION,
    payload: notification,
    timestamp: new Date().toISOString(),
    metadata: { userId },
  };

  // Emit to the user's room
  io.to(`user:${userId}`).emit('message', wsMessage);

  return res.status(200).json({ success: true, notification });
};

export default handler;

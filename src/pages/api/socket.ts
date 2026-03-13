// WebSocket API Endpoint
import type { NextApiRequest, NextApiResponse } from 'next';
import { Server as HTTPServer } from 'http';
import { getWebSocketServer } from '@/lib/websocket';

// Local extended type to include socket server — cannot augment NextApiResponse
// because it's a type alias, not an interface
type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: HTTPServer & {
      io?: any;
    };
  };
};

const handler = async (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if socket server is already initialized
  if (res.socket.server.io) {
    console.log('Socket server already running');
    return res.status(200).json({ success: true, message: 'Socket server already running' });
  }

  console.log('Initializing socket server...');

  try {
    // Get JWT secret from environment
    const jwtSecret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      throw new Error('JWT secret not configured');
    }

    // Initialize WebSocket server
    const wsServer = getWebSocketServer({
      jwtSecret,
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingInterval: 25000,
      pingTimeout: 60000,
      maxPayloadSize: 1e6 // 1MB
    });

    // Attach to HTTP server
    const io = wsServer.init(res.socket.server);
    res.socket.server.io = io;

    console.log('Socket server initialized successfully');

    // Setup global event handlers for demonstration
    setupGlobalHandlers(wsServer);

    return res.status(200).json({ 
      success: true, 
      message: 'Socket server initialized',
      features: {
        authentication: true,
        rooms: true,
        reconnection: true,
        messageQueue: true,
        metrics: true
      }
    });
  } catch (error) {
    console.error('Failed to initialize socket server:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to initialize socket server',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Setup global event handlers
function setupGlobalHandlers(wsServer: any): void {
  // Log metrics periodically
  setInterval(() => {
    const metrics = wsServer.getMetrics();
    console.log('WebSocket Metrics:', {
      activeConnections: metrics.activeConnections,
      totalMessages: metrics.messagesSent + metrics.messagesReceived,
      errors: metrics.errors
    });
  }, 60000); // Every minute

  // Handle cleanup on server shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing WebSocket connections...');
    const clients = wsServer.getConnectedClients();
    clients.forEach((client: any) => {
      client.socket.disconnect(true);
    });
  });
}

export default handler;

// Export config to handle WebSocket upgrade
export const config = {
  api: {
    bodyParser: false,
  },
};
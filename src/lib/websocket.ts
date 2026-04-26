// WebSocket Server Utilities
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { decode } from 'next-auth/jwt';
import {
  WSMessage,
  EventType,
  EventCategory,
  RoomType,
  WSServerClient,
  BroadcastOptions,
  WSAuthPayload,
  WSError,
  WSErrorType,
  WSMetrics,
  Room
} from '@/types/websocket';

interface AuthenticatedSocket extends Socket {
  userId: string;
  userRole: string;
  authenticated: boolean;
}

// WebSocket Server Manager
export class WebSocketServer {
  private io: SocketIOServer | null = null;
  private clients: Map<string, WSServerClient> = new Map();
  private rooms: Map<string, Room> = new Map();
  private messageQueue: Map<string, WSMessage[]> = new Map();
  private metrics: WSMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    messagesSent: 0,
    messagesReceived: 0,
    errors: 0,
    reconnections: 0,
    averageLatency: 0,
    uptime: Date.now(),
    roomStats: new Map()
  };

  constructor(private config: {
    jwtSecret: string;
    cors?: any;
    pingInterval?: number;
    pingTimeout?: number;
    maxPayloadSize?: number;
  }) {}

  // Initialize WebSocket server
  public init(server: HTTPServer): SocketIOServer {
    if (this.io) {
      return this.io;
    }

    this.io = new SocketIOServer(server, {
      cors: this.config.cors || {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingInterval: this.config.pingInterval || 25000,
      pingTimeout: this.config.pingTimeout || 60000,
      maxHttpBufferSize: this.config.maxPayloadSize || 1e6
    });

    this.setupEventHandlers();
    this.startMetricsCollection();

    return this.io;
  }

  // Setup socket event handlers
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.use(async (socket, next) => {
      try {
        await this.authenticateSocket(socket);
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });
  }

  // Authenticate socket connection
  private async authenticateSocket(socket: Socket): Promise<void> {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    
    if (!token) {
      throw this.createError(WSErrorType.AUTH_FAILED, 'No token provided');
    }

    try {
      const decoded = await decode({
        token: token.replace('Bearer ', ''),
        secret: this.config.jwtSecret,
      });

      if (!decoded) {
        throw this.createError(WSErrorType.AUTH_FAILED, 'Invalid token');
      }

      // Attach user data to socket
      const authSocket = socket as AuthenticatedSocket;
      authSocket.userId = (decoded.id as string) || (decoded.sub as string) || '';
      authSocket.userRole = (decoded.role as string) || 'USER';
      authSocket.authenticated = true;
    } catch (error) {
      throw this.createError(WSErrorType.AUTH_FAILED, 'Invalid token');
    }
  }

  // Handle new socket connection
  private handleConnection(socket: Socket): void {
    const userId = (socket as AuthenticatedSocket).userId;
    const userRole = (socket as AuthenticatedSocket).userRole;

    // Create client record
    const client: WSServerClient = {
      id: socket.id,
      userId,
      role: userRole,
      rooms: new Set(),
      socket,
      connectedAt: new Date(),
      lastActivity: new Date()
    };

    this.clients.set(socket.id, client);
    this.metrics.totalConnections++;
    this.metrics.activeConnections++;

    // Auto-join user-specific room
    if (userId) {
      this.joinRoom(socket, `user:${userId}`);
    }

    // Auto-join role-based room
    if (userRole === 'ADMIN') {
      this.joinRoom(socket, 'admin:all');
    }

    // Send connection confirmation
    this.sendToSocket(socket, {
      id: this.generateMessageId(),
      type: EventType.CONNECTION_ESTABLISHED,
      category: EventCategory.SYSTEM,
      payload: {
        socketId: socket.id,
        userId,
        role: userRole,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

    // Send queued messages if any
    this.sendQueuedMessages(userId, socket);

    // Setup socket event listeners
    this.setupSocketListeners(socket);
  }

  // Setup individual socket listeners
  private setupSocketListeners(socket: Socket): void {
    // Handle joining rooms
    socket.on('join_room', (room: string) => {
      this.joinRoom(socket, room);
    });

    // Handle leaving rooms
    socket.on('leave_room', (room: string) => {
      this.leaveRoom(socket, room);
    });

    // Handle incoming messages
    socket.on('message', (message: WSMessage) => {
      this.handleMessage(socket, message);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // Handle errors
    socket.on('error', (error: Error) => {
      this.handleError(socket, error);
    });

    // Handle ping for latency measurement
    socket.on('ping', () => {
      socket.emit('pong', Date.now());
    });
  }

  // Join a room
  public joinRoom(socket: Socket, roomName: string): void {
    const client = this.clients.get(socket.id);
    if (!client) return;

    // Check permissions
    if (!this.canJoinRoom(client, roomName)) {
      socket.emit('error', {
        type: WSErrorType.PERMISSION_DENIED,
        message: `Cannot join room: ${roomName}`
      });
      return;
    }

    socket.join(roomName);
    client.rooms.add(roomName);

    // Update room record
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, {
        id: roomName,
        type: this.getRoomType(roomName),
        members: new Set([client.userId || socket.id]),
        createdAt: new Date()
      });
    } else {
      const room = this.rooms.get(roomName)!;
      room.members.add(client.userId || socket.id);
    }

    // Update metrics
    this.updateRoomMetrics();
  }

  // Leave a room
  public leaveRoom(socket: Socket, roomName: string): void {
    const client = this.clients.get(socket.id);
    if (!client) return;

    socket.leave(roomName);
    client.rooms.delete(roomName);

    // Update room record
    const room = this.rooms.get(roomName);
    if (room) {
      room.members.delete(client.userId || socket.id);
      if (room.members.size === 0) {
        this.rooms.delete(roomName);
      }
    }

    // Update metrics
    this.updateRoomMetrics();
  }

  // Handle incoming message
  private handleMessage(socket: Socket, message: WSMessage): void {
    const client = this.clients.get(socket.id);
    if (!client) return;

    this.metrics.messagesReceived++;
    client.lastActivity = new Date();

    // Validate message
    if (!this.validateMessage(message)) {
      socket.emit('error', {
        type: WSErrorType.INVALID_MESSAGE_FORMAT,
        message: 'Invalid message format'
      });
      return;
    }

    // Process message based on type
    this.processMessage(client, message);
  }

  // Process message based on type and permissions
  private processMessage(client: WSServerClient, message: WSMessage): void {
    // Add server metadata
    message.metadata = {
      ...message.metadata,
      userId: client.userId,
      timestamp: new Date().toISOString()
    };

    // Route message based on category
    switch (message.category) {
      case EventCategory.ADMIN:
        if (client.role !== 'ADMIN') {
          this.sendError(client.socket, WSErrorType.PERMISSION_DENIED);
          return;
        }
        this.handleAdminMessage(client, message);
        break;

      case EventCategory.ORDER:
        this.handleOrderMessage(client, message);
        break;

      case EventCategory.SUBSCRIPTION:
        this.handleSubscriptionMessage(client, message);
        break;

      case EventCategory.NOTIFICATION:
        this.handleNotificationMessage(client, message);
        break;

      default:
        this.handleGenericMessage(client, message);
    }
  }

  // Broadcast message to rooms
  public broadcast<T>(
    message: WSMessage<T>,
    options: BroadcastOptions = {}
  ): void {
    if (!this.io) return;

    const {
      rooms = [],
      excludeClients = [],
      includeClients = [],
      saveToQueue = true,
      priority = 'normal',
      retryOnFail = true
    } = options;

    // Set priority
    message.metadata = {
      ...message.metadata,
      priority
    };

    // Broadcast to specific rooms
    if (rooms.length > 0) {
      rooms.forEach(room => {
        this.io!.to(room).emit('message', message);
      });
    }
    // Broadcast to specific clients
    else if (includeClients.length > 0) {
      includeClients.forEach(clientId => {
        const client = this.clients.get(clientId);
        if (client) {
          client.socket.emit('message', message);
        } else if (saveToQueue) {
          this.queueMessage(clientId, message);
        }
      });
    }
    // Broadcast to all except excluded
    else {
      const sockets = Array.from(this.clients.values())
        .filter(client => !excludeClients.includes(client.id))
        .map(client => client.socket);
      
      sockets.forEach(socket => {
        socket.emit('message', message);
      });
    }

    this.metrics.messagesSent++;
  }

  // Send message to specific user
  public sendToUser<T>(userId: string, message: WSMessage<T>): void {
    const client = Array.from(this.clients.values())
      .find(c => c.userId === userId);

    if (client) {
      client.socket.emit('message', message);
      this.metrics.messagesSent++;
    } else {
      // Queue message for offline user
      this.queueMessage(`user:${userId}`, message);
    }
  }

  // Send message to socket
  private sendToSocket<T>(socket: Socket, message: WSMessage<T>): void {
    socket.emit('message', message);
    this.metrics.messagesSent++;
  }

  // Queue message for offline users
  private queueMessage(identifier: string, message: WSMessage): void {
    const queue = this.messageQueue.get(identifier) || [];
    queue.push(message);
    
    // Limit queue size
    if (queue.length > 100) {
      queue.shift(); // Remove oldest message
    }
    
    this.messageQueue.set(identifier, queue);
  }

  // Send queued messages
  private sendQueuedMessages(userId: string, socket: Socket): void {
    const userQueue = this.messageQueue.get(`user:${userId}`);
    if (userQueue && userQueue.length > 0) {
      userQueue.forEach(message => {
        socket.emit('message', message);
      });
      this.messageQueue.delete(`user:${userId}`);
    }
  }

  // Handle disconnection
  private handleDisconnection(socket: Socket): void {
    const client = this.clients.get(socket.id);
    if (!client) return;

    // Leave all rooms
    client.rooms.forEach(room => {
      this.leaveRoom(socket, room);
    });

    // Remove client
    this.clients.delete(socket.id);
    this.metrics.activeConnections--;
  }

  // Handle errors
  private handleError(socket: Socket, error: Error): void {
    console.error('WebSocket error:', error);
    this.metrics.errors++;
    
    socket.emit('error', {
      type: WSErrorType.CONNECTION_FAILED,
      message: error.message
    });
  }

  // Helper methods
  private canJoinRoom(client: WSServerClient, room: string): boolean {
    // Admin can join any room
    if (client.role === 'ADMIN') return true;

    // User can join their own rooms
    if (room.startsWith(`user:${client.userId}`)) return true;

    // User can join their order/subscription rooms
    if (room.startsWith('order:') || room.startsWith('subscription:')) {
      // Additional validation could be added here
      return true;
    }

    // Global rooms are open to all authenticated users
    if (room === 'global') return true;

    return false;
  }

  private getRoomType(room: string): RoomType {
    if (room.startsWith('user:')) return RoomType.USER;
    if (room.startsWith('admin:')) return RoomType.ADMIN;
    if (room.startsWith('order:')) return RoomType.ORDER;
    if (room.startsWith('subscription:')) return RoomType.SUBSCRIPTION;
    return RoomType.GLOBAL;
  }

  private validateMessage(message: WSMessage): boolean {
    return !!(
      message &&
      message.type &&
      message.category &&
      message.payload
    );
  }

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private createError(type: WSErrorType, message: string): WSError {
    const error = new Error(message) as WSError;
    error.type = type;
    return error;
  }

  private sendError(socket: Socket, type: WSErrorType, message?: string): void {
    socket.emit('error', {
      type,
      message: message || 'An error occurred'
    });
  }

  // Message handlers
  private handleAdminMessage(client: WSServerClient, message: WSMessage): void {
    // Broadcast to all users or specific rooms
    if (message.type === EventType.ADMIN_BROADCAST) {
      this.broadcast(message, {
        rooms: ['global']
      });
    } else {
      // Route to specific handlers
      this.routeMessage(message);
    }
  }

  private handleOrderMessage(client: WSServerClient, message: WSMessage): void {
    // Broadcast to order room and admin
    const orderId = message.metadata?.orderId;
    if (orderId) {
      this.broadcast(message, {
        rooms: [`order:${orderId}`, 'admin:all']
      });
    }
  }

  private handleSubscriptionMessage(client: WSServerClient, message: WSMessage): void {
    // Broadcast to subscription room and admin
    const subscriptionId = message.metadata?.subscriptionId;
    if (subscriptionId) {
      this.broadcast(message, {
        rooms: [`subscription:${subscriptionId}`, 'admin:all']
      });
    }
  }

  private handleNotificationMessage(client: WSServerClient, message: WSMessage): void {
    // Send to specific user or broadcast
    const userId = message.metadata?.userId;
    if (userId) {
      this.sendToUser(userId, message);
    } else {
      this.broadcast(message, {
        rooms: ['global']
      });
    }
  }

  private handleGenericMessage(client: WSServerClient, message: WSMessage): void {
    // Route based on metadata
    this.routeMessage(message);
  }

  private routeMessage(message: WSMessage): void {
    // Route to appropriate rooms based on metadata
    const rooms = message.metadata?.room ? [message.metadata.room] : [];
    this.broadcast(message, { rooms });
  }

  // Metrics collection
  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateRoomMetrics();
    }, 30000); // Update every 30 seconds
  }

  private updateRoomMetrics(): void {
    this.metrics.roomStats.clear();
    this.rooms.forEach((room, roomName) => {
      this.metrics.roomStats.set(roomName, {
        members: room.members.size,
        messages: 0 // Would need to track this separately
      });
    });
  }

  // Public API methods
  public getMetrics(): WSMetrics {
    return { ...this.metrics };
  }

  public getConnectedClients(): WSServerClient[] {
    return Array.from(this.clients.values());
  }

  public getRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  public isUserOnline(userId: string): boolean {
    return Array.from(this.clients.values())
      .some(client => client.userId === userId);
  }

  public disconnectUser(userId: string): void {
    const clients = Array.from(this.clients.values())
      .filter(client => client.userId === userId);
    
    clients.forEach(client => {
      client.socket.disconnect(true);
    });
  }
}

// Singleton instance
let wsServerInstance: WebSocketServer | null = null;

// Get or create WebSocket server instance
export function getWebSocketServer(config?: {
  jwtSecret: string;
  cors?: any;
  pingInterval?: number;
  pingTimeout?: number;
  maxPayloadSize?: number;
}): WebSocketServer {
  if (!wsServerInstance && config) {
    wsServerInstance = new WebSocketServer(config);
  }
  
  if (!wsServerInstance) {
    throw new Error('WebSocket server not initialized. Please provide configuration.');
  }
  
  return wsServerInstance;
}

// Broadcasting utilities
export function broadcastOrderUpdate(orderId: string, payload: any): void {
  const wsServer = getWebSocketServer();
  wsServer.broadcast({
    id: `order-${Date.now()}`,
    type: EventType.ORDER_UPDATED,
    category: EventCategory.ORDER,
    payload,
    timestamp: new Date().toISOString(),
    metadata: { orderId }
  }, {
    rooms: [`order:${orderId}`, 'admin:all']
  });
}

export function broadcastSubscriptionUpdate(subscriptionId: string, payload: any): void {
  const wsServer = getWebSocketServer();
  wsServer.broadcast({
    id: `subscription-${Date.now()}`,
    type: EventType.SUBSCRIPTION_UPDATED,
    category: EventCategory.SUBSCRIPTION,
    payload,
    timestamp: new Date().toISOString(),
    metadata: { subscriptionId }
  }, {
    rooms: [`subscription:${subscriptionId}`, 'admin:all']
  });
}

export function sendNotificationToUser(userId: string, notification: any): void {
  const wsServer = getWebSocketServer();
  wsServer.sendToUser(userId, {
    id: `notification-${Date.now()}`,
    type: EventType.NOTIFICATION_NEW,
    category: EventCategory.NOTIFICATION,
    payload: notification,
    timestamp: new Date().toISOString(),
    metadata: { userId }
  });
}

export function broadcastSystemMessage(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
  const wsServer = getWebSocketServer();
  wsServer.broadcast({
    id: `system-${Date.now()}`,
    type: EventType.SYSTEM_BROADCAST,
    category: EventCategory.SYSTEM,
    payload: { message, type },
    timestamp: new Date().toISOString()
  }, {
    rooms: ['global']
  });
}
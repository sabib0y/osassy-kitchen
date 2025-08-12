// WebSocket Server Tests
import { WebSocketServer } from '@/lib/websocket';
import { Server as HTTPServer } from 'http';
import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import {
  EventType,
  EventCategory,
  WSMessage,
  WSErrorType
} from '@/types/websocket';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('socket.io');

describe('WebSocketServer', () => {
  let wsServer: WebSocketServer;
  let mockHttpServer: HTTPServer;
  let mockSocket: any;
  const testSecret = 'test-secret';

  beforeEach(() => {
    // Setup mocks
    mockHttpServer = {} as HTTPServer;
    mockSocket = {
      id: 'test-socket-id',
      handshake: {
        auth: { token: 'test-token' },
        headers: {}
      },
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      on: jest.fn(),
      disconnect: jest.fn(),
      removeAllListeners: jest.fn()
    };

    // Create WebSocket server instance
    wsServer = new WebSocketServer({
      jwtSecret: testSecret,
      debug: false
    });

    // Mock JWT verification
    (jwt.verify as jest.Mock).mockReturnValue({
      id: 'test-user-id',
      role: 'USER'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize WebSocket server', () => {
      const io = wsServer.init(mockHttpServer);
      expect(io).toBeDefined();
    });

    it('should return existing instance if already initialized', () => {
      const io1 = wsServer.init(mockHttpServer);
      const io2 = wsServer.init(mockHttpServer);
      expect(io1).toBe(io2);
    });
  });

  describe('Authentication', () => {
    it('should authenticate valid token', async () => {
      const mockNext = jest.fn();
      const authenticateSocket = (wsServer as any).authenticateSocket.bind(wsServer);
      
      await authenticateSocket(mockSocket);
      
      expect(jwt.verify).toHaveBeenCalledWith('test-token', testSecret);
      expect(mockSocket.userId).toBe('test-user-id');
      expect(mockSocket.userRole).toBe('USER');
    });

    it('should reject invalid token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const authenticateSocket = (wsServer as any).authenticateSocket.bind(wsServer);
      
      await expect(authenticateSocket(mockSocket)).rejects.toThrow();
    });

    it('should reject missing token', async () => {
      mockSocket.handshake.auth.token = null;
      
      const authenticateSocket = (wsServer as any).authenticateSocket.bind(wsServer);
      
      await expect(authenticateSocket(mockSocket)).rejects.toThrow('No token provided');
    });
  });

  describe('Room Management', () => {
    it('should allow user to join their own room', () => {
      const client = {
        id: mockSocket.id, // Use mockSocket.id instead of hardcoded 'socket-1'
        userId: 'user-1',
        role: 'USER',
        rooms: new Set<string>(),
        socket: mockSocket,
        connectedAt: new Date(),
        lastActivity: new Date()
      };

      (wsServer as any).clients.set(mockSocket.id, client); // Use mockSocket.id as key
      
      wsServer.joinRoom(mockSocket, 'user:user-1');
      
      expect(mockSocket.join).toHaveBeenCalledWith('user:user-1');
      expect(client.rooms.has('user:user-1')).toBe(true);
    });

    it('should allow admin to join any room', () => {
      const client = {
        id: mockSocket.id, // Use mockSocket.id instead of hardcoded 'socket-1'
        userId: 'admin-1',
        role: 'ADMIN',
        rooms: new Set<string>(),
        socket: mockSocket,
        connectedAt: new Date(),
        lastActivity: new Date()
      };

      (wsServer as any).clients.set(mockSocket.id, client); // Use mockSocket.id as key
      
      wsServer.joinRoom(mockSocket, 'user:other-user');
      
      expect(mockSocket.join).toHaveBeenCalledWith('user:other-user');
      expect(client.rooms.has('user:other-user')).toBe(true);
    });

    it('should prevent user from joining unauthorized room', () => {
      const client = {
        id: mockSocket.id, // Use mockSocket.id instead of hardcoded 'socket-1'
        userId: 'user-1',
        role: 'USER',
        rooms: new Set<string>(),
        socket: mockSocket,
        connectedAt: new Date(),
        lastActivity: new Date()
      };

      (wsServer as any).clients.set(mockSocket.id, client); // Use mockSocket.id as key
      
      wsServer.joinRoom(mockSocket, 'admin:all');
      
      expect(mockSocket.join).not.toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        type: WSErrorType.PERMISSION_DENIED,
        message: 'Cannot join room: admin:all'
      });
    });

    it('should handle leaving room', () => {
      const client = {
        id: mockSocket.id, // Use mockSocket.id instead of hardcoded 'socket-1'
        userId: 'user-1',
        role: 'USER',
        rooms: new Set(['user:user-1']),
        socket: mockSocket,
        connectedAt: new Date(),
        lastActivity: new Date()
      };

      (wsServer as any).clients.set(mockSocket.id, client); // Use mockSocket.id as key
      
      wsServer.leaveRoom(mockSocket, 'user:user-1');
      
      expect(mockSocket.leave).toHaveBeenCalledWith('user:user-1');
      expect(client.rooms.has('user:user-1')).toBe(false);
    });
  });

  describe('Message Handling', () => {
    it('should broadcast message to rooms', () => {
      const mockIo = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn()
      };
      (wsServer as any).io = mockIo;

      const message: WSMessage = {
        id: 'msg-1',
        type: EventType.ORDER_CREATED,
        category: EventCategory.ORDER,
        payload: { orderId: 'order-1' },
        timestamp: new Date().toISOString()
      };

      wsServer.broadcast(message, {
        rooms: ['order:order-1', 'admin:all']
      });

      expect(mockIo.to).toHaveBeenCalledWith('order:order-1');
      expect(mockIo.to).toHaveBeenCalledWith('admin:all');
      expect(mockIo.emit).toHaveBeenCalledWith('message', message);
    });

    it('should send message to specific user', () => {
      const userSocket = { ...mockSocket, emit: jest.fn() };
      const client = {
        id: 'socket-1',
        userId: 'user-1',
        role: 'USER',
        rooms: new Set<string>(),
        socket: userSocket,
        connectedAt: new Date(),
        lastActivity: new Date()
      };

      (wsServer as any).clients.set('socket-1', client);

      const message: WSMessage = {
        id: 'msg-1',
        type: EventType.NOTIFICATION_NEW,
        category: EventCategory.NOTIFICATION,
        payload: { title: 'Test', message: 'Test notification' },
        timestamp: new Date().toISOString()
      };

      wsServer.sendToUser('user-1', message);

      expect(userSocket.emit).toHaveBeenCalledWith('message', message);
    });

    it('should queue message for offline user', () => {
      const message: WSMessage = {
        id: 'msg-1',
        type: EventType.NOTIFICATION_NEW,
        category: EventCategory.NOTIFICATION,
        payload: { title: 'Test', message: 'Test notification' },
        timestamp: new Date().toISOString()
      };

      wsServer.sendToUser('offline-user', message);

      const queue = (wsServer as any).messageQueue.get('user:offline-user');
      expect(queue).toBeDefined();
      expect(queue[0]).toEqual(message);
    });
  });

  describe('Metrics', () => {
    it('should track metrics', () => {
      const metrics = wsServer.getMetrics();
      
      expect(metrics).toHaveProperty('totalConnections');
      expect(metrics).toHaveProperty('activeConnections');
      expect(metrics).toHaveProperty('messagesSent');
      expect(metrics).toHaveProperty('messagesReceived');
      expect(metrics).toHaveProperty('errors');
      expect(metrics).toHaveProperty('reconnections');
    });

    it('should update metrics on connection', () => {
      const initialMetrics = wsServer.getMetrics();
      
      // Simulate connection
      (wsServer as any).handleConnection(mockSocket);
      
      const updatedMetrics = wsServer.getMetrics();
      expect(updatedMetrics.totalConnections).toBe(initialMetrics.totalConnections + 1);
      expect(updatedMetrics.activeConnections).toBe(initialMetrics.activeConnections + 1);
    });
  });

  describe('User Management', () => {
    it('should check if user is online', () => {
      const client = {
        id: mockSocket.id, // Use mockSocket.id instead of hardcoded 'socket-1'
        userId: 'user-1',
        role: 'USER',
        rooms: new Set<string>(),
        socket: mockSocket,
        connectedAt: new Date(),
        lastActivity: new Date()
      };

      (wsServer as any).clients.set(mockSocket.id, client); // Use mockSocket.id as key
      
      expect(wsServer.isUserOnline('user-1')).toBe(true);
      expect(wsServer.isUserOnline('user-2')).toBe(false);
    });

    it('should disconnect user', () => {
      const userSocket = { ...mockSocket, disconnect: jest.fn() };
      const client = {
        id: userSocket.id, // Use userSocket.id instead of hardcoded 'socket-1'
        userId: 'user-1',
        role: 'USER',
        rooms: new Set<string>(),
        socket: userSocket,
        connectedAt: new Date(),
        lastActivity: new Date()
      };

      (wsServer as any).clients.set(userSocket.id, client); // Use userSocket.id as key
      
      wsServer.disconnectUser('user-1');
      
      expect(userSocket.disconnect).toHaveBeenCalledWith(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid message format', () => {
      const client = {
        id: mockSocket.id, // Use mockSocket.id instead of hardcoded 'socket-1'
        userId: 'user-1',
        role: 'USER',
        rooms: new Set<string>(),
        socket: mockSocket,
        connectedAt: new Date(),
        lastActivity: new Date()
      };

      (wsServer as any).clients.set(mockSocket.id, client); // Use mockSocket.id as key
      
      const invalidMessage = { invalid: 'message' } as any;
      (wsServer as any).handleMessage(mockSocket, invalidMessage);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        type: WSErrorType.INVALID_MESSAGE_FORMAT,
        message: 'Invalid message format'
      });
    });

    it('should handle permission denied for admin messages', () => {
      const client = {
        id: mockSocket.id, // Use mockSocket.id instead of hardcoded 'socket-1'
        userId: 'user-1',
        role: 'USER',
        rooms: new Set<string>(),
        socket: mockSocket,
        connectedAt: new Date(),
        lastActivity: new Date()
      };

      (wsServer as any).clients.set(mockSocket.id, client); // Use mockSocket.id as key
      
      const adminMessage: WSMessage = {
        id: 'msg-1',
        type: EventType.ADMIN_BROADCAST,
        category: EventCategory.ADMIN,
        payload: { message: 'Admin only' },
        timestamp: new Date().toISOString()
      };

      (wsServer as any).processMessage(client, adminMessage);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        type: WSErrorType.PERMISSION_DENIED,
        message: expect.any(String)
      });
    });
  });
});
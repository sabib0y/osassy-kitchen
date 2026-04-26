// WebSocket React Hook
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import {
  WSMessage,
  WSState,
  WSConfig,
  EventType,
  WSEventHandler,
  IWebSocketClient,
  EventCategory,
  WSError,
  WSErrorType
} from '@/types/websocket';

// WebSocket Client Implementation
class WebSocketClient implements IWebSocketClient {
  private socket: Socket | null = null;
  private config: WSConfig;
  private state: WSState;
  private eventHandlers: Map<EventType, Set<WSEventHandler>> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private messageBuffer: WSMessage[] = [];
  private isReconnecting = false;

  constructor(config: WSConfig) {
    this.config = {
      reconnect: true,
      reconnectAttempts: 5,
      reconnectInterval: 3000,
      pingInterval: 30000,
      pongTimeout: 10000,
      debug: false,
      ...config
    };

    this.state = {
      connected: false,
      connecting: false,
      reconnecting: false,
      error: null,
      reconnectAttempts: 0,
      rooms: new Set(),
      messageQueue: []
    };
  }

  async connect(): Promise<void> {
    if (this.state.connected || this.state.connecting) {
      return;
    }

    this.state.connecting = true;
    this.state.error = null;

    try {
      // Initialize socket connection
      this.socket = io(this.config.url || '', {
        transports: ['websocket', 'polling'],
        auth: {
          token: this.config.auth?.token
        },
        reconnection: false,
        timeout: 20000
      });

      this.setupSocketListeners();
      
      // Wait for connection
      await this.waitForConnection();
      
      this.state.connected = true;
      this.state.connecting = false;
      this.state.reconnectAttempts = 0;
      
      // Start ping interval
      this.startPingInterval();
      
      // Process buffered messages
      this.flushMessageBuffer();
      
      if (this.config.debug) {
        console.log('WebSocket connected successfully');
      }
    } catch (error) {
      this.state.connecting = false;
      this.state.error = error as Error;
      
      if (this.config.debug) {
        console.error('WebSocket connection failed:', error);
      }
      
      // Attempt reconnection if enabled
      if (this.config.reconnect) {
        this.scheduleReconnect();
      }
      
      throw error;
    }
  }

  disconnect(): void {
    this.clearTimers();
    
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.state.connected = false;
    this.state.connecting = false;
    this.state.reconnecting = false;
    this.state.rooms.clear();
    this.eventHandlers.clear();
    this.messageBuffer = [];
  }

  send<T>(message: WSMessage<T>): void {
    if (!this.state.connected) {
      // Buffer message if not connected
      this.messageBuffer.push(message);
      
      if (this.config.debug) {
        console.log('Message buffered (not connected):', message);
      }
      
      // Attempt to reconnect
      if (!this.state.connecting && !this.state.reconnecting) {
        this.connect().catch(console.error);
      }
      
      return;
    }

    if (this.socket) {
      this.socket.emit('message', message);
      
      if (this.config.debug) {
        console.log('Message sent:', message);
      }
    }
  }

  subscribe(
    eventType: EventType | EventType[],
    handler: WSEventHandler
  ): () => void {
    const types = Array.isArray(eventType) ? eventType : [eventType];
    
    types.forEach(type => {
      if (!this.eventHandlers.has(type)) {
        this.eventHandlers.set(type, new Set());
      }
      this.eventHandlers.get(type)!.add(handler);
    });

    // Return unsubscribe function
    return () => {
      types.forEach(type => {
        this.eventHandlers.get(type)?.delete(handler);
      });
    };
  }

  unsubscribe(
    eventType: EventType | EventType[],
    handler?: WSEventHandler
  ): void {
    const types = Array.isArray(eventType) ? eventType : [eventType];
    
    types.forEach(type => {
      if (handler) {
        this.eventHandlers.get(type)?.delete(handler);
      } else {
        this.eventHandlers.delete(type);
      }
    });
  }

  joinRoom(room: string): void {
    if (!this.state.connected || !this.socket) {
      console.warn('Cannot join room: not connected');
      return;
    }

    this.socket.emit('join_room', room);
    this.state.rooms.add(room);
    
    if (this.config.debug) {
      console.log(`Joined room: ${room}`);
    }
  }

  leaveRoom(room: string): void {
    if (!this.state.connected || !this.socket) {
      console.warn('Cannot leave room: not connected');
      return;
    }

    this.socket.emit('leave_room', room);
    this.state.rooms.delete(room);
    
    if (this.config.debug) {
      console.log(`Left room: ${room}`);
    }
  }

  getState(): WSState {
    return { ...this.state };
  }

  on(event: string, handler: Function): void {
    if (this.socket) {
      this.socket.on(event, handler as any);
    }
  }

  off(event: string, handler?: Function): void {
    if (this.socket) {
      if (handler) {
        this.socket.off(event, handler as any);
      } else {
        this.socket.off(event);
      }
    }
  }

  // Private methods
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.handleConnect();
    });

    this.socket.on('disconnect', (reason: string) => {
      this.handleDisconnect(reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      this.handleConnectError(error);
    });

    // Message events
    this.socket.on('message', (message: WSMessage) => {
      this.handleMessage(message);
    });

    // Error events
    this.socket.on('error', (error: any) => {
      this.handleError(error);
    });

    // Ping/Pong for latency
    this.socket.on('pong', (timestamp: number) => {
      this.state.lastPong = new Date();
      const latency = Date.now() - timestamp;
      
      if (this.config.debug) {
        console.log(`Latency: ${latency}ms`);
      }
    });
  }

  private handleConnect(): void {
    this.state.connected = true;
    this.state.connecting = false;
    this.state.reconnecting = false;
    this.state.reconnectAttempts = 0;
    this.state.error = null;
    
    // Rejoin rooms
    this.state.rooms.forEach(room => {
      if (this.socket) {
        this.socket.emit('join_room', room);
      }
    });
    
    // Notify handlers
    this.dispatchEvent({
      id: `conn-${Date.now()}`,
      type: EventType.CONNECTION_ESTABLISHED,
      category: EventCategory.SYSTEM,
      payload: { connected: true },
      timestamp: new Date().toISOString()
    });
    
    if (this.config.debug) {
      console.log('WebSocket connected');
    }
  }

  private handleDisconnect(reason: string): void {
    this.state.connected = false;
    
    // Notify handlers
    this.dispatchEvent({
      id: `disconn-${Date.now()}`,
      type: EventType.CONNECTION_CLOSED,
      category: EventCategory.SYSTEM,
      payload: { reason },
      timestamp: new Date().toISOString()
    });
    
    if (this.config.debug) {
      console.log('WebSocket disconnected:', reason);
    }
    
    // Attempt reconnection
    if (this.config.reconnect && !this.isReconnecting) {
      this.scheduleReconnect();
    }
  }

  private handleConnectError(error: Error): void {
    this.state.error = error;
    
    // Notify handlers
    this.dispatchEvent({
      id: `error-${Date.now()}`,
      type: EventType.CONNECTION_ERROR,
      category: EventCategory.SYSTEM,
      payload: { error: error.message },
      timestamp: new Date().toISOString()
    });
    
    if (this.config.debug) {
      console.error('WebSocket connection error:', error);
    }
  }

  private handleMessage(message: WSMessage): void {
    // Add to state queue
    this.state.messageQueue.push(message);
    
    // Limit queue size
    if (this.state.messageQueue.length > 100) {
      this.state.messageQueue.shift();
    }
    
    // Dispatch to handlers
    this.dispatchEvent(message);
    
    if (this.config.debug) {
      console.log('Message received:', message);
    }
  }

  private handleError(error: any): void {
    const wsError: WSError = {
      name: 'WebSocketError',
      message: error.message || 'Unknown error',
      type: error.type || WSErrorType.CONNECTION_FAILED,
      code: error.code,
      details: error.details,
      retryable: error.retryable !== false
    };
    
    this.state.error = wsError;
    
    if (this.config.debug) {
      console.error('WebSocket error:', wsError);
    }
  }

  private dispatchEvent(message: WSMessage): void {
    // Dispatch to specific event type handlers
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in event handler:', error);
        }
      });
    }
  }

  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not initialized'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 20000);

      this.socket.once('connect', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.socket.once('connect_error', (error: Error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  private scheduleReconnect(): void {
    if (this.isReconnecting) return;
    
    this.isReconnecting = true;
    this.state.reconnecting = true;
    
    if (this.state.reconnectAttempts >= (this.config.reconnectAttempts || 5)) {
      console.error('Max reconnection attempts reached');
      this.isReconnecting = false;
      this.state.reconnecting = false;
      return;
    }
    
    this.state.reconnectAttempts++;
    
    const delay = Math.min(
      this.config.reconnectInterval! * Math.pow(2, this.state.reconnectAttempts - 1),
      30000
    );
    
    if (this.config.debug) {
      console.log(`Reconnecting in ${delay}ms (attempt ${this.state.reconnectAttempts})`);
    }
    
    this.reconnectTimer = setTimeout(() => {
      this.isReconnecting = false;
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
        this.scheduleReconnect();
      });
    }, delay);
  }

  private startPingInterval(): void {
    if (!this.config.pingInterval) return;
    
    this.pingTimer = setInterval(() => {
      if (this.socket && this.state.connected) {
        this.state.lastPing = new Date();
        this.socket.emit('ping', Date.now());
      }
    }, this.config.pingInterval);
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private flushMessageBuffer(): void {
    if (this.messageBuffer.length > 0) {
      const messages = [...this.messageBuffer];
      this.messageBuffer = [];
      
      messages.forEach(message => {
        this.send(message);
      });
    }
  }
}

// React Hook
export function useWebSocket(config?: Partial<WSConfig>) {
  const { data: session } = useSession();
  const clientRef = useRef<WebSocketClient | null>(null);
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);
  const [state, setState] = useState<WSState>({
    connected: false,
    connecting: false,
    reconnecting: false,
    error: null,
    reconnectAttempts: 0,
    rooms: new Set(),
    messageQueue: []
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize WebSocket client
  const initialize = useCallback(async () => {
    if (clientRef.current || !session?.user) {
      return;
    }

    // Ensure socket endpoint is initialized
    try {
      await fetch('/api/socket');
    } catch (error) {
      console.error('Failed to initialize socket endpoint:', error);
    }

    const wsConfig: WSConfig = {
      url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || window.location.origin,
      auth: {
        token: session.accessToken || '',
        userId: session.user.id,
        role: session.user.role
      },
      debug: process.env.NODE_ENV === 'development',
      ...configRef.current
    };

    const client = new WebSocketClient(wsConfig);
    clientRef.current = client;

    // Connect
    try {
      await client.connect();
      setIsInitialized(true);
      setState(client.getState());
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setState(client.getState());
    }

    // Set up real-time state updates instead of polling
    const updateState = () => {
      if (clientRef.current) {
        setState({ ...clientRef.current.getState() });
      }
    };

    // Listen to client state changes via socket events (no polling needed)
    if (clientRef.current) {
      clientRef.current.on('connect', updateState);
      clientRef.current.on('disconnect', updateState);
      clientRef.current.on('connect_error', updateState);
      clientRef.current.on('error', updateState);
      clientRef.current.on('message', updateState);
    }

    return () => {
      if (clientRef.current) {
        clientRef.current.off('connect', updateState);
        clientRef.current.off('disconnect', updateState);
        clientRef.current.off('connect_error', updateState);
        clientRef.current.off('error', updateState);
        clientRef.current.off('message', updateState);
      }
    };
  }, [session]);

  // Initialize on mount and session change
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (session?.user) {
      initialize().then(c => { cleanup = c; });
    }

    return () => {
      cleanup?.();
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
        setIsInitialized(false);
      }
    };
  }, [session, initialize]);

  // Public API
  const send = useCallback(<T,>(message: WSMessage<T>) => {
    if (clientRef.current) {
      clientRef.current.send(message);
    }
  }, []);

  const subscribe = useCallback((
    eventType: EventType | EventType[],
    handler: WSEventHandler
  ) => {
    if (clientRef.current) {
      return clientRef.current.subscribe(eventType, handler);
    }
    return () => {};
  }, []);

  const unsubscribe = useCallback((
    eventType: EventType | EventType[],
    handler?: WSEventHandler
  ) => {
    if (clientRef.current) {
      clientRef.current.unsubscribe(eventType, handler);
    }
  }, []);

  const joinRoom = useCallback((room: string) => {
    if (clientRef.current) {
      clientRef.current.joinRoom(room);
    }
  }, []);

  const leaveRoom = useCallback((room: string) => {
    if (clientRef.current) {
      clientRef.current.leaveRoom(room);
    }
  }, []);

  const reconnect = useCallback(async () => {
    if (clientRef.current) {
      await clientRef.current.connect();
    }
  }, []);

  return {
    // State
    connected: state.connected,
    connecting: state.connecting,
    reconnecting: state.reconnecting,
    error: state.error,
    isInitialized,
    
    // Methods
    send,
    subscribe,
    unsubscribe,
    joinRoom,
    leaveRoom,
    reconnect,
    
    // Full state for advanced usage
    state,
    client: clientRef.current
  };
}
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from '../config/env.js';
import { EventType, RealtimeEvent } from './event.types.js';
import { logger } from '../utils/logger.js';

class RealtimeGateway {
  private io: SocketIOServer | null = null;

  /**
   * Called from server.ts to attach Socket.IO to the HTTP server.
   */
  initialize(httpServer: HttpServer): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: env.IS_DEVELOPMENT ? true : env.CORS_ORIGINS,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.io.on('connection', (socket: Socket) => {
      logger.info({ socketId: socket.id }, 'Socket connected');

      // Client must join a userId room immediately
      // Since there's no auth, we use the fixed userId from env/constants
      // For hackathon: client sends { userId } in join event
      socket.on('join', (data: { userId: string }) => {
        if (data?.userId) {
          socket.join(`user:${data.userId}`);
          logger.info({ socketId: socket.id, userId: data.userId }, 'Socket joined user room');
          socket.emit('joined', { userId: data.userId, status: 'connected' });
        }
      });

      // Relay client-to-client telemetry between Phone 1 and Phone 2
      socket.on('relay', (data: { userId?: string; type: string; payload: unknown }) => {
        const room = `user:${data?.userId || 'user_fixed_001'}`;
        socket.to(room).emit('sync_message', { type: data.type, payload: data.payload });
      });

      socket.on('disconnect', (reason) => {
        logger.info({ socketId: socket.id, reason }, 'Socket disconnected');
      });

      socket.on('error', (err) => {
        logger.error({ socketId: socket.id, err }, 'Socket error');
      });
    });

    logger.info('✅ Socket.IO gateway initialized');
    return this.io;
  }

  /**
   * Broadcast a realtime event to all sockets in a user's room.
   */
  broadcast(userId: string, event: EventType, data: Record<string, unknown>): void {
    if (!this.io) {
      logger.warn({ event, userId }, 'Realtime gateway not initialized, skipping broadcast');
      return;
    }

    const payload: RealtimeEvent = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    this.io.to(`user:${userId}`).emit(event, payload);
    logger.debug({ event, userId }, 'Event broadcast');
  }

  /**
   * Broadcast to all connected clients (admin/system events).
   */
  broadcastAll(event: EventType, data: Record<string, unknown>): void {
    if (!this.io) return;
    this.io.emit(event, { event, timestamp: new Date().toISOString(), data });
  }

  close(): void {
    this.io?.close();
  }
}

// Singleton — used throughout services
export const realtimeGateway = new RealtimeGateway();

// Factory function called from server.ts
export function createRealtimeGateway(httpServer: HttpServer): SocketIOServer {
  return realtimeGateway.initialize(httpServer);
}

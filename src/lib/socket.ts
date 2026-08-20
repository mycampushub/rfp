import { Server, Socket } from 'socket.io';
import { getToken } from 'next-auth/jwt';

interface AuthenticatedSocket extends Socket {
  userId: string;
  tenantId: string;
  _rateLimitTimestamps: number[];
}

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

export const setupSocket = (io: Server) => {
  // Middleware: authenticate every connection
  io.use(async (socket, next) => {
    try {
      // Extract token from handshake.auth.token or Authorization header
      let token: string | undefined =
        socket.handshake.auth?.token;

      if (!token) {
        const authHeader = (socket.handshake.headers.authorization || socket.handshake.headers.Authorization) as string | undefined;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.slice(7);
        }
      }

      if (!token) {
        return next(new Error('Authentication required: no token provided'));
      }

      // Validate the JWT using next-auth's getToken

      const jwtPayload: any = await (getToken as any)({
        secret: process.env.NEXTAUTH_SECRET,
        token,
      });

      if (!jwtPayload) {
        return next(new Error('Authentication failed: invalid token'));
      }

      // Attach authenticated identity to the socket
      const authedSocket = socket as AuthenticatedSocket;
      authedSocket.userId = jwtPayload.sub as string;
      authedSocket.tenantId = jwtPayload.tenantId as string;
      authedSocket._rateLimitTimestamps = [];

      // Join tenant-scoped room for tenant messaging
      if (authedSocket.tenantId) {
        authedSocket.join(`tenant:${authedSocket.tenantId}`);
      }

      next();
    } catch (_err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const authedSocket = socket as AuthenticatedSocket;
    console.log('Client connected:', socket.id, 'user:', authedSocket.userId, 'tenant:', authedSocket.tenantId);

    // Handle messages with rate limiting and authenticated sender
    socket.on('message', (msg: { text: string }) => {
      const now = Date.now();

      // Sliding window rate limiting: max 10 messages per minute
      authedSocket._rateLimitTimestamps = authedSocket._rateLimitTimestamps.filter(
        (ts) => now - ts < RATE_LIMIT_WINDOW_MS
      );

      if (authedSocket._rateLimitTimestamps.length >= RATE_LIMIT_MAX) {
        socket.emit('error', { message: 'Rate limit exceeded: max 10 messages per minute' });
        return;
      }

      authedSocket._rateLimitTimestamps.push(now);

      // Use authenticated userId instead of trusting client-provided senderId
      const response = {
        text: msg.text,
        senderId: authedSocket.userId,
        tenantId: authedSocket.tenantId,
        timestamp: new Date().toISOString(),
      };

      // Broadcast to tenant room (tenant-scoped messaging)
      if (authedSocket.tenantId) {
        io.to(`tenant:${authedSocket.tenantId}`).emit('message', response);
      } else {
        // Fallback: echo back to sender only
        socket.emit('message', {
          ...response,
          text: `Echo: ${msg.text}`,
          senderId: 'system',
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to WebSocket Server!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};

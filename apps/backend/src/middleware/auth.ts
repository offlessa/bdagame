import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

export function authMiddleware(socket: Socket, next: (err?: Error) => void): void {
  const token = socket.handshake.auth.token as string | undefined;

  if (!token) {
    next(new Error('Authentication token missing'));
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'dev-secret') as { userId: string };
    socket.data = { userId: payload.userId };
    next();
  } catch {
    next(new Error('Invalid token'));
  }
}

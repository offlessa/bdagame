import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import cardsRouter from './routes/cards';
import rankingRouter from './routes/ranking';
import { registerGameHandlers } from './socket/gameHandlers';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL ?? '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: process.env.FRONTEND_URL ?? '*' }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/cards', cardsRouter);
app.use('/api/ranking', rankingRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

io.use(authMiddleware);

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id} user: ${(socket.data as { userId: string }).userId}`);
  registerGameHandlers(io, socket);
  socket.on('disconnect', () => console.log(`[socket] disconnected: ${socket.id}`));
});

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => console.log(`[server] listening on port ${PORT}`));

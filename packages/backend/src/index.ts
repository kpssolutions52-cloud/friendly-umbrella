import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { setupRoutes } from './routes';
import { setupWebSocket } from './websocket';
import { setSocketIO } from './utils/socket';

const app = express();
const httpServer = createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
setupRoutes(app);

// WebSocket setup
const io = new SocketIOServer(httpServer, {
  cors: corsOptions,
});
setSocketIO(io);
setupWebSocket(io);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Support multiple platforms: Railway, Fly.io, Render, etc.
const PORT = process.env.PORT || process.env.RAILWAY_PORT || 8000;

httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📡 WebSocket server ready`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app, io };


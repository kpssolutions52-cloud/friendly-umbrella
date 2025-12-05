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

// Validate required environment variables (warn but don't exit - let server start)
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('⚠️  WARNING: Missing required environment variables:');
  missingVars.forEach((varName) => {
    console.error(`   - ${varName}`);
  });
  console.error('⚠️  Server will start but may not function correctly.');
  console.error('⚠️  Please set these in your Railway service Variables tab.');
}

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

// Add console.log for Railway to capture startup
console.log('Starting server...');
console.log(`PORT: ${PORT}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

httpServer.listen(PORT, () => {
  console.log(`✅ Server started successfully on port ${PORT}`);
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📡 WebSocket server ready`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
}).on('error', (err: Error) => {
  console.error('❌ Server failed to start:', err);
  logger.error('Server failed to start', { error: err });
  process.exit(1);
});

export { app, io };


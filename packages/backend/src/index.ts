import 'dotenv/config';

// For E2E tests with TestContainers, the database is initialized in global-setup
// The DATABASE_URL will be set by TestContainers and passed via environment
// No special initialization needed here - Prisma will connect normally

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
import { startPriceExpiryCleanupJob } from './jobs/priceExpiryCleanup';

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

// CORS configuration - support multiple origins and normalize (remove trailing slashes)
const normalizeOrigin = (origin: string) => origin.trim().replace(/\/+$/, '');

const getAllowedOrigins = () => {
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  
  // Default allowed origins (Vercel preview and production)
  const defaultOrigins = [
    'http://localhost:3000',
    'https://friendly-umbrella-frontend.vercel.app',
  ];
  
  // Support comma-separated origins for multiple frontends
  let userOrigins: string[] = [];
  if (corsOrigin.includes(',')) {
    userOrigins = corsOrigin.split(',').map(normalizeOrigin);
  } else {
    userOrigins = [normalizeOrigin(corsOrigin)];
  }
  
  // Combine user origins with defaults, removing duplicates
  const allOrigins = [...new Set([...defaultOrigins, ...userOrigins])];
  return allOrigins;
};

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean | string) => void) => {
    const allowedOrigins = getAllowedOrigins();
    const normalizedOrigin = origin ? normalizeOrigin(origin) : undefined;
    
    // If no origin (e.g., same-origin request), allow it
    if (!normalizedOrigin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list (normalized)
    const allowedOriginsList = Array.isArray(allowedOrigins) ? allowedOrigins : [allowedOrigins];
    const matchedOrigin = allowedOriginsList.find((allowed) => normalizeOrigin(allowed) === normalizedOrigin);
    
    if (matchedOrigin) {
      // Return the normalized origin (without trailing slash) as the header value
      callback(null, normalizedOrigin);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
try {
  setupRoutes(app);
  console.log('✅ Routes setup complete');
} catch (error) {
  console.error('❌ Error setting up routes:', error);
  // Continue anyway - at least health endpoint will work
}

// WebSocket setup
let io: SocketIOServer | null = null;
try {
  io = new SocketIOServer(httpServer, {
    cors: corsOptions,
  });
  setSocketIO(io);
  setupWebSocket(io);
  console.log('✅ WebSocket setup complete');
} catch (error) {
  console.error('❌ Error setting up WebSocket:', error);
  // Continue anyway - HTTP endpoints will still work
}

// Start scheduled jobs
try {
  startPriceExpiryCleanupJob();
  console.log('✅ Scheduled jobs started');
} catch (error) {
  console.error('❌ Error starting scheduled jobs:', error);
  // Continue anyway - main functionality will still work
}

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Global error handlers
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('❌ Stack:', error.stack);
  // Don't exit - let the server try to continue
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - let the server try to continue
});

// Support multiple platforms: Railway, Fly.io, Render, etc.
const PORT = process.env.PORT || process.env.RAILWAY_PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for Railway

// Add console.log for Railway to capture startup
console.log('🚀 Starting server...');
console.log(`📡 PORT: ${PORT}`);
console.log(`🌐 HOST: ${HOST}`);
console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`💾 DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`🔑 JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);

// Wrap server startup in try-catch to ensure we always log errors
try {
  httpServer.listen(parseInt(PORT as string, 10), HOST, () => {
    console.log(`✅ Server started successfully on ${HOST}:${PORT}`);
    console.log(`✅ Health endpoint available at http://${HOST}:${PORT}/health`);
    logger.info(`🚀 Server running on ${HOST}:${PORT}`);
    if (io) {
      logger.info(`📡 WebSocket server ready`);
    }
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  }).on('error', (err: Error) => {
    console.error('❌ Server failed to start:', err);
    console.error('❌ Error details:', err.message);
    console.error('❌ Stack:', err.stack);
    logger.error('Server failed to start', { error: err });
    process.exit(1);
  });
} catch (error: any) {
  console.error('❌ Fatal error during server startup:', error);
  console.error('❌ Error details:', error?.message);
  console.error('❌ Stack:', error?.stack);
  process.exit(1);
}

export { app, io };


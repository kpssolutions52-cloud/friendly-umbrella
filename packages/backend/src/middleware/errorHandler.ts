import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error | createError.HttpError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // If headers already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Determine status code - check for statusCode property or use instanceof
  const statusCode = 
    (err as any).statusCode || 
    (err instanceof createError.HttpError ? err.statusCode : undefined) ||
    500;

  // Don't expose internal errors in production
  const message =
    statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message || 'An error occurred';

  res.status(statusCode).json({
    error: {
      message,
      statusCode,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
}














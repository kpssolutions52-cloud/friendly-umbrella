/**
 * Permissions Middleware
 * Simplified for QS AI Agent - type-based permissions (qs | supplier)
 */

import { Response, NextFunction } from 'express';
import createError from 'http-errors';
import { AuthRequest } from './authMiddleware';

/**
 * Require QS user type
 */
export function requireQS(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.userId) {
    return next(createError(401, 'Authentication required'));
  }

  if (req.userType !== 'qs') {
    return next(createError(403, 'QS user type required'));
  }

  next();
}

/**
 * Require Supplier user type
 */
export function requireSupplier(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.userId) {
    return next(createError(401, 'Authentication required'));
  }

  if (req.userType !== 'supplier') {
    return next(createError(403, 'Supplier user type required'));
  }

  next();
}

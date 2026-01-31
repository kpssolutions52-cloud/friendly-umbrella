/**
 * Permission Middleware - Type-based access control
 */

import { Request, Response, NextFunction } from 'express';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        type: 'qs' | 'supplier';
        organizationId: string;
      };
    }
  }
}

/**
 * Require QS user type
 */
export function requireQS(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.type !== 'qs') {
    res.status(403).json({
      error: 'QS access required. This feature is only available for Quantity Surveyor professionals.',
    });
    return;
  }

  next();
}

/**
 * Require Supplier user type
 */
export function requireSupplier(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.type !== 'supplier') {
    res.status(403).json({
      error: 'Supplier access required. This feature is only available for suppliers.',
    });
    return;
  }

  next();
}

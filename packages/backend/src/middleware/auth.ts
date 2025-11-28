import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import createError from 'http-errors';
import { prisma } from '../utils/prisma';

export interface AuthRequest extends Request {
  userId?: string;
  tenantId?: string;
  userRole?: string;
  tenantType?: string;
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError(401, 'No token provided');
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as {
      userId: string;
      tenantId: string;
      role: string;
      tenantType: string;
    };

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { tenant: true },
    });

    if (!user || !user.isActive || !user.tenant.isActive) {
      throw createError(401, 'User or tenant is inactive');
    }

    // Attach user info to request
    req.userId = decoded.userId;
    req.tenantId = decoded.tenantId;
    req.userRole = decoded.role;
    req.tenantType = decoded.tenantType;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createError(401, 'Invalid token'));
    } else {
      next(error);
    }
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      return next(createError(401, 'Authentication required'));
    }

    if (!allowedRoles.includes(req.userRole)) {
      return next(createError(403, 'Insufficient permissions'));
    }

    next();
  };
}

export function requireTenantType(...allowedTypes: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.tenantType) {
      return next(createError(401, 'Authentication required'));
    }

    if (!allowedTypes.includes(req.tenantType)) {
      return next(createError(403, 'Invalid tenant type'));
    }

    next();
  };
}


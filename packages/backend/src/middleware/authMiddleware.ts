/**
 * Authentication Middleware
 * Simplified for QS AI Agent - uses new schema (Organization, User with type)
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import createError from 'http-errors';
import { prisma } from '../utils/prisma';

export interface AuthRequest extends Request {
  userId?: string;
  organizationId?: string | null;
  userType?: 'qs' | 'supplier';
  organizationType?: 'company' | 'supplier';
}

/**
 * Require authentication - verifies JWT token and loads user
 */
export async function requireAuth(
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
      tenantId: string; // JWT uses tenantId (for compatibility)
      role: string;
      tenantType: string;
    };

    // Verify user still exists - NEW SCHEMA ONLY
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { organization: true },
    });

    if (!user) {
      throw createError(401, 'User not found');
    }

    if (!user.organization) {
      throw createError(403, 'User organization not found');
    }

    const userType = user.type;
    const organizationId = user.organizationId;
    const organizationType = user.organization.type;
    const organization = user.organization;

    // Verify organizationId is not null and matches the organization
    if (!organizationId || organizationId !== organization.id) {
      console.error('[requireAuth] Organization ID mismatch:', {
        userOrganizationId: organizationId,
        organizationId: organization.id,
        userId: user.id,
      });
      throw createError(403, 'User organization mismatch');
    }

    // Attach user info to request
    req.userId = decoded.userId;
    req.organizationId = organizationId;
    req.userType = userType;
    req.organizationType = organizationType;
    
    // Also attach to req.user for compatibility - use the verified organization ID
    (req as any).user = {
      id: user.id,
      email: user.email,
      type: userType,
      organizationId: organization.id, // Use the verified organization ID from the database
    };
    
    console.log('[requireAuth] User authenticated:', {
      userId: user.id,
      email: user.email,
      userType,
      organizationId: organization.id,
      organizationType,
    });

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return next(createError(401, 'Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(createError(401, 'Token expired'));
    }
    next(error);
  }
}

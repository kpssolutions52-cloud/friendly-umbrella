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

    // Verify user still exists - handle both old and new schemas
    let user: any;
    let organization: any;
    let userType: 'qs' | 'supplier' | null = null;
    let organizationId: string | null = null;
    let organizationType: 'company' | 'supplier' | null = null;

    try {
      // Try new schema first
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { organization: true },
      });

      if (user && user.organization) {
        // New schema
        organization = user.organization;
        userType = user.type;
        organizationId = user.organizationId;
        organizationType = user.organization.type;
      } else if (user) {
        // User exists but no organization - try old schema
        throw new Error('No organization found - checking old schema');
      }
    } catch (error: any) {
      // Try old schema using raw SQL
      console.log('[AuthMiddleware] Trying old schema with raw SQL...');
      try {
        const result = await prisma.$queryRaw<any[]>`
          SELECT 
            u.id,
            u.email,
            u.role,
            u.tenant_id as "tenantId",
            t.id as "tenantId",
            t.name as "tenantName",
            t.type as "tenantType"
          FROM users u
          LEFT JOIN tenants t ON u.tenant_id = t.id
          WHERE u.id = ${decoded.userId}
          LIMIT 1
        `;

        if (result && result.length > 0) {
          const row = result[0];
          user = {
            id: row.id,
            email: row.email,
            role: row.role,
            tenantId: row.tenantId,
          };
          
          organization = {
            id: row.tenantId,
            name: row.tenantName,
            type: row.tenantType,
          };
          
          // Map role to type
          if (user.role === 'company_staff' || user.role === 'company_admin') {
            userType = 'qs';
          } else if (user.role === 'supplier_staff' || user.role === 'supplier_admin') {
            userType = 'supplier';
          }
          
          organizationId = row.tenantId;
          organizationType = row.tenantType;
        } else {
          throw createError(401, 'User not found');
        }
      } catch (oldSchemaError: any) {
        console.error('[AuthMiddleware] Old schema query failed:', oldSchemaError);
        throw createError(401, 'User not found');
      }
    }

    if (!user || !userType || !organizationId || !organizationType || !organization) {
      throw createError(401, 'User not found');
    }

    // Attach user info to request
    req.userId = decoded.userId;
    req.organizationId = organizationId;
    req.userType = userType;
    req.organizationType = organizationType;
    
    // Also attach to req.user for compatibility
    (req as any).user = {
      id: user.id,
      email: user.email,
      type: userType,
      organizationId: organizationId,
    };

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

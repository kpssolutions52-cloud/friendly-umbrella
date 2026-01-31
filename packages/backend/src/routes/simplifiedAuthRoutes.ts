/**
 * Simplified Auth Routes for MVP 1
 * 2-step registration flow
 */

import { Router, Request, Response, NextFunction } from 'express';
import { simplifiedAuthService } from '../services/simplifiedAuthService';
import { body, validationResult } from 'express-validator';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  userType: z.enum(['qs', 'supplier']),
  organizationId: z.string().uuid().optional(),
  organizationName: z.string().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// GET /api/v1/auth/organizations?type=company|supplier
router.get(
  '/auth/organizations',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = req.query.type as 'company' | 'supplier';

      if (!type || (type !== 'company' && type !== 'supplier')) {
        return res.status(400).json({
          error: 'Type query parameter is required and must be "company" or "supplier"',
        });
      }

      console.log('[AuthRoutes] Fetching organizations with type:', type);
      const result = await simplifiedAuthService.getOrganizations(type);
      console.log('[AuthRoutes] Found organizations:', result.organizations.length);
      res.json(result);
    } catch (error: any) {
      console.error('[AuthRoutes] Error in /auth/organizations:', error);
      next(error);
    }
  }
);

// POST /api/v1/auth/register
router.post(
  '/auth/register',
  [
    body('userType')
      .isIn(['qs', 'supplier'])
      .withMessage('User type must be "qs" or "supplier"'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const input = registerSchema.parse(req.body);

      // Validate: either organizationId or organizationName must be provided
      if (!input.organizationId && !input.organizationName) {
        return res.status(400).json({
          error: 'Either organizationId (to join existing) or organizationName (to create new) is required',
        });
      }

      console.log('[AuthRoutes] Registering user:', { email: input.email, userType: input.userType });
      const result = await simplifiedAuthService.register(input);
      console.log('[AuthRoutes] Registration successful for:', input.email);
      res.status(201).json(result);
    } catch (error: any) {
      console.error('[AuthRoutes] Error in /auth/register:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  }
);

// POST /api/v1/auth/login
router.post(
  '/auth/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const input = loginSchema.parse(req.body);
      console.log('[AuthRoutes] Login attempt for:', input.email);
      const result = await simplifiedAuthService.login(input);
      console.log('[AuthRoutes] Login successful for:', input.email);
      
      res.json({
        message: result.message,
        user: result.user,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error: any) {
      console.error('[AuthRoutes] Login error:', {
        email: req.body?.email,
        error: error.message,
        status: error.status || error.statusCode,
        stack: error.stack,
      });
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }

      // Handle authentication errors
      if (error.status === 401 || error.statusCode === 401) {
        return res.status(401).json({ error: error.message || 'Invalid email or password' });
      }

      // Handle other known errors
      if (error.status || error.statusCode) {
        return res.status(error.status || error.statusCode).json({ 
          error: error.message || 'An error occurred' 
        });
      }

      next(error);
    }
  }
);

// GET /api/v1/auth/me - Get current user
router.get(
  '/auth/me',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.substring(7);
      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        return res.status(500).json({ error: 'JWT_SECRET not configured' });
      }

      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, jwtSecret) as {
        userId: string;
        tenantId: string; // JWT uses tenantId (for compatibility)
        role: string;
        tenantType: string;
      };

      // Get user with organization
      const { prisma } = await import('../utils/prisma');
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { organization: true },
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Return user in format expected by frontend (compatible with both old and new schema)
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.name?.split(' ')[0] || null,
        lastName: user.name?.split(' ').slice(1).join(' ') || null,
        type: user.type, // New schema: 'qs' | 'supplier'
        role: user.type === 'qs' ? 'company_staff' : 'supplier_staff', // For compatibility with old schema
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          type: user.organization.type,
        },
        organizationId: user.organizationId, // New schema
        tenant: {
          id: user.organization.id,
          name: user.organization.name,
          type: user.organization.type,
        },
        tenantId: user.organizationId, // For compatibility with old schema
      });
    } catch (error: any) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      next(error);
    }
  }
);

export default router;

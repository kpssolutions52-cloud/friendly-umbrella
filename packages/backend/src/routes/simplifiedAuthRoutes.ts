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

      const result = await simplifiedAuthService.getOrganizations(type);
      res.json(result);
    } catch (error) {
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

      const result = await simplifiedAuthService.register(input);
      res.status(201).json(result);
    } catch (error) {
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
      const result = await simplifiedAuthService.login(input);

      res.json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }

      // Handle authentication errors
      if (error.status === 401) {
        return res.status(401).json({ error: error.message });
      }

      next(error);
    }
  }
);

export default router;

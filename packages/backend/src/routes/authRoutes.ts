import { Router } from 'express';
import { authService } from '../services/authService';
import { authenticate } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  tenantName: z.string().min(1),
  tenantType: z.enum(['supplier', 'company']),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/v1/auth/register
router.post(
  '/auth/register',
  [
    body('tenantName').notEmpty().withMessage('Tenant name is required'),
    body('tenantType')
      .isIn(['supplier', 'company'])
      .withMessage('Tenant type must be supplier or company'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const input = registerSchema.parse(req.body);
      const result = await authService.register(input);

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
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const input = loginSchema.parse(req.body);
      const result = await authService.login(input);

      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  }
);

// POST /api/v1/auth/refresh
router.post('/auth/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const result = await authService.refreshAccessToken(refreshToken);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/auth/me
router.get('/auth/me', authenticate, async (req: any, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.userId!);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };


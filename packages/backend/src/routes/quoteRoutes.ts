import { Router, Response, NextFunction } from 'express';
import { quoteService } from '../services/quoteService';
import { aiQuoteService } from '../services/aiQuoteService';
import { authenticate, optionalAuthenticate, AuthRequest, requireTenantType } from '../middleware/auth';
import { body, param, query, validationResult } from 'express-validator';
import { QuoteStatus } from '@prisma/client';
import createError from 'http-errors';

const router = Router();

// POST /api/v1/quotes/ai-search - AI-powered product/service search (Available for companies, suppliers, and guests)
// IMPORTANT: This route must be BEFORE the router.use(authenticate) to allow optional authentication
router.post(
  '/quotes/ai-search',
  optionalAuthenticate, // Allow guests to access without authentication
  [
    body('prompt').isString().trim().notEmpty().withMessage('Prompt is required'),
    body('prompt').isLength({ min: 3, max: 1000 }).withMessage('Prompt must be between 3 and 1000 characters'),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { prompt } = req.body;
      
      // Determine tenant type and ID based on authentication
      let tenantId: string | null = null;
      let tenantType: 'company' | 'supplier' | 'service_provider' | 'guest' = 'guest';

      if (req.tenantType && req.tenantId) {
        tenantId = req.tenantId;
        tenantType = req.tenantType as 'company' | 'supplier' | 'service_provider';
      } else {
        // Guest access - no tenant ID
        tenantType = 'guest';
      }

      console.log('[AI-Quote] Request received:', { tenantType, tenantId, promptLength: prompt.length, hasAuth: !!req.userId });

      const result = await aiQuoteService.searchWithAI(prompt, tenantId, tenantType);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// All other routes require authentication
router.use(authenticate);

// POST /api/v1/quotes - Create a new quote request (Company only)
router.post(
  '/quotes',
  requireTenantType('company'),
  [
    body('productId').isUUID().withMessage('Invalid product ID'),
    body('quantity').optional().isFloat({ min: 0 }).withMessage('Quantity must be positive'),
    body('unit').optional().isString().withMessage('Unit must be a string'),
    body('requestedPrice').optional().isFloat({ min: 0 }).withMessage('Requested price must be positive'),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
    body('message').optional().isString().withMessage('Message must be a string'),
    body('expiresAt').optional().isISO8601().withMessage('Invalid expiration date'),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const quoteRequest = await quoteService.createQuoteRequest(
        req.tenantId!,
        req.body.productId,
        req.userId!,
        {
          quantity: req.body.quantity,
          unit: req.body.unit,
          requestedPrice: req.body.requestedPrice,
          currency: req.body.currency,
          message: req.body.message,
          expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
        }
      );

      res.status(201).json({ quoteRequest });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/quotes - Get quote requests (Company or Supplier)
router.get(
  '/quotes',
  [
    query('status').optional().isIn(Object.values(QuoteStatus)).withMessage('Invalid status'),
    query('supplierId').optional().isUUID().withMessage('Invalid supplier ID'),
    query('companyId').optional().isUUID().withMessage('Invalid company ID'),
    query('productId').optional().isUUID().withMessage('Invalid product ID'),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const tenantType = req.tenantType!;
      const tenantId = req.tenantId!;

      let quoteRequests;
      if (tenantType === 'company') {
        quoteRequests = await quoteService.getCompanyQuoteRequests(tenantId, {
          status: req.query.status as QuoteStatus | undefined,
          supplierId: req.query.supplierId as string | undefined,
          productId: req.query.productId as string | undefined,
        });
      } else if (tenantType === 'supplier' || tenantType === 'service_provider') {
        quoteRequests = await quoteService.getSupplierQuoteRequests(tenantId, {
          status: req.query.status as QuoteStatus | undefined,
          companyId: req.query.companyId as string | undefined,
          productId: req.query.productId as string | undefined,
        });
      } else {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({ quoteRequests });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/quotes/:id - Get a single quote request
router.get(
  '/quotes/:id',
  param('id').isUUID().withMessage('Invalid quote request ID'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const quoteRequest = await quoteService.getQuoteRequestById(
        req.params.id,
        req.tenantId!,
        req.tenantType!
      );

      res.json({ quoteRequest });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/quotes/:id/respond - Respond to a quote request (Supplier only)
router.post(
  '/quotes/:id/respond',
  requireTenantType('supplier', 'service_provider'),
  [
    param('id').isUUID().withMessage('Invalid quote request ID'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
    body('quantity').optional().isFloat({ min: 0 }).withMessage('Quantity must be positive'),
    body('unit').optional().isString().withMessage('Unit must be a string'),
    body('validUntil').optional().isISO8601().withMessage('Invalid valid until date'),
    body('message').optional().isString().withMessage('Message must be a string'),
    body('terms').optional().isString().withMessage('Terms must be a string'),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const quoteResponse = await quoteService.respondToQuoteRequest(
        req.params.id,
        req.tenantId!,
        req.userId!,
        {
          price: req.body.price,
          currency: req.body.currency,
          quantity: req.body.quantity,
          unit: req.body.unit,
          validUntil: req.body.validUntil ? new Date(req.body.validUntil) : undefined,
          message: req.body.message,
          terms: req.body.terms,
        }
      );

      res.status(201).json({ quoteResponse });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/quotes/:id/accept - Accept a quote response (Company only)
router.post(
  '/quotes/:id/accept',
  requireTenantType('company'),
  [
    param('id').isUUID().withMessage('Invalid quote request ID'),
    body('quoteResponseId').isUUID().withMessage('Invalid quote response ID'),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const quoteResponse = await quoteService.acceptQuoteResponse(
        req.body.quoteResponseId,
        req.tenantId!
      );

      res.json({ quoteResponse });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/quotes/:id/reject - Reject a quote (Company or Supplier)
router.post(
  '/quotes/:id/reject',
  [
    param('id').isUUID().withMessage('Invalid quote request ID'),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const quoteRequest = await quoteService.rejectQuote(
        req.params.id,
        req.tenantId!,
        req.tenantType!
      );

      res.json({ quoteRequest });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/quotes/:id/cancel - Cancel a quote request (Company only)
router.post(
  '/quotes/:id/cancel',
  requireTenantType('company'),
  [
    param('id').isUUID().withMessage('Invalid quote request ID'),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const quoteRequest = await quoteService.cancelQuoteRequest(
        req.params.id,
        req.tenantId!
      );

      res.json({ quoteRequest });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/quotes/statistics - Get quote statistics
router.get(
  '/quotes/statistics',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const statistics = await quoteService.getQuoteStatistics(
        req.tenantId!,
        req.tenantType!
      );

      res.json({ statistics });
    } catch (error) {
      next(error);
    }
  }
);


export default router;

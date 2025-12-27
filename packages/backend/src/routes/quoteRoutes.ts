import { Router, Response, NextFunction } from 'express';
import { quoteService } from '../services/quoteService';
import { aiQuoteService } from '../services/aiQuoteService';
import { authenticate, optionalAuthenticate, AuthRequest, requireTenantType } from '../middleware/auth';
import { body, param, query, validationResult } from 'express-validator';
import { QuoteStatus } from '@prisma/client';
import createError from 'http-errors';
import multer from 'multer';
import { parseRFQCSV } from '../utils/csvParser';

// Configure multer for CSV file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept only CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

const router = Router();

// POST /api/v1/quotes/ai-search - AI-powered product/service search (Available for companies, suppliers, service providers, and guests)
// IMPORTANT: This route must be BEFORE the router.use(authenticate) to allow optional authentication
// This route explicitly allows all tenant types including 'company', 'supplier', 'service_provider', and 'guest'
// NO requireTenantType middleware is used here - all tenant types are explicitly allowed
router.post(
  '/quotes/ai-search',
  optionalAuthenticate, // Allow guests to access without authentication - does NOT restrict tenant types
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
      // This route explicitly allows ALL tenant types: company, supplier, service_provider, and guest
      // No requireTenantType check here - we accept any tenant type or guest
      let tenantId: string | null = null;
      let tenantType: 'company' | 'supplier' | 'service_provider' | 'guest' = 'guest';

      if (req.tenantType && req.tenantId) {
        tenantId = req.tenantId;
        // Explicitly allow all tenant types - company, supplier, service_provider
        if (['company', 'supplier', 'service_provider'].includes(req.tenantType)) {
          tenantType = req.tenantType as 'company' | 'supplier' | 'service_provider';
        } else {
          // If it's an unexpected type, default to guest
          tenantType = 'guest';
        }
      } else {
        // Guest access - no tenant ID
        tenantType = 'guest';
      }

      console.log('[AI-Quote] Request received - ALL tenant types allowed:', { 
        tenantType, 
        tenantId, 
        promptLength: prompt.length, 
        hasAuth: !!req.userId,
        reqTenantType: req.tenantType,
        path: req.path,
        method: req.method 
      });

      const result = await aiQuoteService.searchWithAI(prompt, tenantId, tenantType);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('[AI-Quote] Error:', error);
      next(error);
    }
  }
);

// GET /api/v1/quotes/rfq/public - Get all public RFQs (for suppliers to browse)
// IMPORTANT: This route must be BEFORE router.use(authenticate) to allow public access
router.get(
  '/quotes/rfq/public',
  optionalAuthenticate, // Allow suppliers, companies, and guests to view
  [
    query('status').optional().isIn(Object.values(QuoteStatus)).withMessage('Invalid status'),
    query('category').optional().isString().withMessage('Category must be a string'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const status = req.query.status as QuoteStatus | undefined;
      const category = req.query.category as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      // If user is a supplier, show their relevant RFQs
      if (req.tenantType === 'supplier' || req.tenantType === 'service_provider') {
        const result = await quoteService.getSupplierRFQs(req.tenantId!, {
          status,
          category,
          page,
          limit,
        });
        return res.json(result);
      }

      // Otherwise, show all public RFQs
      const result = await quoteService.getPublicRFQs({
        status,
        category,
        page,
        limit,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/quotes/rfq/upload-csv - Upload RFQs via CSV file (Company only)
// IMPORTANT: This route must be BEFORE router.use(authenticate) but after optional routes
router.post(
  '/quotes/rfq/upload-csv',
  authenticate, // Require authentication
  requireTenantType('company'),
  upload.single('csvFile'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          error: { 
            message: 'CSV file is required',
            statusCode: 400 
          } 
        });
      }

      // Parse CSV
      const parsed = parseRFQCSV(req.file.buffer);

      if (parsed.valid.length === 0) {
        return res.status(400).json({
          error: {
            message: 'No valid RFQ records found in CSV',
            statusCode: 400,
          },
          invalid: parsed.invalid,
        });
      }

      // Create RFQs
      const results = {
        created: [] as any[],
        failed: [] as Array<{ row: number; title: string; error: string }>,
      };

      for (const rfqData of parsed.valid) {
        try {
          const rfq = await quoteService.createGeneralRFQ(
            req.tenantId!,
            req.userId!,
            {
              title: rfqData.title,
              description: rfqData.description,
              category: rfqData.category,
              supplierId: rfqData.supplierId || null,
              quantity: rfqData.quantity,
              unit: rfqData.unit,
              requestedPrice: rfqData.requestedPrice,
              currency: rfqData.currency,
              expiresAt: rfqData.expiresAt ? new Date(rfqData.expiresAt) : undefined,
            }
          );

          results.created.push({
            id: rfq.id,
            title: rfqData.title,
          });
        } catch (error: any) {
          results.failed.push({
            row: parsed.valid.indexOf(rfqData) + 2, // +2 for header and 0-based index
            title: rfqData.title,
            error: error.message || 'Failed to create RFQ',
          });
        }
      }

      res.status(201).json({
        success: true,
        summary: {
          total: parsed.valid.length,
          created: results.created.length,
          failed: results.failed.length,
          invalid: parsed.invalid.length,
        },
        created: results.created,
        failed: results.failed,
        invalid: parsed.invalid,
      });
    } catch (error) {
      next(error);
    }
  }
);

// All other routes require authentication
router.use(authenticate);

// POST /api/v1/quotes/rfq - Create a general RFQ (Request for Quote) - Company only, open to all suppliers
router.post(
  '/quotes/rfq',
  requireTenantType('company'),
  [
    body('title').isString().trim().notEmpty().withMessage('RFQ title is required'),
    body('title').isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('category').optional().isString().withMessage('Category must be a string'),
    body('quantity').optional().isFloat({ min: 0 }).withMessage('Quantity must be positive'),
    body('unit').optional().isString().withMessage('Unit must be a string'),
    body('requestedPrice').optional().isFloat({ min: 0 }).withMessage('Requested price must be positive'),
    body('currency').optional().isString().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
    body('expiresAt').optional().isISO8601().withMessage('Invalid expiration date'),
    body('supplierId').optional().isUUID().withMessage('Invalid supplier ID'), // Optional - null means open to all
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const rfq = await quoteService.createGeneralRFQ(
        req.tenantId!,
        req.userId!,
        {
          title: req.body.title,
          description: req.body.description,
          category: req.body.category,
          supplierId: req.body.supplierId || null,
          quantity: req.body.quantity,
          unit: req.body.unit,
          requestedPrice: req.body.requestedPrice,
          currency: req.body.currency,
          expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
        }
      );

      res.status(201).json({ rfq });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/quotes - Create a new quote request (Company only) - Product-specific
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
    body('comment').optional().isString().withMessage('Comment must be a string'),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const quoteResponse = await quoteService.acceptQuoteResponse(
        req.body.quoteResponseId,
        req.tenantId!,
        req.body.comment
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

// POST /api/v1/quotes/:id/counter - Counter-negotiate a quote response (Company only)
router.post(
  '/quotes/:id/counter',
  requireTenantType('company'),
  [
    param('id').isUUID().withMessage('Invalid quote request ID'),
    body('quoteResponseId').isUUID().withMessage('Invalid quote response ID'),
    body('counterPrice').isFloat({ min: 0 }).withMessage('Counter price must be positive'),
    body('counterMessage').optional().isString().withMessage('Counter message must be a string'),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const counterResponse = await quoteService.counterNegotiateQuote(
        req.params.id,
        req.body.quoteResponseId,
        req.tenantId!,
        req.body.counterPrice,
        req.body.counterMessage
      );

      res.json({ counterResponse });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/quotes/:id/reject-response - Reject a specific quote response (Company only)
router.post(
  '/quotes/:id/reject-response',
  requireTenantType('company'),
  [
    param('id').isUUID().withMessage('Invalid quote request ID'),
    body('quoteResponseId').isUUID().withMessage('Invalid quote response ID'),
    body('comment').optional().isString().withMessage('Comment must be a string'),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await quoteService.rejectQuoteResponse(
        req.body.quoteResponseId,
        req.tenantId!,
        req.body.comment
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/quotes/:id/counter-rfq - Counter-negotiate an RFQ directly (Company only)
router.post(
  '/quotes/:id/counter-rfq',
  requireTenantType('company'),
  [
    param('id').isUUID().withMessage('Invalid quote request ID'),
    body('counterPrice').isFloat({ min: 0 }).withMessage('Counter price must be positive'),
    body('counterMessage').optional().isString().withMessage('Counter message must be a string'),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const counterResponse = await quoteService.counterNegotiateRFQ(
        req.params.id,
        req.tenantId!,
        req.body.counterPrice,
        req.body.counterMessage
      );

      res.json({ counterResponse });
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

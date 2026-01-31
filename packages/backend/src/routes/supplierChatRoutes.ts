/**
 * Supplier Chat Routes for MVP 1
 * Natural language interface for suppliers to update prices
 */

import { Router, Request, Response, NextFunction } from 'express';
import { processSupplierCommand } from '../services/supplierAIService';
import { requireAuth } from '../middleware/authMiddleware';
import { requireSupplier } from '../middleware/permissionsMiddleware';

const router = Router();

/**
 * POST /api/v1/supplier/chat
 * Process supplier command (price updates, product management)
 * Requires: Supplier user type
 */
router.post(
  '/supplier/chat',
  requireAuth,
  requireSupplier,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { command } = req.body;
      const userId = (req as any).user?.id;
      const organizationId = (req as any).user?.organizationId;

      if (!command || typeof command !== 'string' || command.trim().length === 0) {
        return res.status(400).json({
          error: 'Command is required and must be a non-empty string',
        });
      }

      if (!organizationId) {
        return res.status(400).json({
          error: 'Organization ID not found',
        });
      }

      // Process command with AI
      const result = await processSupplierCommand(command.trim(), organizationId);

      res.json({
        answer: result.answer,
        action: result.action,
        command: command.trim(),
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Supplier chat error:', error);
      console.error('Supplier chat error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
      });
      
      // Return more detailed error for debugging
      res.status(500).json({
        error: {
          message: error.message || 'Internal Server Error',
          statusCode: 500,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      });
    }
  }
);

export default router;

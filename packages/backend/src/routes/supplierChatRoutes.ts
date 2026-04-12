/**
 * Supplier Chat Routes for MVP 1
 * Natural language interface for suppliers to update prices
 */

import { Router, Response, NextFunction } from 'express';
import { processSupplierCommand } from '../services/supplierAIService';
import { processSupplierCommandEnhanced } from '../services/supplierAIServiceEnhanced';
import { requireAuth, type AuthRequest } from '../middleware/authMiddleware';
import { requireSupplier } from '../middleware/permissionsMiddleware';
import { prisma } from '../utils/prisma';

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
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { command } = req.body;
      const userId = req.userId;
      const organizationId = req.organizationId;

      if (!command || typeof command !== 'string' || command.trim().length === 0) {
        return res.status(400).json({
          error: {
            message: 'Command is required and must be a non-empty string',
            statusCode: 400,
          },
        });
      }

      if (!organizationId) {
        return res.status(400).json({
          error: {
            message: 'Organization ID not found',
            statusCode: 400,
          },
        });
      }

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, type: true, name: true },
      });

      if (!organization) {
        return res.status(400).json({
          error: {
            message: 'Your supplier organization was not found. Please contact support.',
            statusCode: 400,
          },
        });
      }

      if (organization.type !== 'supplier') {
        return res.status(400).json({
          error: {
            message: `This endpoint requires a supplier organization. Please contact support.`,
            statusCode: 400,
          },
        });
      }

      const useEnhancedAI = process.env.USE_ENHANCED_AI === 'true';
      const startTime = Date.now();

      const result = useEnhancedAI
        ? await processSupplierCommandEnhanced(command.trim(), organization.id, userId)
        : await processSupplierCommand(command.trim(), organization.id, userId);

      console.log('[supplierChatRoutes] Command processed in', Date.now() - startTime, 'ms');

      res.json({
        answer: result.answer,
        action: result.action,
        command: command.trim(),
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Supplier chat error:', error.message);
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

/**
 * Supplier Chat Routes for MVP 1
 * Natural language interface for suppliers to update prices
 */

import { Router, Request, Response, NextFunction } from 'express';
import { processSupplierCommand } from '../services/supplierAIService';
import { processSupplierCommandEnhanced } from '../services/supplierAIServiceEnhanced';
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

      // Verify organization exists and is of type 'supplier'
      const { prisma } = await import('../utils/prisma');
      
      console.log('[supplierChatRoutes] Validating organization:', {
        organizationId,
        userId,
      });
      
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, type: true, name: true },
      });

      console.log('[supplierChatRoutes] Organization lookup result:', organization);

      if (!organization) {
        console.error('[supplierChatRoutes] Organization not found:', organizationId);
        return res.status(400).json({
          error: {
            message: `Your supplier organization (ID: ${organizationId}) was not found in the database. Please contact support.`,
            statusCode: 400,
          },
        });
      }

      if (organization.type !== 'supplier') {
        console.error('[supplierChatRoutes] Organization type mismatch:', organization.type);
        return res.status(400).json({
          error: {
            message: `Your organization "${organization.name}" is of type "${organization.type}", but this endpoint requires a supplier organization. Please contact support.`,
            statusCode: 400,
          },
        });
      }

      // Process command with AI - use the verified organization ID
      // Use enhanced AI service if enabled via environment variable
      const useEnhancedAI = process.env.USE_ENHANCED_AI === 'true';
      const startTime = Date.now();
      console.log('[supplierChatRoutes] Processing command with verified organizationId:', organization.id, 'Enhanced AI:', useEnhancedAI);
      
      const result = useEnhancedAI
        ? await processSupplierCommandEnhanced(command.trim(), organization.id, userId)
        : await processSupplierCommand(command.trim(), organization.id, userId);

      const processingTime = Date.now() - startTime;
      console.log('[supplierChatRoutes] Command processed in', processingTime, 'ms');

      // Send response immediately after processing
      const response = {
        answer: result.answer,
        action: result.action,
        command: command.trim(),
        timestamp: new Date().toISOString(),
      };
      
      console.log('[supplierChatRoutes] Sending response');
      res.json(response);
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

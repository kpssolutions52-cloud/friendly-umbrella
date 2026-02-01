/**
 * Chat Routes for AI QS Assistant
 */

import { Router, Request, Response, NextFunction } from 'express';
import { processQSQuestion } from '../services/aiService';
import { requireAuth } from '../middleware/authMiddleware';
import { requireQS } from '../middleware/permissionsMiddleware';

const router = Router();

/**
 * POST /api/v1/chat
 * Send a question to the AI assistant
 * Requires: QS user type
 */
router.post(
  '/chat',
  requireAuth,
  requireQS,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, allowGenericAnswers } = req.body;

      if (!question || typeof question !== 'string' || question.trim().length === 0) {
        return res.status(400).json({
          error: 'Question is required and must be a non-empty string',
        });
      }

      // Process question with AI and supplier data
      const response = await processQSQuestion(
        question.trim(),
        allowGenericAnswers === true || allowGenericAnswers === 'true'
      );

      res.json({
        answer: response.answer,
        requiresPermission: response.requiresPermission || false,
        hasSystemData: response.hasSystemData || false,
        systemDataSummary: response.systemDataSummary,
        question: question.trim(),
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Chat error:', error);
      console.error('Chat error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
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

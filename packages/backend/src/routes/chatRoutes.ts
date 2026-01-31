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
      const { question } = req.body;

      if (!question || typeof question !== 'string' || question.trim().length === 0) {
        return res.status(400).json({
          error: 'Question is required and must be a non-empty string',
        });
      }

      // Process question with AI and supplier data
      const answer = await processQSQuestion(question.trim());

      res.json({
        answer,
        question: question.trim(),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Chat error:', error);
      next(error);
    }
  }
);

export default router;

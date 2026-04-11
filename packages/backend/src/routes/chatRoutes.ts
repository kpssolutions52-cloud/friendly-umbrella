/**
 * Chat Routes for AI QS Assistant
 */

import { Router, Response, NextFunction } from 'express';
import { processQSQuestion } from '../services/aiService';
import { requireAuth, type AuthRequest } from '../middleware/authMiddleware';
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
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { question, allowGenericAnswers, allowWebSearch, conversationHistory } = req.body;

      if (!question || typeof question !== 'string' || question.trim().length === 0) {
        return res.status(400).json({
          error: 'Question is required and must be a non-empty string',
        });
      }

      // Validate conversation history format if provided
      let history: Array<{ role: 'user' | 'assistant'; content: string }> | undefined;
      if (conversationHistory) {
        if (Array.isArray(conversationHistory)) {
          history = conversationHistory.filter((msg: any) => 
            msg && 
            typeof msg === 'object' && 
            (msg.role === 'user' || msg.role === 'assistant') &&
            typeof msg.content === 'string'
          ).map((msg: any) => ({
            role: msg.role,
            content: msg.content,
          }));
        }
      }

      // Hub = Excel → DB; optional Google Custom Search when hub data is insufficient
      const genericAllowed =
        allowGenericAnswers !== false && allowGenericAnswers !== 'false';
      const webAllowed =
        genericAllowed &&
        allowWebSearch !== false &&
        allowWebSearch !== 'false';
      const response = await processQSQuestion(
        question.trim(),
        genericAllowed,
        history,
        req.organizationId ?? null,
        webAllowed
      );

      res.json({
        answer: response.answer,
        requiresPermission: response.requiresPermission || false,
        hasSystemData: response.hasSystemData || false,
        systemDataSummary: response.systemDataSummary,
        usedWebSearch: response.usedWebSearch || false,
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

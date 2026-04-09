/**
 * Webhook Routes
 * Handles inbound messages from Twilio (WhatsApp) and email providers.
 */

import { Router, Request, Response } from 'express';
import { recordInboundReply } from '../services/procurementOrchestrator';
import {
  validateTwilioSignature,
  extractPhoneFromTwilioFrom,
  type TwilioInboundMessage,
} from '../services/whatsappService';
import { prisma } from '../utils/prisma';

const router = Router();

/**
 * POST /api/v1/webhooks/twilio/whatsapp
 * Twilio sends inbound WhatsApp messages here.
 * Configure this URL in your Twilio console under WhatsApp sandbox settings.
 */
router.post('/webhooks/twilio/whatsapp', async (req: Request, res: Response) => {
  try {
    // Validate Twilio signature in production
    if (process.env.NODE_ENV === 'production') {
      const signature = req.headers['x-twilio-signature'] as string;
      const url = `${process.env.APP_URL || ''}/api/v1/webhooks/twilio/whatsapp`;
      const isValid = validateTwilioSignature(signature, url, req.body);
      if (!isValid) {
        return res.status(403).send('Invalid signature');
      }
    }

    const body = req.body as TwilioInboundMessage;
    const fromPhone = extractPhoneFromTwilioFrom(body.From || '');
    const messageText = body.Body || '';

    if (!messageText.trim()) {
      return res.status(200).send('<Response></Response>');
    }

    // Find the most recent outbound RFQ communication to this phone number
    const outboundComm = await prisma.rfqCommunication.findFirst({
      where: {
        channel: 'whatsapp',
        direction: 'outbound',
        toAddress: { contains: fromPhone.replace('+', '').slice(-8) },
      },
      orderBy: { sentAt: 'desc' },
    });

    if (outboundComm) {
      await recordInboundReply({
        procurementRequestId: outboundComm.procurementRequestId,
        supplierCandidateId: outboundComm.supplierCandidateId,
        channel: 'whatsapp',
        fromAddress: fromPhone,
        body: messageText,
        externalMessageId: body.MessageSid,
      });
    } else {
      console.warn('[WebhookRoutes] No matching outbound WhatsApp RFQ found for:', fromPhone);
    }

    // Twilio expects TwiML response
    return res.status(200).type('text/xml').send('<Response></Response>');
  } catch (err: any) {
    console.error('[WebhookRoutes] Twilio webhook error:', err);
    return res.status(500).type('text/xml').send('<Response></Response>');
  }
});

/**
 * POST /api/v1/webhooks/email/inbound
 * Generic inbound email webhook (compatible with SendGrid Inbound Parse,
 * Mailgun routes, or Postmark inbound).
 * Body should contain: from, subject, text (plain body), messageId
 */
router.post('/webhooks/email/inbound', async (req: Request, res: Response) => {
  try {
    const { from, subject, text, messageId } = req.body as {
      from?: string;
      subject?: string;
      text?: string;
      messageId?: string;
    };

    if (!from || !text) {
      return res.status(400).json({ error: 'from and text are required' });
    }

    // Extract email address from "Name <email>" format
    const emailMatch = from.match(/<([^>]+)>/) || [null, from];
    const fromEmail = emailMatch[1]?.trim() ?? from.trim();

    // Find the most recent outbound RFQ email to this address
    const outboundComm = await prisma.rfqCommunication.findFirst({
      where: {
        channel: 'email',
        direction: 'outbound',
        toAddress: { equals: fromEmail, mode: 'insensitive' },
      },
      orderBy: { sentAt: 'desc' },
    });

    if (outboundComm) {
      await recordInboundReply({
        procurementRequestId: outboundComm.procurementRequestId,
        supplierCandidateId: outboundComm.supplierCandidateId,
        channel: 'email',
        fromAddress: fromEmail,
        body: text,
        externalMessageId: messageId,
      });
    } else {
      console.warn('[WebhookRoutes] No matching outbound email RFQ found for:', fromEmail);
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('[WebhookRoutes] Email webhook error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

export default router;

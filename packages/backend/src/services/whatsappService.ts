/**
 * WhatsApp Service
 * Sends RFQ messages via Twilio WhatsApp Business API.
 * Handles inbound replies via Twilio webhook.
 */

import twilio from 'twilio';

export interface WhatsAppSendResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

export interface TwilioInboundMessage {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia?: string;
  MediaUrl0?: string;
}

function createClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.warn('[WhatsAppService] Twilio not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
    return null;
  }

  return twilio(accountSid, authToken);
}

function normalizeWhatsAppNumber(phone: string): string {
  // Strip non-numeric except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    // Default to Singapore country code if no prefix
    if (cleaned.startsWith('65')) cleaned = '+' + cleaned;
    else cleaned = '+65' + cleaned;
  }
  return `whatsapp:${cleaned}`;
}

export async function sendWhatsAppRfq(params: {
  to: string;
  body: string;
}): Promise<WhatsAppSendResult> {
  const client = createClient();
  if (!client) {
    return {
      success: false,
      error: 'WhatsApp service not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.',
    };
  }

  const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
  const to = normalizeWhatsAppNumber(params.to);

  try {
    const message = await client.messages.create({
      from,
      to,
      body: params.body,
    });

    return { success: true, messageSid: message.sid };
  } catch (err: any) {
    console.error('[WhatsAppService] Send failed:', err.message);
    return { success: false, error: err.message };
  }
}

export async function sendBulkWhatsAppRfq(
  recipients: Array<{ phone: string; supplierName: string }>,
  body: string
): Promise<Array<{ phone: string; supplierName: string; result: WhatsAppSendResult }>> {
  const results = await Promise.allSettled(
    recipients.map((r) =>
      sendWhatsAppRfq({
        to: r.phone,
        body: personalizeBody(body, r.supplierName),
      })
    )
  );

  return recipients.map((r, i) => {
    const settled = results[i];
    return {
      phone: r.phone,
      supplierName: r.supplierName,
      result:
        settled.status === 'fulfilled'
          ? settled.value
          : { success: false, error: (settled as PromiseRejectedResult).reason?.message },
    };
  });
}

function personalizeBody(body: string, supplierName: string): string {
  return body.replace(/^Hi,/, `Hi ${supplierName},`);
}

/**
 * Validate that an inbound Twilio webhook request is authentic.
 * Returns true if the signature is valid (or if validation is disabled in dev).
 */
export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return true; // Skip validation if not configured

  try {
    return twilio.validateRequest(authToken, signature, url, params);
  } catch {
    return false;
  }
}

/**
 * Extract the normalized phone number from a Twilio "From" field.
 * e.g. "whatsapp:+6591234567" → "+6591234567"
 */
export function extractPhoneFromTwilioFrom(from: string): string {
  return from.replace(/^whatsapp:/, '');
}

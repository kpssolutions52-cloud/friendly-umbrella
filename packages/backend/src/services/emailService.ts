/**
 * Email Service
 * Sends RFQ emails via Nodemailer (SMTP / Gmail OAuth2).
 * Supports inbound reply parsing via a webhook endpoint.
 */

import nodemailer from 'nodemailer';

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('[EmailService] SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
}

export async function sendRfqEmail(params: {
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
}): Promise<EmailSendResult> {
  const transporter = createTransporter();

  if (!transporter) {
    return {
      success: false,
      error: 'Email service not configured. Please set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables.',
    };
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@constructionguru.com';

  try {
    const info = await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      text: params.body,
      html: bodyToHtml(params.body),
      replyTo: params.replyTo || from,
    });

    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error('[EmailService] Send failed:', err.message);
    return { success: false, error: err.message };
  }
}

export async function sendBulkRfqEmails(
  recipients: Array<{ to: string; supplierName: string }>,
  subject: string,
  body: string,
  replyTo?: string
): Promise<Array<{ to: string; supplierName: string; result: EmailSendResult }>> {
  const results = await Promise.allSettled(
    recipients.map((r) =>
      sendRfqEmail({ to: r.to, subject, body: personalizeBody(body, r.supplierName), replyTo })
    )
  );

  return recipients.map((r, i) => {
    const settled = results[i];
    return {
      to: r.to,
      supplierName: r.supplierName,
      result:
        settled.status === 'fulfilled'
          ? settled.value
          : { success: false, error: (settled as PromiseRejectedResult).reason?.message },
    };
  });
}

function personalizeBody(body: string, supplierName: string): string {
  return body.replace(/Dear Sir\/Madam/g, `Dear ${supplierName} Team`);
}

function bodyToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const paragraphs = escaped
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n');
  return `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; font-size: 14px; color: #333; max-width: 680px; margin: 0 auto; padding: 20px;">
${paragraphs}
</body>
</html>`;
}

export async function verifyEmailConfig(): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) return false;
  try {
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}

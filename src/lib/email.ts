/**
 * Resend Email Client
 *
 * Transactional email gönderimi için Resend SDK singleton.
 * RESEND_API_KEY tanımlı değilse mock mode'da çalışır (sadece console.log).
 */

import { Resend } from 'resend';
import { logger } from './logger';

if (!process.env.RESEND_API_KEY) {
  logger.warn('[Email] RESEND_API_KEY not configured — emails will be logged to console');
}

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

const DEFAULT_FROM = process.env.EMAIL_FROM ?? 'noreply@noktanyus.com';

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (!resend) {
    logger.info('[Email Mock]', { to: params.to, subject: params.subject });
    return { success: true, messageId: 'mock-' + Date.now() };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo,
    });

    if (error) {
      logger.error('[Email] Send failed', { error: error.message });
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown';
    logger.error('[Email] Unexpected error', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}
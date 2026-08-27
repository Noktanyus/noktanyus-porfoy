/**
 * Newsletter Module — Service Layer
 *
 * Business logic: subscribe/verify/unsubscribe, broadcast, stats.
 */

import { newsletterRepository } from './repository';
import { SubscribeSchema, type SubscribeInput, type BroadcastInput } from './schemas';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email';
import { NotFoundError, ConflictError } from '@/modules/shared/errors';

export const newsletterService = {
  /**
   * Email abone olma. Double opt-in: önce subscriber oluşturulur,
   * doğrulama email'i gönderilir. verify endpoint'i ile active=true yapılır.
   */
  async subscribe(input: SubscribeInput) {
    // Zod validation — caller-supplied input'u doğrula
    const validated = SubscribeSchema.parse(input);
    const email = validated.email.toLowerCase().trim();
    const existing = await newsletterRepository.findByEmail(email);

    // Zaten doğrulanmış ve aktif
    if (existing && existing.verifiedAt && existing.active && !existing.unsubscribedAt) {
      return { success: true, alreadySubscribed: true };
    }

    // Daha önce abone olmuş ama unsubscribe etmiş — re-subscribe
    if (existing && existing.verifiedAt && existing.unsubscribedAt) {
      const sub = await newsletterRepository.update(existing.id, {
        active: true,
        unsubscribedAt: null,
        categories: (validated.categories ?? existing.categories) as any,
      });
      logger.info('Newsletter re-subscribe', { email });
      return { success: true, subscriber: sub, alreadySubscribed: true };
    }

    // Yeni abone — doğrulama token üret ve email gönder
    const verifyToken = newsletterRepository.generateVerifyToken();
    const unsubscribeToken = newsletterRepository.generateUnsubscribeToken();

    let subscriber;
    try {
      subscriber = await newsletterRepository.create({
        email,
        name: validated.name,
        categories: (validated.categories ?? []) as any,
        verifyToken,
        unsubscribeToken,
        source: validated.source,
      });
    } catch (err) {
      // Unique constraint (email) — handle gracefully
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        throw new ConflictError('Bu e-posta zaten kayıtlı');
      }
      throw err;
    }

    // Doğrulama email'i gönder (hata olsa bile subscriber oluştu)
    try {
      const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
      const verifyUrl = `${baseUrl}/api/newsletter/verify?token=${verifyToken}`;
      await sendEmail({
        to: email,
        subject: 'Noktanyus Blog - Abonelik Onayı',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0078D4;">Aboneliğinizi Onaylayın</h2>
            <p>${validated.name ? `Merhaba ${validated.name},` : 'Merhaba,'} Noktanyus blog'una abone olduğunuz için teşekkürler!</p>
            <p>Aboneliğinizi onaylamak için aşağıdaki butona tıklayın:</p>
            <p style="margin: 24px 0;">
              <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#0078D4;color:white;border-radius:6px;text-decoration:none;font-weight:600;">Aboneliği Onayla</a>
            </p>
            <p style="font-size: 13px; color: #666;">Bu email'i beklemediyseniz dikkate almayın.</p>
          </div>
        `,
      });
    } catch (err) {
      logger.error('Newsletter verification email failed', {
        email,
        error: err instanceof Error ? err.message : 'unknown',
      });
      // Subscriber yine de oluşturuldu; admin manuel doğrulama yapabilir
    }

    logger.info('Newsletter subscribe', { email });
    return { success: true, subscriber };
  },

  /**
   * Verification token ile subscriber'ı doğrula.
   */
  async verify(token: string) {
    const sub = await newsletterRepository.findByVerifyToken(token);
    if (!sub) throw new NotFoundError('Doğrulama token');

    if (sub.verifiedAt) {
      return sub; // zaten doğrulanmış
    }

    const updated = await newsletterRepository.update(sub.id, {
      verifiedAt: new Date(),
      verifyToken: null,
      active: true,
    });

    logger.info('Newsletter verified', { email: sub.email });
    return updated;
  },

  /**
   * Unsubscribe token ile aboneliği iptal et.
   */
  async unsubscribe(token: string) {
    const sub = await newsletterRepository.findByUnsubscribeToken(token);
    if (!sub) throw new NotFoundError('Abonelik iptal token');

    const updated = await newsletterRepository.update(sub.id, {
      active: false,
      unsubscribedAt: new Date(),
    });

    logger.info('Newsletter unsubscribed', { email: sub.email });
    return updated;
  },

  /**
   * Doğrulanmış + aktif tüm abonelere broadcast email gönder.
   * Seri gönderim — büyük listeler için queue/job sistemi önerilir.
   */
  async sendBroadcast(opts: BroadcastInput) {
    const subscribers = await newsletterRepository.findVerifiedActive();

    let sent = 0;
    let failed = 0;

    for (const sub of subscribers) {
      try {
        const result = await sendEmail({
          to: sub.email,
          subject: opts.subject,
          html: opts.html,
          text: opts.text,
        });

        if (result.success) {
          sent++;
        } else {
          failed++;
          logger.error('Broadcast email returned failure', {
            email: sub.email,
            error: result.error ?? 'unknown',
          });
        }
      } catch (err) {
        failed++;
        logger.error('Broadcast email threw exception', {
          email: sub.email,
          error: err instanceof Error ? err.message : 'unknown',
        });
      }
    }

    logger.info('Newsletter broadcast complete', { sent, failed, total: subscribers.length });
    return { sent, failed, total: subscribers.length };
  },

  /**
   * Admin dashboard istatistikleri.
   */
  async getStats() {
    return newsletterRepository.getStats();
  },

  /**
   * Admin liste — son N abone.
   */
  async listSubscribers(limit = 50) {
    return newsletterRepository.listAll({ limit });
  },
};
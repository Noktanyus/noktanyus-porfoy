/**
 * Email Service — Yüksek seviye email gönderim wrapper'ı
 *
 * React Email şablonlarını render eder ve Resend üzerinden gönderir.
 * RESEND_API_KEY tanımlı değilse console'a loglanır (mock mode).
 */

import { sendEmail, isEmailConfigured } from './email';
import { render } from '@react-email/components';
import ReceiptEmail from '@/emails/ReceiptEmail';
import WelcomeEmail from '@/emails/WelcomeEmail';
import ContactNotificationEmail from '@/emails/ContactNotificationEmail';
import { logger } from './logger';

interface ReceiptData {
  customerName?: string;
  customerEmail: string;
  orderNumber: string;
  items: Array<{ title: string; quantity: number; priceCents: number }>;
  totalCents: number;
  currency: string;
  licenses?: Array<{ key: string; productTitle: string }>;
}

interface WelcomeData {
  name?: string;
  customerEmail: string;
}

interface ContactData {
  fromName: string;
  fromEmail: string;
  subject: string;
  message: string;
}

function getBaseUrl(): string {
  return process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
}

export const emailService = {
  /**
   * Sipariş onayı / receipt email'i müşteriye gönderir.
   * Varsa lisans anahtarlarını dahil eder.
   */
  async sendReceipt(data: ReceiptData) {
    try {
      const html = await render(
        ReceiptEmail({
          ...data,
          dashboardUrl: `${getBaseUrl()}/dashboard`,
        })
      );

      return sendEmail({
        to: data.customerEmail,
        subject: `Sipariş Onayı - ${data.orderNumber}`,
        html,
      });
    } catch (err) {
      logger.error('Receipt email send failed', { error: err });
      return { success: false, error: 'Email gönderilemedi' };
    }
  },

  /**
   * Hoş geldiniz email'i yeni müşteriye gönderir.
   */
  async sendWelcome(data: WelcomeData) {
    try {
      const html = await render(
        WelcomeEmail({
          name: data.name,
          loginUrl: `${getBaseUrl()}/giris`,
        })
      );

      return sendEmail({
        to: data.customerEmail,
        subject: 'Hoş Geldiniz!',
        html,
      });
    } catch (err) {
      logger.error('Welcome email send failed', { error: err });
      return { success: false, error: 'Email gönderilemedi' };
    }
  },

  /**
   * Yeni contact form mesajı için admin'e bildirim email'i gönderir.
   */
  async sendContactNotification(data: ContactData) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      logger.warn('ADMIN_EMAIL not configured, skipping contact notification');
      return { success: false, error: 'Admin email not configured' };
    }

    try {
      const html = await render(
        ContactNotificationEmail({
          ...data,
          adminUrl: `${getBaseUrl()}/admin/messages`,
        })
      );

      return sendEmail({
        to: adminEmail,
        subject: `[Yeni Mesaj] ${data.subject}`,
        html,
        replyTo: data.fromEmail,
      });
    } catch (err) {
      logger.error('Contact notification email failed', { error: err });
      return { success: false, error: 'Email gönderilemedi' };
    }
  },
};

export { isEmailConfigured };
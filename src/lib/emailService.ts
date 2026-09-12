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
import TemplatePurchaseEmail, {
  type TemplatePurchaseEmailProps,
} from './templates/TemplatePurchaseEmail';
import TemplateInstallReadyEmail, {
  type TemplateInstallReadyEmailProps,
} from './templates/TemplateInstallReadyEmail';
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

/**
 * Phase 3 B.4 — Template satin alma basarili email inputu.
 * emailService.sendTemplatePurchase() tarafindan kullanilir.
 */
export type TemplatePurchaseInput = TemplatePurchaseEmailProps;

/**
 * Phase 3 B.4 — Template deploy tamamlandi email inputu.
 * emailService.sendTemplateInstallReady() tarafindan kullanilir.
 */
export type TemplateInstallReadyInput = TemplateInstallReadyEmailProps;

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

  /**
   * Phase 3 B.4 — Gumroad / Lemon Squeezy / Stripe webhook'u basariyla
   * islenip TemplateLicense olusturulduktan sonra aliciya gonderilir.
   * License key + install URL + dashboard URL icerir.
   */
  async sendTemplatePurchase(data: TemplatePurchaseInput) {
    try {
      const html = await render(TemplatePurchaseEmail(data));
      return sendEmail({
        to: data.buyerEmail,
        subject: 'Template satın alımınız başarılı',
        html,
      });
    } catch (err) {
      logger.error('Template purchase email send failed', {
        error: err,
        buyerEmail: data.buyerEmail,
        templateSlug: data.templateSlug,
      });
      return { success: false, error: 'Email gönderilemedi' };
    }
  },

  /**
   * Phase 3 B.4 — Worker template kurulumunu tamamladiginda aliciya gonderilir.
   * Deployment URL + admin login URL + sonraki adimlar.
   */
  async sendTemplateInstallReady(data: TemplateInstallReadyInput) {
    try {
      const html = await render(TemplateInstallReadyEmail(data));
      return sendEmail({
        to: data.buyerEmail,
        subject: 'Template deploy tamamlandı',
        html,
      });
    } catch (err) {
      logger.error('Template install-ready email send failed', {
        error: err,
        buyerEmail: data.buyerEmail,
        templateSlug: data.templateSlug,
      });
      return { success: false, error: 'Email gönderilemedi' };
    }
  },
};

export { isEmailConfigured };

/**
 * Re-export — onboarding/service.ts gibi dogrudan sendEmail kullanan
 * eski/modul API'leri icin backward-compat saglar. Yeni kod emailService
 * objesinin metodlarini kullanmali.
 */
export { sendEmail };
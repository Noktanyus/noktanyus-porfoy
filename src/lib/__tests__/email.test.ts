/**
 * @file Email Service unit tests
 * @description Resend client wrapper ve email service testleri.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Logger'ı mockla — testlerde Sentry'ye gitmesin
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Resend'i mockla — gerçek API çağrısı yapmasın
const sendMock = vi.fn();
vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: { send: sendMock },
  })),
}));

// @react-email/components'i mockla — render basit string dönsün
vi.mock('@react-email/components', () => ({
  render: vi.fn(async (element: unknown) => `<html>${JSON.stringify(element)}</html>`),
}));

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('isEmailConfigured', () => {
    it('RESEND_API_KEY yoksa false döner', async () => {
      delete process.env.RESEND_API_KEY;
      const { isEmailConfigured } = await import('../email');
      expect(isEmailConfigured()).toBe(false);
    });

    it('RESEND_API_KEY varsa true döner', async () => {
      process.env.RESEND_API_KEY = 're_test_key';
      const { isEmailConfigured } = await import('../email');
      expect(isEmailConfigured()).toBe(true);
    });
  });

  describe('sendEmail (mock mode)', () => {
    it('API key yoksa mock mode\'da success döner', async () => {
      delete process.env.RESEND_API_KEY;
      const { sendEmail } = await import('../email');

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^mock-/);
    });
  });

  describe('sendEmail (real mode)', () => {
    it('API key varsa Resend.send çağrılır', async () => {
      process.env.RESEND_API_KEY = 're_test_key';
      sendMock.mockResolvedValue({ data: { id: 'msg-123' }, error: null });

      const { sendEmail } = await import('../email');

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
    });

    it('Resend error dönerse failure döner', async () => {
      process.env.RESEND_API_KEY = 're_test_key';
      sendMock.mockResolvedValue({
        data: null,
        error: { message: 'Rate limit' },
      });

      const { sendEmail } = await import('../email');

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit');
    });

    it('Send exception fırlatırsa error yakalanır', async () => {
      process.env.RESEND_API_KEY = 're_test_key';
      sendMock.mockRejectedValue(new Error('Network error'));

      const { sendEmail } = await import('../email');

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('emailService.sendContactNotification', () => {
    it('ADMIN_EMAIL yoksa skip eder', async () => {
      delete process.env.ADMIN_EMAIL;
      const { emailService } = await import('../emailService');

      const result = await emailService.sendContactNotification({
        fromName: 'Test',
        fromEmail: 't@e.com',
        subject: 'S',
        message: 'M',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Admin email');
    });
  });
});
import { describe, it, expect } from 'vitest';
import { ContactFormSchema, RepliesSchema } from '../message';

describe('Message Schema', () => {
  describe('ContactFormSchema', () => {
    it('valid contact form', () => {
      const valid = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test',
        message: 'This is a test message',
        turnstileToken: 'token123',
      };
      expect(ContactFormSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects invalid email', () => {
      const invalid = {
        name: 'John',
        email: 'not-an-email',
        subject: 'Test',
        message: 'This is a test message',
        turnstileToken: 'token',
      };
      expect(ContactFormSchema.safeParse(invalid).success).toBe(false);
    });

    it('rejects short name', () => {
      const invalid = {
        name: 'J',
        email: 'j@e.com',
        subject: 'Test',
        message: 'This is a test message',
        turnstileToken: 'token',
      };
      expect(ContactFormSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('RepliesSchema', () => {
    it('valid replies', () => {
      const replies = [{
        message: 'Thank you',
        sentAt: new Date(),
        sentBy: 'admin',
      }];
      expect(RepliesSchema.safeParse(replies).success).toBe(true);
    });

    it('coerces string date', () => {
      const replies = [{
        message: 'Thank you',
        sentAt: '2024-01-01T00:00:00Z',
        sentBy: 'admin',
      }];
      const result = RepliesSchema.safeParse(replies);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0].sentAt).toBeInstanceOf(Date);
      }
    });
  });
});
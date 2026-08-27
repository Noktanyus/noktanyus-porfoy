import { describe, it, expect } from 'vitest';
import { PopupCreateSchema, ButtonsSchema, PopupButtonSchema } from '../popup';

describe('Popup Schema', () => {
  describe('PopupButtonSchema', () => {
    it('valid button', () => {
      expect(PopupButtonSchema.safeParse({ label: 'OK', url: 'https://example.com' }).success).toBe(true);
    });
    it('rejects invalid URL', () => {
      expect(PopupButtonSchema.safeParse({ label: 'OK', url: 'not-a-url' }).success).toBe(false);
    });
    it('default style is primary', () => {
      const parsed = PopupButtonSchema.parse({ label: 'OK', url: 'https://example.com' });
      expect(parsed.style).toBe('primary');
    });
  });

  describe('ButtonsSchema', () => {
    it('max 5 buttons', () => {
      const buttons = Array(6).fill({ label: 'X', url: 'https://example.com' });
      expect(ButtonsSchema.safeParse(buttons).success).toBe(false);
    });
  });

  describe('PopupCreateSchema', () => {
    const valid = {
      slug: 'test-popup',
      title: 'Test Popup',
      content: 'This is a popup content',
    };

    it('valid popup', () => {
      expect(PopupCreateSchema.safeParse(valid).success).toBe(true);
    });
  });
});
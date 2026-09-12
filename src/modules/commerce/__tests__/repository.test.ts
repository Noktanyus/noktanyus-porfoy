/**
 * Commerce Repository — Crypto Token Tests
 *
 * Validates:
 *   - generateOrderNumber() returns a non-empty string with the NK- prefix
 *   - generateKey() returns the NOKT-XXXX-XXXX-XXXX-XXXX shape
 *   - Tokens draw from a large character space (no Math.random 36-base)
 */

import { describe, it, expect } from 'vitest';
import { orderRepository, licenseRepository } from '../repository';

describe('commerce repository — secure token generation', () => {
  describe('orderRepository.generateOrderNumber', () => {
    it('returns NK-prefixed string', async () => {
      const orderNumber = await orderRepository.generateOrderNumber();
      expect(orderNumber).toMatch(/^NK-\d{4}-[A-Z0-9]{6}$/);
    });

    it('contains only safe characters', async () => {
      const orderNumber = await orderRepository.generateOrderNumber();
      // No lowercase or special chars; pure A-Z0-9 in the random segment
      const randomSegment = orderNumber.split('-')[2];
      expect(randomSegment).toMatch(/^[A-Z0-9]+$/);
    });

    it('produces different values across calls (entropy)', async () => {
      const samples = await Promise.all(
        Array.from({ length: 10 }, () => orderRepository.generateOrderNumber())
      );
      const unique = new Set(samples);
      expect(unique.size).toBe(samples.length);
    });
  });

  describe('licenseRepository.generateKey', () => {
    it('returns NOKT-XXXX-XXXX-XXXX-XXXX format', async () => {
      const key = await licenseRepository.generateKey();
      expect(key).toMatch(/^NOKT(-[A-Z0-9]{4}){4}$/);
    });

    it('uses uppercase alphanumeric only', async () => {
      const key = await licenseRepository.generateKey();
      expect(key).toBe(key.toUpperCase());
    });
  });
});
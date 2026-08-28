/**
 * Sandbox utility unit tests
 *
 * Covers isSandboxMode detection paths, getApiKeyMode prefix parsing,
 * and requireSandbox's throw behaviour.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isSandboxMode,
  getApiKeyMode,
  requireSandbox,
} from '../sandbox';

const originalEnv = { ...process.env };

// NODE_ENV is typed as read-only in @types/node; use a local helper that
// bypasses the readonly check for tests that need to swap it.
function setEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    (process.env as Record<string, string>)[key] = value;
  }
}

describe('Sandbox Utilities', () => {
  beforeEach(() => {
    // Reset to a known baseline before each test
    setEnv('SANDBOX_MODE', undefined);
    setEnv('STRIPE_SECRET_KEY', undefined);
    setEnv('IYZICO_URI', undefined);
    setEnv('NODE_ENV', 'test');
  });

  afterEach(() => {
    // Restore by reassigning the captured snapshot
    process.env = { ...originalEnv };
  });

  describe('isSandboxMode', () => {
    it('returns true when SANDBOX_MODE=true', () => {
      setEnv('SANDBOX_MODE', 'true');
      expect(isSandboxMode()).toBe(true);
    });

    it('returns false when SANDBOX_MODE=false and no heuristic signal', () => {
      setEnv('SANDBOX_MODE', 'false');
      setEnv('NODE_ENV', 'production');
      expect(isSandboxMode()).toBe(false);
    });

    it('detects Stripe test key as sandbox even without explicit flag', () => {
      setEnv('SANDBOX_MODE', undefined);
      setEnv('STRIPE_SECRET_KEY', 'sk_test_abc123');
      setEnv('NODE_ENV', 'production');
      expect(isSandboxMode()).toBe(true);
    });

    it('detects iyzico sandbox URI as sandbox', () => {
      setEnv('SANDBOX_MODE', undefined);
      setEnv('IYZICO_URI', 'https://sandbox-api.iyzipay.com');
      setEnv('NODE_ENV', 'production');
      expect(isSandboxMode()).toBe(true);
    });

    it('treats non-production NODE_ENV as sandbox by default', () => {
      setEnv('SANDBOX_MODE', undefined);
      setEnv('STRIPE_SECRET_KEY', undefined);
      setEnv('NODE_ENV', 'development');
      expect(isSandboxMode()).toBe(true);
    });
  });

  describe('getApiKeyMode', () => {
    it('detects live Stripe keys', () => {
      expect(getApiKeyMode('sk_live_abc')).toBe('live');
      expect(getApiKeyMode('pk_live_abc')).toBe('live');
    });

    it('detects test Stripe keys', () => {
      expect(getApiKeyMode('sk_test_abc')).toBe('test');
      expect(getApiKeyMode('pk_test_abc')).toBe('test');
    });

    it('defaults unknown / non-prefixed keys to test', () => {
      expect(getApiKeyMode('random_key')).toBe('test');
      expect(getApiKeyMode('')).toBe('test');
    });
  });

  describe('requireSandbox', () => {
    it('does not throw in sandbox mode', () => {
      setEnv('SANDBOX_MODE', 'true');
      expect(() => requireSandbox()).not.toThrow();
    });

    it('throws when not in sandbox mode', () => {
      setEnv('SANDBOX_MODE', 'false');
      setEnv('NODE_ENV', 'production');
      expect(() => requireSandbox()).toThrow(/sandbox\/test modunda/);
    });
  });
});
/**
 * Sandbox utility unit tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isSandboxMode,
  getApiKeyMode,
  requireSandbox,
} from '../sandbox';

const originalEnv = { ...process.env };

function setEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    (process.env as Record<string, string>)[key] = value;
  }
}

describe('Sandbox Utilities', () => {
  beforeEach(() => {
    setEnv('SANDBOX_MODE', undefined);
    setEnv('PAYTR_TEST_MODE', undefined);
    setEnv('NODE_ENV', 'test');
  });

  afterEach(() => {
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

    it('detects PayTR test mode as sandbox', () => {
      setEnv('SANDBOX_MODE', undefined);
      setEnv('PAYTR_TEST_MODE', '1');
      setEnv('NODE_ENV', 'production');
      expect(isSandboxMode()).toBe(true);
    });

    it('treats non-production NODE_ENV as sandbox by default', () => {
      setEnv('SANDBOX_MODE', undefined);
      setEnv('NODE_ENV', 'development');
      expect(isSandboxMode()).toBe(true);
    });
  });

  describe('getApiKeyMode', () => {
    it('detects live keys', () => {
      expect(getApiKeyMode('live_abc')).toBe('live');
      expect(getApiKeyMode('sk_live_abc')).toBe('live');
    });

    it('defaults unknown / test keys to test', () => {
      expect(getApiKeyMode('test_abc')).toBe('test');
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
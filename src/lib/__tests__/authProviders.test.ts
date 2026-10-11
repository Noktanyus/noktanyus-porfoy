import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getEnabledSocialProviders,
  isGoogleAuthEnabled,
  isGoogleConfigured,
} from '../authProviders';

describe('authProviders', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('getEnabledSocialProviders returns google as enabled by default', () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GITHUB_CLIENT_ID;
    delete process.env.GITHUB_CLIENT_SECRET;

    const providers = getEnabledSocialProviders();
    expect(providers).toContain('google');
    expect(providers).not.toContain('github');
  });

  it('includes github when GITHUB credentials are configured', () => {
    process.env.GITHUB_CLIENT_ID = 'test-github-id';
    process.env.GITHUB_CLIENT_SECRET = 'test-github-secret';

    const providers = getEnabledSocialProviders();
    expect(providers).toContain('google');
    expect(providers).toContain('github');
  });

  it('isGoogleAuthEnabled always returns true', () => {
    expect(isGoogleAuthEnabled()).toBe(true);
  });

  it('isGoogleConfigured detects real vs missing/placeholder credentials', () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    expect(isGoogleConfigured()).toBe(false);

    process.env.GOOGLE_CLIENT_ID = 'noktanyus-placeholder.apps.googleusercontent.com';
    process.env.GOOGLE_CLIENT_SECRET = 'noktanyus-placeholder-secret';
    expect(isGoogleConfigured()).toBe(false);

    process.env.GOOGLE_CLIENT_ID = 'real-id.apps.googleusercontent.com';
    process.env.GOOGLE_CLIENT_SECRET = 'real-secret';
    expect(isGoogleConfigured()).toBe(true);
  });
});

/**
 * AI Client (Provider-Agnostic) — Sprint 1.5 unit tests
 *
 * OpenAI-compatible adapter: 3 env kontrolü (baseUrl + apiKey + model),
 * singleton davranışı, test reset.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ai-client lib (provider-agnostic)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.AI_BASE_URL;
    delete process.env.AI_API_KEY;
    delete process.env.AI_MODEL;
    delete process.env.AI_PROVIDER_DISPLAY_NAME;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('isAiConfigured() returns false when any of the 3 env vars is missing', async () => {
    const { isAiConfigured } = await import('../ai-client');

    // Tümü yok
    expect(isAiConfigured()).toBe(false);

    // Sadece baseUrl
    process.env.AI_BASE_URL = 'https://api.example.com/v1';
    expect(isAiConfigured()).toBe(false);

    // baseUrl + apiKey (model hala yok)
    process.env.AI_API_KEY = 'sk-test';
    expect(isAiConfigured()).toBe(false);

    // 3'ü de var
    process.env.AI_MODEL = 'mock-model';
    expect(isAiConfigured()).toBe(true);
  });

  it('isAiConfigured() treats empty/whitespace strings as missing', async () => {
    const { isAiConfigured } = await import('../ai-client');
    process.env.AI_BASE_URL = '   ';
    process.env.AI_API_KEY = '';
    process.env.AI_MODEL = 'mock';
    expect(isAiConfigured()).toBe(false);
  });

  it('getAiClient() throws when not configured', async () => {
    const { getAiClient } = await import('../ai-client');
    expect(() => getAiClient()).toThrow(/AI_BASE_URL|AI_API_KEY|AI_MODEL/);
  });

  it('getAiClient() returns the same singleton instance', async () => {
    process.env.AI_BASE_URL = 'https://api.example.com/v1';
    process.env.AI_API_KEY = 'sk-test';
    process.env.AI_MODEL = 'mock-model';

    const { getAiClient, __resetAiClientForTests } = await import('../ai-client');
    const instance1 = getAiClient();
    const instance2 = getAiClient();
    expect(instance1).toBe(instance2);

    __resetAiClientForTests();
    const instance3 = getAiClient();
    expect(instance3).not.toBe(instance2);
  });

  it('getActiveModel() returns env model or null', async () => {
    const { getActiveModel } = await import('../ai-client');
    expect(getActiveModel()).toBeNull();

    process.env.AI_BASE_URL = 'https://api.minimaxi.com/v1';
    process.env.AI_API_KEY = 'sk';
    process.env.AI_MODEL = 'MiniMax-M3';

    expect(getActiveModel()).toBe('MiniMax-M3');
  });

  it('getActiveProviderDisplayName() falls back to model name', async () => {
    const { getActiveProviderDisplayName } = await import('../ai-client');

    // display name set edilmedi → model fallback
    process.env.AI_BASE_URL = 'https://api.minimaxi.com/v1';
    process.env.AI_API_KEY = 'sk';
    process.env.AI_MODEL = 'MiniMax-M3';
    expect(getActiveProviderDisplayName()).toBe('MiniMax-M3');

    // display name set edildi → onu döndür
    process.env.AI_PROVIDER_DISPLAY_NAME = 'MiniMax M3';
    // Re-import to pick up new env (vi.resetModules gerekli, ama singleton env-based config için yeterli)
    const { getActiveProviderDisplayName: fn } = await import('../ai-client');
    expect(fn()).toBe('MiniMax M3');
  });

  it('exports MAX_GENERATION_TOKENS constant', async () => {
    const { MAX_GENERATION_TOKENS } = await import('../ai-client');
    expect(MAX_GENERATION_TOKENS).toBeGreaterThan(0);
    expect(MAX_GENERATION_TOKENS).toBe(4096);
  });

  it('getAiProviderConfig() returns null when not configured', async () => {
    const { getAiProviderConfig } = await import('../ai-client');
    expect(getAiProviderConfig()).toBeNull();
  });

  it('getAiProviderConfig() returns full config when configured', async () => {
    process.env.AI_BASE_URL = 'https://api.example.com/v1';
    process.env.AI_API_KEY = 'sk-test';
    process.env.AI_MODEL = 'test-model';
    process.env.AI_PROVIDER_DISPLAY_NAME = 'Test Provider';

    const { getAiProviderConfig } = await import('../ai-client');
    const config = getAiProviderConfig();
    expect(config).toEqual({
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'sk-test',
      model: 'test-model',
      displayName: 'Test Provider',
    });
  });
});

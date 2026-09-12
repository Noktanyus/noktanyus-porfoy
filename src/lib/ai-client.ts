/**
 * Provider-Agnostic AI Client — Sprint 1.5
 *
 * OpenAI uyumlu tüm provider'ları destekler (MiniMax, OpenAI native, OpenRouter,
 * Mistral, Groq, Together AI, vb.). Konfigürasyon tamamen .env üzerinden.
 *
 * Kullanım:
 *   .env:
 *     AI_BASE_URL="https://api.minimaxi.com/v1"
 *     AI_API_KEY="..."
 *     AI_MODEL="MiniMax-M3"
 *
 *   AI_BASE_URL/AI_API_KEY/AI_MODEL 3 env'nin 3'ü de dolu olmalı.
 *   Herhangi biri eksikse → mock mode (logger.warn('[AI Mock]'))
 *
 * NOT: Bu dosya SADECE server-side API route'lardan veya Server Component'lerden
 * import edilmelidir. Client componentlerden import ETME — openai SDK Node-only.
 */

import OpenAI from 'openai';

interface AiClient {
  chat: {
    completions: {
      create: (params: {
        model: string;
        max_tokens?: number;
        messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
        temperature?: number;
      }) => Promise<{
        id: string;
        model: string;
        choices: Array<{
          message: { role: 'assistant'; content: string };
          finish_reason: string | null;
        }>;
        usage: {
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
        };
      }>;
    };
  };
}

let _aiInstance: AiClient | null = null;

/**
 * Aktif provider konfigürasyonu. .env'den okunur.
 * 3 env'nin 3'ü de dolu olmalı (mock mode için hepsini boş bırak).
 */
export function getAiProviderConfig(): {
  baseUrl: string;
  apiKey: string;
  model: string;
  displayName: string;
} | null {
  const baseUrl = process.env.AI_BASE_URL?.trim();
  const apiKey = process.env.AI_API_KEY?.trim();
  const model = process.env.AI_MODEL?.trim();

  if (!baseUrl || !apiKey || !model) return null;

  return {
    baseUrl,
    apiKey,
    model,
    displayName: process.env.AI_PROVIDER_DISPLAY_NAME?.trim() || model,
  };
}

/**
 * AI provider konfigüre edilmiş mi kontrol eder.
 * 3 env (AI_BASE_URL + AI_API_KEY + AI_MODEL) dolu olmalı.
 */
export function isAiConfigured(): boolean {
  return getAiProviderConfig() !== null;
}

/**
 * OpenAI instance'ını döner (OpenAI uyumlu API).
 * Konfigüre değilse throw eder — service katmanı mock fallback yapar.
 */
export function getAiClient(): AiClient {
  const config = getAiProviderConfig();
  if (!config) {
    throw new Error(
      '[ai-client] AI_BASE_URL / AI_API_KEY / AI_MODEL gerekli — isAiConfigured() ile kontrol et'
    );
  }
  if (!_aiInstance) {
    _aiInstance = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    }) as unknown as AiClient;
  }
  return _aiInstance;
}

/**
 * Aktif provider'ın model adını döner. Konfigüre değilse null.
 */
export function getActiveModel(): string | null {
  return getAiProviderConfig()?.model ?? null;
}

/**
 * Aktif provider'ın display name'ini döner (UI badge için).
 */
export function getActiveProviderDisplayName(): string | null {
  return getAiProviderConfig()?.displayName ?? null;
}

/** Test amaçlı (singleton reset) — production'da kullanılmamalı */
export function __resetAiClientForTests(): void {
  _aiInstance = null;
}

/**
 * Max token limit — generation timeout / cost protection.
 */
export const MAX_GENERATION_TOKENS = 4096;

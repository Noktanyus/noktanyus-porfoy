/**
 * AI Module Types — Sprint 1.5
 *
 * Provider-agnostic. Cost calculation model bazlı.
 */

export type AiFeature = 'blog.write' | 'product.describe';

export interface AiUsageRecord {
  userId: string;
  feature: AiFeature | string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costCents: number;
  resourceId?: string;
  resourceType?: string;
  promptSummary?: string;
}

export interface GenerationMeta {
  feature: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  mock: boolean;
}

/**
 * Per-1M-token pricing (USD cents). Provider-agnostic.
 * MiniMax pricing tahmini (public bilgi sınırlı). Default fallback conservative.
 *
 * Birim: 1 USD = 100 cents → per-1M-token fiyatı cents cinsinden.
 * costCents = (inputTokens * inputPrice + outputTokens * outputPrice) / 1_000_000
 */
const PRICING_PER_MILLION_CENTS: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4o': { input: 250, output: 1000 },           // $2.50 / $10.00
  'gpt-4o-mini': { input: 15, output: 60 },         // $0.15 / $0.60
  'gpt-4-turbo': { input: 1000, output: 3000 },     // $10 / $30
  'o1-preview': { input: 1500, output: 6000 },      // $15 / $60
  'o1-mini': { input: 300, output: 1200 },          // $3 / $12

  // Anthropic (OpenRouter üzerinden)
  'anthropic/claude-3.5-sonnet': { input: 300, output: 1500 },
  'anthropic/claude-3-5-sonnet': { input: 300, output: 1500 },
  'anthropic/claude-3-haiku': { input: 25, output: 125 },
  'claude-3-5-sonnet-20241022': { input: 300, output: 1500 },

  // Google Gemini
  'gemini-1.5-pro': { input: 125, output: 500 },     // $1.25 / $5
  'gemini-1.5-flash': { input: 7, output: 30 },      // $0.075 / $0.30
  'gemini-2.0-flash-exp': { input: 0, output: 0 },   // şimdilik ücretsiz

  // Mistral
  'mistral-large-latest': { input: 200, output: 600 },
  'mistral-small-latest': { input: 20, output: 60 },

  // Meta (Groq / OpenRouter)
  'llama-3.1-405b-instruct': { input: 200, output: 200 },
  'llama-3.1-70b-versatile': { input: 59, output: 79 },

  // MiniMax (tahmini public pricing)
  'MiniMax-M3': { input: 200, output: 800 },
  'MiniMax-Text-01': { input: 100, output: 400 },
  'abab6.5s-chat': { input: 100, output: 400 },

  // Generic fallback
  _default: { input: 200, output: 800 },
};

/**
 * Model adına göre tahmini maliyet hesaplar (cents cinsinden).
 * Provider-agnostic — model adı geçiyorsa bilinen pricing, yoksa default fallback.
 */
export function estimateCostCents(inputTokens: number, outputTokens: number, model?: string): number {
  if (!inputTokens && !outputTokens) return 0;
  const pricing =
    PRICING_PER_MILLION_CENTS[model ?? ''] ?? PRICING_PER_MILLION_CENTS._default;
  // per-1M-token → cost = (tokens / 1_000_000) * priceCents
  const costCents = (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
  return Math.round(costCents * 100) / 100; // 2 ondalık
}

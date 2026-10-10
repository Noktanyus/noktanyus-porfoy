/**
 * Zero-dependency TypeScript/JavaScript client for Noktanyus TR API.
 * Node.js 18+ · native fetch only (no undici / axios).
 */

export interface NoktanyusClientOptions {
  /** Dashboard API key — sent as `x-api-key` (same as Python SDK). */
  apiKey: string;
  /** Default: https://noktanyus.com */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 10000). */
  timeoutMs?: number;
}

export class NoktanyusApiError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly fieldErrors?: Record<string, string[]>;
  readonly formErrors?: string[];

  constructor(options: {
    message: string;
    code: string;
    statusCode: number;
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
  }) {
    super(options.message);
    this.name = 'NoktanyusApiError';
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.fieldErrors = options.fieldErrors;
    this.formErrors = options.formErrors;
  }
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | string;
  uptime?: number;
  timestamp?: string;
  totalLatency?: number;
  checks?: Record<string, { status: string; latency?: number; error?: string }>;
}

export interface IbanResult {
  valid: boolean;
  iban?: string;
  formatted?: string;
  bankCode?: string;
  bankName?: string;
}

export interface IdentityResult {
  valid: boolean;
  type?: string;
  error?: string | null;
}

export class NoktanyusTrClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(apiKeyOrOptions: string | NoktanyusClientOptions) {
    const options =
      typeof apiKeyOrOptions === 'string'
        ? { apiKey: apiKeyOrOptions }
        : apiKeyOrOptions;

    if (!options.apiKey || !options.apiKey.trim()) {
      throw new Error('NoktanyusTrClient: apiKey is required / apiKey zorunludur.');
    }

    this.apiKey = options.apiKey.trim();
    this.baseUrl = (options.baseUrl || 'https://noktanyus.com').replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? 10_000;
  }

  /** GET /api/health — public readiness probe (API key still sent for consistency). */
  async health(): Promise<HealthResponse> {
    return this.getJson<HealthResponse>('/api/health', { expectEnvelope: false });
  }

  /** POST /api/v1/validate/iban */
  async validateIban(iban: string): Promise<IbanResult> {
    return this.post('/api/v1/validate/iban', { iban });
  }

  /** POST /api/v1/validate/identity */
  async validateIdentity(input: {
    type: 'tckn' | 'vkn' | string;
    value: string;
  }): Promise<IdentityResult> {
    return this.post('/api/v1/validate/identity', input);
  }

  /** POST /api/v1/validate/phone */
  async validatePhone(
    phone: string,
    options: { type?: 'any' | 'mobile' | 'landline' | string } = {},
  ): Promise<Record<string, unknown>> {
    return this.post('/api/v1/validate/phone', {
      phone,
      type: options.type ?? 'any',
    });
  }

  async post<TRes = unknown>(
    endpoint: string,
    payload: Record<string, unknown> | unknown[],
  ): Promise<TRes> {
    const data = await this.requestJson(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
      expectEnvelope: true,
    });
    return data as TRes;
  }

  private async getJson<T>(
    endpoint: string,
    opts: { expectEnvelope: boolean },
  ): Promise<T> {
    return this.requestJson(endpoint, {
      method: 'GET',
      expectEnvelope: opts.expectEnvelope,
    }) as Promise<T>;
  }

  private async requestJson(
    endpoint: string,
    opts: {
      method: 'GET' | 'POST';
      body?: string;
      expectEnvelope: boolean;
    },
  ): Promise<unknown> {
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${path}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: opts.method,
        headers: {
          Accept: 'application/json',
          'x-api-key': this.apiKey,
          'User-Agent': 'noktanyus-typescript/0.1.0',
          ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: opts.body,
        signal: controller.signal,
      });

      const raw = await response.text();
      const json = safeJson(raw);

      if (!opts.expectEnvelope) {
        if (!response.ok) {
          throw errorFromBody(json, response.status);
        }
        return json;
      }

      if (!response.ok || !json || (json as { success?: boolean }).success === false) {
        throw errorFromBody(json, response.status);
      }

      return (json as { data?: unknown }).data;
    } catch (err) {
      if (err instanceof NoktanyusApiError) throw err;
      if ((err as Error).name === 'AbortError') {
        throw new NoktanyusApiError({
          message: `Request timed out (${this.timeoutMs}ms) / İstek zaman aşımı.`,
          code: 'TIMEOUT',
          statusCode: 408,
        });
      }
      throw new NoktanyusApiError({
        message: (err as Error).message || 'Network error / Ağ hatası',
        code: 'NETWORK_ERROR',
        statusCode: 0,
      });
    } finally {
      clearTimeout(timer);
    }
  }
}

function safeJson(raw: string): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function errorFromBody(data: unknown, status: number): NoktanyusApiError {
  const err =
    data && typeof data === 'object' && 'error' in data
      ? (data as { error: unknown }).error
      : null;

  let code = status === 401 ? 'UNAUTHORIZED' : 'UNKNOWN_ERROR';
  let message = 'API request failed / API isteği başarısız oldu.';
  let fieldErrors: Record<string, string[]> | undefined;
  let formErrors: string[] | undefined;

  if (typeof err === 'string') {
    message = err;
  } else if (err && typeof err === 'object') {
    const obj = err as {
      code?: unknown;
      message?: unknown;
    };
    if (obj.code != null) code = String(obj.code);
    if (typeof obj.message === 'string') {
      message = obj.message;
    } else if (obj.message && typeof obj.message === 'object') {
      const nested = obj.message as {
        fieldErrors?: Record<string, string[]>;
        formErrors?: string[];
      };
      fieldErrors = nested.fieldErrors;
      formErrors = nested.formErrors;
      message = 'Validation error / Doğrulama hatası oluştu.';
    }
  }

  return new NoktanyusApiError({
    message,
    code,
    statusCode: status,
    fieldErrors,
    formErrors,
  });
}

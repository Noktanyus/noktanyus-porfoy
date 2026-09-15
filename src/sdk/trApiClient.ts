/**
 * @file Noktanyus TR API — Official TypeScript / JavaScript Client SDK
 * @description Türkiye e-ticaret, finans, lojistik ve resmi doğrulama mikroservisleri istemcisi.
 * Zero-dependency, modern fetch tabanlıdır (Node.js 18+, Bun, Deno ve modern tarayıcılar ile uyumludur).
 */

export interface NoktanyusClientOptions {
  /** Noktanyus Dashboard üzerinden üretilen API anahtarı (x-api-key) */
  apiKey: string;
  /** İsteğe bağlı API temel URL'i (varsayılan: https://noktanyus.com) */
  baseUrl?: string;
  /** İstek zaman aşımı süresi (milisaniye cinsinden, varsayılan: 10000ms) */
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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export class NoktanyusTrClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(options: NoktanyusClientOptions) {
    if (!options.apiKey) {
      throw new Error('NoktanyusTrClient: apiKey parametresi zorunludur.');
    }
    this.apiKey = options.apiKey.trim();
    this.baseUrl = (options.baseUrl || 'https://noktanyus.com').replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? 10000;
  }

  /**
   * Genel POST istek metodudur.
   */
  async post<TReq extends Record<string, unknown> | unknown[], TRes>(
    endpoint: string,
    payload: TReq
  ): Promise<TRes> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const json = await response.json().catch(() => null);

      if (!response.ok || !json || json.success === false) {
        const errorPayload = json?.error;
        const code = errorPayload?.code || (response.status === 401 ? 'UNAUTHORIZED' : 'UNKNOWN_ERROR');
        let message = 'API isteği başarısız oldu.';
        let fieldErrors: Record<string, string[]> | undefined;
        let formErrors: string[] | undefined;

        if (typeof errorPayload === 'string') {
          message = errorPayload;
        } else if (errorPayload && typeof errorPayload === 'object') {
          if (typeof errorPayload.message === 'string') {
            message = errorPayload.message;
          } else if (errorPayload.message && typeof errorPayload.message === 'object') {
            fieldErrors = errorPayload.message.fieldErrors;
            formErrors = errorPayload.message.formErrors;
            message = 'Doğrulama hatası oluştu. Parametreleri kontrol edin.';
          }
        }

        throw new NoktanyusApiError({
          message,
          code,
          statusCode: response.status,
          fieldErrors,
          formErrors,
        });
      }

      return json.data as TRes;
    } catch (err) {
      if (err instanceof NoktanyusApiError) {
        throw err;
      }
      if ((err as Error).name === 'AbortError') {
        throw new NoktanyusApiError({
          message: `İstek zaman aşımına uğradı (${this.timeoutMs}ms).`,
          code: 'TIMEOUT',
          statusCode: 408,
        });
      }
      throw new NoktanyusApiError({
        message: (err as Error).message || 'Bilinmeyen bir ağ hatası oluştu.',
        code: 'NETWORK_ERROR',
        statusCode: 0,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  // ─── 1. Doğrulama Servisleri ──────────────────────────────────────────────

  /** TCKN veya VKN format ve checksum kontrolü */
  async validateIdentity(input: { type: 'tckn' | 'vkn'; value: string }) {
    return this.post<{ type: string; value: string }, { valid: boolean; type: string; error: string | null }>(
      '/api/v1/validate/identity',
      input
    );
  }

  /** TR IBAN format, uzunluk ve MOD-97 sağlama kontrolü */
  async validateIban(iban: string) {
    return this.post<
      { iban: string },
      { valid: boolean; iban: string; formatted: string; bankCode: string; bankName: string }
    >('/api/v1/validate/iban', { iban });
  }

  /** IBAN üzerinden banka kodu ve resmi banka unvanı çözümleme */
  async resolveIbanBank(iban: string) {
    return this.post<{ iban: string }, { bankCode: string; bankName: string; isKnown: boolean }>(
      '/api/v1/iban/bank',
      { iban }
    );
  }

  /** TR telefon numarası formatlama ve operatör tespiti */
  async validatePhone(input: { phone: string; type?: 'any' | 'mobile' | 'landline' }) {
    return this.post<
      { phone: string; type?: string },
      { valid: boolean; e164: string; national: string; operatorPrefix: string; type: string }
    >('/api/v1/validate/phone', input);
  }

  /** Posta kodu doğrulaması ve il tespiti */
  async validatePostal(postalCode: string) {
    return this.post<{ postalCode: string }, { valid: boolean; postalCode: string; provinceId: number; provinceName: string }>(
      '/api/v1/validate/postal',
      { postalCode }
    );
  }

  /** Araç plaka kontrolü ve il eşlemesi */
  async validatePlate(plate: string) {
    return this.post<
      { plate: string },
      { valid: boolean; plate: string; formatted: string; provinceId: number; provinceName: string; isSpecial: boolean }
    >('/api/v1/validate/plate', { plate });
  }

  /** Toplu doğrulama (en fazla 100 öğe) */
  async batchValidate(input: { type: string; values: string[] }) {
    return this.post<{ type: string; values: string[] }, Array<{ value: string; valid: boolean; error: string | null }>>(
      '/api/v1/validate/batch',
      input
    );
  }

  // ─── 2. Finans & Muhasebe Servisleri ─────────────────────────────────────

  /** KDV hesaplama (kuruş hassasiyetinde net/brüt) */
  async calculateKdv(input: { amountCents: number; vatRate?: number; mode?: 'net' | 'gross' }) {
    return this.post<
      { amountCents: number; vatRate?: number; mode?: string },
      { netCents: number; vatCents: number; grossCents: number; vatRate: number; mode: string }
    >('/api/v1/finance/kdv', input);
  }

  /** KDV tevkifatı hesaplama (2/10, 5/10, 7/10 vb.) */
  async calculateTevkifat(input: {
    amountCents: number;
    vatRate?: 0 | 1 | 10 | 20;
    mode?: 'net' | 'gross';
    withholding?: '2/10' | '3/10' | '4/10' | '5/10' | '7/10' | '9/10' | '10/10' | number;
  }) {
    return this.post<
      typeof input,
      {
        netCents: number;
        vatCents: number;
        withholdingCents: number;
        payableVatCents: number;
        buyerPaysSellerCents: number;
        withholdingRatio: string;
      }
    >('/api/v1/finance/tevkifat', input);
  }

  /** Para tutarını Türkçe metne / çek güvenlik formatına çevirme */
  async amountToWords(input: { amountCents: number; currency?: 'TRY' | 'USD' | 'EUR' | 'GBP'; uppercaseCompact?: boolean }) {
    return this.post<
      typeof input,
      { words: string; compact: string; amountCents: number; currency: string }
    >('/api/v1/finance/to-words', input);
  }

  /** Kıdem ve ihbar tazminatı hesaplama */
  async calculateSeverance(input: {
    monthlyGrossCents: number;
    startDate: string;
    endDate: string;
    severanceCeilingCents?: number;
  }) {
    return this.post<
      typeof input,
      {
        years: number;
        months: number;
        days: number;
        grossSeveranceCents: number;
        stampTaxCents: number;
        netSeveranceCents: number;
        noticePeriodWeeks: number;
        noticeGrossCents: number;
      }
    >('/api/v1/labor/severance', input);
  }

  /** TCMB canlı döviz kurları */
  async getFxRates() {
    return this.post<Record<string, never>, { date: string; source: string; rates: Record<string, { buying: number; selling: number }> }>(
      '/api/v1/finance/fx',
      {}
    );
  }

  // ─── 3. Takvim & İş Günü Servisleri ──────────────────────────────────────

  /** İki tarih arasındaki net iş günü ve tatil günleri hesabı */
  async calculateBusinessDays(input: {
    startDate: string;
    endDate: string;
    includeStart?: boolean;
    includeEnd?: boolean;
  }) {
    return this.post<
      typeof input,
      { totalDays: number; businessDays: number; weekendDays: number; holidayDays: number }
    >('/api/v1/calendar/business-days', input);
  }

  /** Belirli bir tarihin iş günü olup olmadığını sorgulama */
  async isBusinessDay(date: string) {
    return this.post<
      { date: string },
      { date: string; isBusinessDay: boolean; isWeekend: boolean; isHoliday: boolean; holidayName: string | null }
    >('/api/v1/calendar/is-business-day', { date });
  }

  /** Türkiye 81 il listesi */
  async listProvinces() {
    return this.post<Record<string, never>, { provinces: Array<{ id: number; name: string }> }>(
      '/api/v1/geo/provinces',
      {}
    );
  }
}

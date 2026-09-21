/**
 * OpenAPI 3.1.0 Specification Builder — Public API Reference
 *
 * Single source of truth for the Redoc / Swagger UI surface at /docs and
 * the JSON spec served at /api/openapi.
 *
 * All public TR API endpoints feature:
 *  - Explicit POST request body JSON schemas and realistic test examples.
 *  - Detailed 200 OK success schemas and concrete response examples.
 *  - Standardized error codes & error lifecycle across all HTTP status codes:
 *    * 400 Bad Request (VALIDATION)
 *    * 401 Unauthorized (UNAUTHORIZED / INVALID_KEY)
 *    * 402 Payment Required (QUOTA_EXCEEDED)
 *    * 429 Too Many Requests (RATE_LIMITED)
 *    * 500 Internal Server Error (INTERNAL_ERROR with auto credit refund)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Minimal OpenAPI 3.1 type definitions
// ─────────────────────────────────────────────────────────────────────────────

type Referenceable<T> = T | { $ref: string };

interface ParameterObject {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required?: boolean;
  description?: string;
  schema?: SchemaObject;
  example?: unknown;
}

interface MediaTypeObject {
  schema?: Referenceable<SchemaObject>;
  example?: unknown;
  examples?: Record<string, unknown>;
}

interface RequestBodyObject {
  required?: boolean;
  description?: string;
  content: Record<string, MediaTypeObject>;
}

interface ResponseObject {
  description: string;
  headers?: Record<string, { schema?: SchemaObject; description?: string }>;
  content?: Record<string, MediaTypeObject>;
}

interface CodeSampleObject {
  lang: string;
  label?: string;
  source: string;
}

interface OperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  security?: Array<Record<string, string[]>>;
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses: Record<string, Referenceable<ResponseObject>>;
  'x-codeSamples'?: CodeSampleObject[];
}

type SchemaObject = Record<string, unknown>;

interface PathsObject {
  [path: string]: { [method: string]: OperationObject };
}

interface Document {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
    contact?: { name?: string; email?: string };
    license?: { name: string };
  };
  servers: Array<{ url: string; description?: string }>;
  tags: Array<{ name: string; description?: string }>;
  paths: PathsObject;
  components?: {
    securitySchemes?: Record<string, SchemaObject>;
    schemas?: Record<string, SchemaObject>;
    responses?: Record<string, ResponseObject>;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable Schemas & Error Models
// ─────────────────────────────────────────────────────────────────────────────

const ErrorResponse: SchemaObject = {
  type: 'object',
  required: ['success', 'error'],
  properties: {
    success: { type: 'boolean', enum: [false], example: false, description: 'İşlemin başarısız olduğunu belirtir' },
    error: {
      type: 'object',
      required: ['code', 'message'],
      properties: {
        code: {
          type: 'string',
          enum: [
            'VALIDATION',
            'UNAUTHORIZED',
            'INVALID_KEY',
            'QUOTA_EXCEEDED',
            'RATE_LIMITED',
            'INTERNAL_ERROR',
          ],
          example: 'VALIDATION',
          description: 'Hatanın makine tarafından okunabilir benzersiz durum kodu.',
        },
        message: {
          oneOf: [
            { type: 'string', example: 'Geçersiz parametre veya eksik başlık' },
            {
              type: 'object',
              description: 'Form ve alan bazlı doğrulama hataları detay listesi',
              properties: {
                formErrors: { type: 'array', items: { type: 'string' } },
                fieldErrors: {
                  type: 'object',
                  additionalProperties: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          ],
          description: 'İnsan tarafından okunabilir hata mesajı veya detaylı doğrulama haritası.',
        },
      },
    },
  },
};

const ApiEnvelope: SchemaObject = {
  type: 'object',
  required: ['success'],
  properties: {
    success: { type: 'boolean', example: true },
    data: { type: 'object' },
    error: { type: 'string' },
    meta: {
      type: 'object',
      properties: {
        total: { type: 'integer' },
        page: { type: 'integer' },
        limit: { type: 'integer' },
      },
    },
  },
};

const Pagination: SchemaObject = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Reusable Component Responses (Error cycle & Status codes)
// ─────────────────────────────────────────────────────────────────────────────

const ComponentResponses: Record<string, ResponseObject> = {
  '400BadRequest': {
    description: 'Doğrulama Hatası (HTTP 400 Bad Request): Gönderilen JSON şemaya uymuyor veya zorunlu alanlar eksik.',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
        example: {
          success: false,
          error: {
            code: 'VALIDATION',
            message: {
              formErrors: [],
              fieldErrors: {
                value: ['Bu alanın doldurulması zorunludur'],
              },
            },
          },
        },
      },
    },
  },
  '401Unauthorized': {
    description: 'Yetkilendirme Hatası (HTTP 401 Unauthorized): x-api-key başlığı eksik veya anahtar geçersiz/süresi dolmuş.',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
        example: {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'API key required. Lütfen x-api-key başlığı ile geçerli bir API anahtarı gönderin.',
          },
        },
      },
    },
  },
  '402QuotaExceeded': {
    description: 'Kota veya Bakiye Yetersiz (HTTP 402 Payment Required): Aylık plan istek limitiniz dolmuş veya kredi bakiyeniz tükenmiştir.',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
        example: {
          success: false,
          error: {
            code: 'QUOTA_EXCEEDED',
            message: 'Aylık istek kotanız dolmuştur. Planınızı yükseltin veya /magaza/krediler üzerinden kredi yükleyin.',
          },
        },
      },
    },
  },
  '429RateLimited': {
    description: 'Hız Sınırı Aşıldı (HTTP 429 Too Many Requests): Dakika başına izin verilen maksimum çağrı limiti aşıldı.',
    headers: {
      'Retry-After': {
        schema: { type: 'integer', example: 60 },
        description: 'Tekrar istek yapabilmek için beklenmesi gereken saniye',
      },
      'X-RateLimit-Limit': {
        schema: { type: 'integer', example: 60 },
        description: 'Dakika başına maksimum istek hakkı',
      },
      'X-RateLimit-Remaining': {
        schema: { type: 'integer', example: 0 },
        description: 'Kalan istek hakkı',
      },
    },
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
        example: {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Rate limit exceeded. Lütfen Retry-After süresi kadar bekleyin.',
          },
        },
      },
    },
  },
  '500InternalError': {
    description: 'Sunucu Hatası (HTTP 500 Internal Server Error): Beklenmeyen sistem hatası. Kredi harcanmışsa tutar anında hesaba iade edilir.',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorResponse' },
        example: {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Beklenmeyen bir sunucu hatası oluştu. Kredi modundaysanız harcanan kredi otomatik olarak iade edilmiştir.',
          },
        },
      },
    },
  },
};

const standardErrorResponses: Record<string, Referenceable<ResponseObject>> = {
  '400': { $ref: '#/components/responses/400BadRequest' },
  '401': { $ref: '#/components/responses/401Unauthorized' },
  '402': { $ref: '#/components/responses/402QuotaExceeded' },
  '429': { $ref: '#/components/responses/429RateLimited' },
  '500': { $ref: '#/components/responses/500InternalError' },
};

function makeTrEndpoint(opts: {
  summary: string;
  description?: string;
  bodySchema: SchemaObject;
  bodyExample: Record<string, unknown>;
  responseExample: unknown;
  responseDescription?: string;
}): { post: OperationObject } {
  return {
    post: {
      tags: ['TR API'],
      summary: opts.summary,
      description: opts.description,
      security: [{ ApiKeyAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: opts.bodySchema,
            example: opts.bodyExample,
          },
        },
      },
      responses: {
        '200': {
          description: opts.responseDescription || 'İşlem başarılı',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['success', 'data'],
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'object' },
                },
              },
              example: {
                success: true,
                data: opts.responseExample,
              },
            },
          },
        },
        ...standardErrorResponses,
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Path registry — keep flat & alphabetical-by-tag for predictable docs
// ─────────────────────────────────────────────────────────────────────────────

const TAGS = ['TR API', 'API Keys', 'Plans'] as const;

const paths: PathsObject = {
  // ─── 1. Türkiye Resmi / Kimlik / İletişim Doğrulamaları ──────────────────
  '/api/v1/validate/identity': makeTrEndpoint({
    summary: 'TCKN veya VKN format ve algoritma doğrulama',
    description: '11 haneli T.C. Kimlik Numarası (tek/çift kuralı, 10 ve 11. hane mod 10 sağlama) veya 10 haneli Vergi Kimlik Numarası (VKN modül 10 sağlama) kontrolü yapar.',
    bodySchema: {
      type: 'object',
      required: ['type', 'value'],
      properties: {
        type: { type: 'string', enum: ['tckn', 'vkn'], description: 'Doğrulanacak kimlik tipi' },
        value: { type: 'string', minLength: 1, maxLength: 32, description: 'TCKN (11 hane) veya VKN (10 hane)' },
      },
    },
    bodyExample: { type: 'tckn', value: '10000000146' },
    responseExample: { valid: true, type: 'tckn', error: null },
    responseDescription: 'Algoritma doğrulama sonucu',
  }),

  '/api/v1/validate/iban': makeTrEndpoint({
    summary: 'TR IBAN format, uzunluk ve MOD-97 checksum kontrolü',
    description: '26 karakterlik Türkiye IBAN numarasını ayrıştırır, banka kodunu tespit eder ve ISO 7064 mod 97-10 kontrolü yapar.',
    bodySchema: {
      type: 'object',
      required: ['iban'],
      properties: {
        iban: { type: 'string', minLength: 1, maxLength: 40, description: 'Doğrulanacak TR IBAN numarası (boşluklu veya bitişik)' },
      },
    },
    bodyExample: { iban: 'TR330006100511123456789012' },
    responseExample: {
      valid: true,
      iban: 'TR330006100511123456789012',
      formatted: 'TR33 0006 1005 1112 3456 7890 12',
      bankCode: '0061',
      bankName: 'Türkiye Garanti Bankası A.Ş.',
    },
  }),

  '/api/v1/iban/bank': makeTrEndpoint({
    summary: 'IBAN üzerinden Türkiye banka kodu ve adı çözümleme',
    description: 'TR IBAN numarasının 5-9. hanelerindeki 5 haneli banka kodunu eşleştirerek resmi banka unvanını döner.',
    bodySchema: {
      type: 'object',
      required: ['iban'],
      properties: {
        iban: { type: 'string', minLength: 1, maxLength: 40, description: 'Banka bilgisi sorgulanacak IBAN' },
      },
    },
    bodyExample: { iban: 'TR330006100511123456789012' },
    responseExample: { bankCode: '0061', bankName: 'Türkiye Garanti Bankası A.Ş.', isKnown: true },
  }),

  '/api/v1/validate/phone': makeTrEndpoint({
    summary: 'TR telefon numarası format ve operatör doğrulaması',
    description: '05xx veya +905xx biçimindeki Türkiye cep ve sabit hat numaralarını doğrular, E.164 uluslararası formatına ve ulusal formata dönüştürür.',
    bodySchema: {
      type: 'object',
      required: ['phone'],
      properties: {
        phone: { type: 'string', minLength: 1, maxLength: 32, description: 'Telefon numarası' },
        type: { type: 'string', enum: ['any', 'mobile', 'landline'], default: 'any', description: 'Hat tipi filtresi' },
      },
    },
    bodyExample: { phone: '05321234567', type: 'mobile' },
    responseExample: { valid: true, e164: '+905321234567', national: '0532 123 45 67', operatorPrefix: '532', type: 'mobile' },
  }),

  '/api/v1/validate/postal': makeTrEndpoint({
    summary: 'Türkiye 5 haneli posta kodu ve il eşleme doğrulaması',
    description: '5 haneli posta kodunu doğrular, ilk 2 hanesinden il kodunu ve il adını belirler.',
    bodySchema: {
      type: 'object',
      required: ['postalCode'],
      properties: {
        postalCode: { type: 'string', minLength: 1, maxLength: 16, description: '5 haneli posta kodu' },
      },
    },
    bodyExample: { postalCode: '07070' },
    responseExample: { valid: true, postalCode: '07070', provinceId: 7, provinceName: 'Antalya' },
  }),

  '/api/v1/validate/plate': makeTrEndpoint({
    summary: 'Türkiye araç plaka format ve il kodu doğrulaması',
    description: '01-81 il kodları ve harf-sayı dizilim kurallarına (07 ABC 123 vb.) uygunluk kontrolü yapar.',
    bodySchema: {
      type: 'object',
      required: ['plate'],
      properties: {
        plate: { type: 'string', minLength: 1, maxLength: 16, description: 'Araç plaka metni' },
      },
    },
    bodyExample: { plate: '07 ABC 123' },
    responseExample: { valid: true, plate: '07ABC123', formatted: '07 ABC 123', provinceId: 7, provinceName: 'Antalya', isSpecial: false },
  }),

  '/api/v1/validate/mersis': makeTrEndpoint({
    summary: 'MERSİS (Merkezi Sicil Kayıt Sistemi) numara formatı kontrolü',
    description: '16 haneli MERSİS numarasının vergi numarası ve şube uzantısı yapısını doğrular.',
    bodySchema: {
      type: 'object',
      required: ['mersis'],
      properties: {
        mersis: { type: 'string', minLength: 16, maxLength: 20, description: '16 haneli MERSİS no' },
      },
    },
    bodyExample: { mersis: '0123456789000014' },
    responseExample: { valid: true, mersis: '0123456789000014', taxNumber: '1234567890' },
  }),

  '/api/v1/validate/kep': makeTrEndpoint({
    summary: 'Kayıtlı Elektronik Posta (KEP) adresi doğrulaması',
    description: 'hs01.kep.tr, hs02.kep.tr, hs03.kep.tr vb. yetkili KEP sağlayıcı uzantılarını doğrular.',
    bodySchema: {
      type: 'object',
      required: ['kep'],
      properties: {
        kep: { type: 'string', minLength: 8, maxLength: 254, description: 'Doğrulanacak KEP adresi' },
      },
    },
    bodyExample: { kep: 'sirket@hs01.kep.tr' },
    responseExample: { valid: true, kep: 'sirket@hs01.kep.tr', domain: 'hs01.kep.tr', isKnownProvider: true },
  }),

  '/api/v1/parse/address': makeTrEndpoint({
    summary: 'Serbest metin Türkiye adresini il, ilçe, mahalle ve kapı no olarak ayrıştırma',
    description: 'Düz metin halindeki adresi semantik olarak analiz ederek il, ilçe, mahalle, cadde/sokak, dış ve iç kapı numaralarına ayrıştırır.',
    bodySchema: {
      type: 'object',
      required: ['address'],
      properties: {
        address: { type: 'string', minLength: 3, maxLength: 500, description: 'Ayrıştırılacak açık adres metni' },
      },
    },
    bodyExample: { address: 'Meltem Mah. Dumlupınar Bulv. No:12 D:4 Muratpaşa / Antalya' },
    responseExample: {
      province: 'Antalya',
      district: 'Muratpaşa',
      neighborhood: 'Meltem Mah.',
      street: 'Dumlupınar Bulv.',
      buildingNo: '12',
      doorNo: '4',
      raw: 'Meltem Mah. Dumlupınar Bulv. No:12 D:4 Muratpaşa / Antalya',
    },
  }),

  // ─── 2. Finans, Vergi, Fatura ve Kıdem Tazminatı ────────────────────────
  '/api/v1/finance/kdv': makeTrEndpoint({
    summary: 'KDV hesaplama (Netten brüte veya brütten nete kuruş hassasiyetinde)',
    description: 'Belirtilen tutar ve KDV oranı üzerinden net tutar, KDV tutarı ve brüt tutarı kuruş cinsinden hesaplar.',
    bodySchema: {
      type: 'object',
      required: ['amountCents'],
      properties: {
        amountCents: { type: 'integer', minimum: 0, description: 'Hesaplanacak tutar (kuruş cinsinden, örn. 100 TL = 10000 kuruş)' },
        vatRate: { type: 'number', minimum: 0, maximum: 100, default: 20, description: 'KDV oranı yüzde olarak (örn: 20)' },
        mode: { type: 'string', enum: ['net', 'gross'], default: 'net', description: 'Girdi tutarının net mi brüt mü olduğu' },
      },
    },
    bodyExample: { amountCents: 100000, vatRate: 20, mode: 'net' },
    responseExample: { netCents: 100000, vatCents: 20000, grossCents: 120000, vatRate: 20, mode: 'net' },
  }),

  '/api/v1/finance/tevkifat': makeTrEndpoint({
    summary: 'KDV tevkifatı hesaplama (2/10, 5/10, 7/10, 9/10 oranları ile)',
    description: 'Resmi KDV tevkifat oranlarına göre kesinti tutarını, satıcıya ödenecek tutarı ve 2 nolu KDV ile beyan edilecek tutarı hesaplar.',
    bodySchema: {
      type: 'object',
      required: ['amountCents'],
      properties: {
        amountCents: { type: 'integer', minimum: 0, description: 'Tutar (kuruş cinsinden)' },
        vatRate: { type: 'integer', enum: [0, 1, 10, 20], default: 20, description: 'KDV oranı' },
        mode: { type: 'string', enum: ['net', 'gross'], default: 'net', description: 'Girdi türü' },
        withholding: {
          oneOf: [
            { type: 'string', enum: ['2/10', '3/10', '4/10', '5/10', '7/10', '9/10', '10/10'] },
            { type: 'number', minimum: 0, maximum: 1 },
          ],
          default: '5/10',
          description: 'Tevkifat oranı (kesirli string veya ondalık sayı)',
        },
      },
    },
    bodyExample: { amountCents: 100000, vatRate: 20, mode: 'net', withholding: '5/10' },
    responseExample: {
      netCents: 100000,
      vatCents: 20000,
      withholdingCents: 10000,
      payableVatCents: 10000,
      buyerPaysSellerCents: 110000,
      withholdingRatio: '5/10',
    },
  }),

  '/api/v1/finance/to-words': makeTrEndpoint({
    summary: 'Para tutarını Türkçe metne çevirme (Çek/senet koruma formatı desteği)',
    description: 'Kuruş cinsinden tutarı Türkçe yazıya dönüştürür. Opsiyonel olarak bankacılık çek/senet güvenlik formatı (#...TL#) üretir.',
    bodySchema: {
      type: 'object',
      required: ['amountCents'],
      properties: {
        amountCents: { type: 'integer', minimum: 0, description: 'Tutar (kuruş cinsinden)' },
        currency: { type: 'string', enum: ['TRY', 'USD', 'EUR', 'GBP'], default: 'TRY', description: 'Para birimi' },
        uppercaseCompact: { type: 'boolean', default: false, description: 'Çek güvenlik formatı üretilsin mi (#...#)' },
      },
    },
    bodyExample: { amountCents: 125050, currency: 'TRY', uppercaseCompact: false },
    responseExample: {
      words: 'Bin İki Yüz Elli Türk Lirası Elli Kuruş',
      compact: '#1250,50TL#',
      amountCents: 125050,
      currency: 'TRY',
    },
  }),

  '/api/v1/finance/fx': makeTrEndpoint({
    summary: 'TCMB (Türkiye Cumhuriyet Merkez Bankası) güncel döviz kurları',
    description: 'TCMB günlük bülteninden önbelleklenmiş alış, satış ve efektif kurları döner.',
    bodySchema: {
      type: 'object',
      description: 'Parametre gerekmez; passthrough boş obje gönderilebilir',
    },
    bodyExample: {},
    responseExample: {
      date: '2026-09-14',
      source: 'TCMB',
      rates: {
        USD: { buying: 34.25, selling: 34.31 },
        EUR: { buying: 37.1, selling: 37.18 },
      },
    },
  }),

  '/api/v1/finance/creditor-ref': makeTrEndpoint({
    summary: 'ISO 11649 RF Alacaklı Referansı (Creditor Reference) kontrolü',
    description: 'Uluslararası bankacılıkta kullanılan RF ile başlayan alacaklı referans numarasını MOD-97 algoritmasıyla doğrular.',
    bodySchema: {
      type: 'object',
      properties: {
        reference: { type: 'string', description: 'Doğrulanacak RF referansı' },
        payload: { type: 'string', description: 'Yeni RF referansı üretmek için ham veri' },
      },
    },
    bodyExample: { reference: 'RF18539007547034' },
    responseExample: { valid: true, reference: 'RF18539007547034', formatted: 'RF18 5390 0754 7034' },
  }),

  '/api/v1/labor/severance': makeTrEndpoint({
    summary: 'Kıdem ve ihbar tazminatı hesabı (Tavan ücret ve damga vergisi dahil)',
    description: 'İşe giriş ve çıkış tarihlerine göre kıdem gününü, resmi kıdem tazminatı tavanını, damga vergisi kesintisini ve ihbar süresi tazminatını hesaplar.',
    bodySchema: {
      type: 'object',
      required: ['monthlyGrossCents', 'startDate', 'endDate'],
      properties: {
        monthlyGrossCents: { type: 'integer', minimum: 1, description: 'Aylık giydirilmiş brüt ücret (kuruş cinsinden)' },
        startDate: { type: 'string', description: 'İşe giriş tarihi (YYYY-AA-GG)' },
        endDate: { type: 'string', description: 'İşten çıkış tarihi (YYYY-AA-GG)' },
        severanceCeilingCents: { type: 'integer', minimum: 1, description: 'Opsiyonel kıdem tazminatı tavanı (kuruş)' },
      },
    },
    bodyExample: { monthlyGrossCents: 4500000, startDate: '2022-01-15', endDate: '2026-09-14' },
    responseExample: {
      years: 4,
      months: 7,
      days: 30,
      grossSeveranceCents: 20850000,
      stampTaxCents: 158251,
      netSeveranceCents: 20691749,
      noticePeriodWeeks: 8,
      noticeGrossCents: 9000000,
    },
  }),

  '/api/v1/invoice/pdf': {
    post: {
      tags: ['TR API'],
      summary: 'Fatura ve teklif için profesyonel PDF doküman üretimi',
      description: 'Satıcı, alıcı, kalemler, KDV ve toplam tutarları içeren şık bir fatura/teklif PDF dosyası oluşturur. Başarılı yanıtta application/pdf binary döner.',
      security: [{ ApiKeyAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['sellerName', 'buyerName', 'invoiceNumber', 'lines'],
              properties: {
                sellerName: { type: 'string', minLength: 1, maxLength: 200 },
                sellerTaxId: { type: 'string', maxLength: 20 },
                buyerName: { type: 'string', minLength: 1, maxLength: 200 },
                buyerTaxId: { type: 'string', maxLength: 20 },
                invoiceNumber: { type: 'string', minLength: 1, maxLength: 64 },
                issueDate: { type: 'string', maxLength: 32 },
                currency: { type: 'string', maxLength: 8, default: 'TRY' },
                notes: { type: 'string', maxLength: 1000 },
                lines: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['description', 'quantity', 'unitPriceCents'],
                    properties: {
                      description: { type: 'string' },
                      quantity: { type: 'number', minimum: 0.001 },
                      unitPriceCents: { type: 'integer', minimum: 0 },
                      vatRate: { type: 'number', default: 20 },
                    },
                  },
                },
              },
            },
            example: {
              sellerName: 'Noktanyus Yazılım A.Ş.',
              sellerTaxId: '1234567890',
              buyerName: 'Örnek Müşteri Ltd. Şti.',
              buyerTaxId: '9876543210',
              invoiceNumber: 'NKT202600000001',
              issueDate: '2026-09-14',
              currency: 'TRY',
              notes: 'Hizmet bedeli 7 gün içinde ödenmelidir.',
              lines: [
                {
                  description: 'API Entegrasyon ve Danışmanlık Hizmeti',
                  quantity: 1,
                  unitPriceCents: 500000,
                  vatRate: 20,
                },
              ],
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Oluşturulan PDF dokümanı binary akışı (application/pdf)',
          content: {
            'application/pdf': {
              schema: { type: 'string', format: 'binary' },
            },
          },
        },
        ...standardErrorResponses,
      },
    },
  },

  // ─── 3. Takvim, Tatiller ve İş Günü Hesaplamaları ───────────────────────
  '/api/v1/calendar/business-days': makeTrEndpoint({
    summary: 'İki tarih arasındaki Türkiye iş günü, hafta sonu ve resmi tatil sayısı hesabı',
    description: 'Başlangıç ve bitiş tarihleri arasındaki toplam günleri; resmi tatiller ve hafta sonlarını filtreleyerek net iş günü sayısını hesaplar.',
    bodySchema: {
      type: 'object',
      required: ['startDate', 'endDate'],
      properties: {
        startDate: { type: 'string', format: 'date', description: 'Başlangıç tarihi (YYYY-AA-GG)' },
        endDate: { type: 'string', format: 'date', description: 'Bitiş tarihi (YYYY-AA-GG)' },
        includeStart: { type: 'boolean', default: true },
        includeEnd: { type: 'boolean', default: true },
      },
    },
    bodyExample: { startDate: '2026-10-01', endDate: '2026-10-15', includeStart: true, includeEnd: true },
    responseExample: { totalDays: 15, businessDays: 11, weekendDays: 4, holidayDays: 0 },
  }),

  '/api/v1/calendar/is-business-day': makeTrEndpoint({
    summary: 'Belirtilen tarihin iş günü olup olmadığını sorgulama',
    description: 'Tarihin hafta sonuna veya Türkiye resmi/dini tatiline denk gelip gelmediğini kontrol eder.',
    bodySchema: {
      type: 'object',
      required: ['date'],
      properties: {
        date: { type: 'string', format: 'date', description: 'Sorgulanacak tarih (YYYY-AA-GG)' },
      },
    },
    bodyExample: { date: '2026-10-05' },
    responseExample: { date: '2026-10-05', isBusinessDay: true, isWeekend: false, isHoliday: false, holidayName: null },
  }),

  '/api/v1/calendar/next-business-day': makeTrEndpoint({
    summary: 'Belirli bir tarihten sonraki N. iş gününü bulma',
    description: 'Hafta sonlarını ve resmi tatilleri atlayarak verilen tarihten sonra gelen iş gününü tespit eder.',
    bodySchema: {
      type: 'object',
      required: ['date'],
      properties: {
        date: { type: 'string', format: 'date', description: 'Başlangıç tarihi (YYYY-AA-GG)' },
        count: { type: 'integer', minimum: 1, default: 1, description: 'Kaçıncı iş günü (varsayılan 1)' },
      },
    },
    bodyExample: { date: '2026-10-09', count: 1 },
    responseExample: { fromDate: '2026-10-09', nextDate: '2026-10-12', daysSkipped: 3 },
  }),

  '/api/v1/calendar/add-business-days': makeTrEndpoint({
    summary: 'Tarihe iş günü ekleme veya çıkarma',
    description: 'Pozitif veya negatif gün sayısı vererek tatilleri atlayarak hedef iş gününe ulaşır.',
    bodySchema: {
      type: 'object',
      required: ['date', 'days'],
      properties: {
        date: { type: 'string', format: 'date', description: 'Tarih (YYYY-AA-GG)' },
        days: { type: 'integer', description: 'Eklenecek veya çıkarılacak iş günü sayısı' },
      },
    },
    bodyExample: { date: '2026-10-01', days: 5 },
    responseExample: { fromDate: '2026-10-01', resultDate: '2026-10-08', addedDays: 5 },
  }),

  '/api/v1/calendar/holidays': makeTrEndpoint({
    summary: 'Ülke bazlı yıllık resmi tatiller listesi',
    description: 'Türkiye (TR) veya diğer ülkelerin belirli bir yıla ait tüm resmi ve dini bayram tatillerini listeler.',
    bodySchema: {
      type: 'object',
      required: ['country', 'year'],
      properties: {
        country: { type: 'string', minLength: 2, maxLength: 3, default: 'TR', description: '2 haneli ISO ülke kodu' },
        year: { type: 'integer', minimum: 1970, maximum: 2100, description: 'Yıl' },
      },
    },
    bodyExample: { country: 'TR', year: 2026 },
    responseExample: {
      country: 'TR',
      year: 2026,
      holidays: [
        { date: '2026-01-01', name: 'Yılbaşı' },
        { date: '2026-04-23', name: 'Ulusal Egemenlik ve Çocuk Bayramı' },
        { date: '2026-05-19', name: "Atatürk'ü Anma, Gençlik ve Spor Bayramı" },
        { date: '2026-10-29', name: 'Cumhuriyet Bayramı' },
      ],
    },
  }),

  '/api/v1/calendar/is-holiday': makeTrEndpoint({
    summary: 'Belirtilen günün resmi tatil olup olmadığını sorgulama',
    bodySchema: {
      type: 'object',
      required: ['country', 'date'],
      properties: {
        country: { type: 'string', minLength: 2, maxLength: 3, default: 'TR' },
        date: { type: 'string', format: 'date', description: 'Sorgulanacak tarih (YYYY-AA-GG)' },
      },
    },
    bodyExample: { country: 'TR', date: '2026-10-29' },
    responseExample: { country: 'TR', date: '2026-10-29', isHoliday: true, holidayName: 'Cumhuriyet Bayramı' },
  }),

  '/api/v1/calendar/bist': makeTrEndpoint({
    summary: 'Borsa İstanbul (BIST) yıllık işlem ve tatil takvimi',
    description: 'BIST pay piyasasının açık ve kapalı olduğu işlem günlerini yıl bazında döner.',
    bodySchema: {
      type: 'object',
      required: ['year'],
      properties: {
        year: { type: 'integer', minimum: 2000, maximum: 2100, description: 'Takvim yılı' },
      },
    },
    bodyExample: { year: 2026 },
    responseExample: {
      year: 2026,
      totalTradingDays: 250,
      closedDays: [{ date: '2026-01-01', reason: 'Yılbaşı Tatili' }],
    },
  }),

  '/api/v1/calendar/tebligat': makeTrEndpoint({
    summary: 'Resmi tebligat süresi ve son itiraz günü hesabı',
    description: 'Tebliğ tarihinden itibaren yasal sürenin son gününü; son günün hafta sonu veya tatile gelmesi durumunda ilk iş gününe uzamasını hesaplar.',
    bodySchema: {
      type: 'object',
      required: ['notifiedAt'],
      properties: {
        notifiedAt: { type: 'string', format: 'date', description: 'Tebliğ tarihi (YYYY-AA-GG)' },
        days: { type: 'integer', default: 15, description: 'Yasal süre (varsayılan 15 gün)' },
        mode: { type: 'string', enum: ['calendar', 'business'], default: 'calendar', description: 'Takvim günü mü iş günü mü' },
      },
    },
    bodyExample: { notifiedAt: '2026-10-01', days: 15, mode: 'calendar' },
    responseExample: { notifiedAt: '2026-10-01', deadlineDate: '2026-10-16', effectiveLastDay: '2026-10-16', days: 15 },
  }),

  '/api/v1/calendar/hijri': makeTrEndpoint({
    summary: 'Hicri ↔ Miladi takvim dönüştürücü',
    description: 'Miladi tarihten Hicri (Kameri) takvime veya Hicri tarihten Miladi takvime çift yönlü dönüşüm yapar.',
    bodySchema: {
      type: 'object',
      required: ['from', 'year', 'month', 'day'],
      properties: {
        from: { type: 'string', enum: ['gregorian', 'hijri'], description: 'Kaynak takvim türü' },
        year: { type: 'integer' },
        month: { type: 'integer', minimum: 1, maximum: 12 },
        day: { type: 'integer', minimum: 1, maximum: 31 },
      },
    },
    bodyExample: { from: 'gregorian', year: 2026, month: 9, day: 14 },
    responseExample: {
      gregorian: { year: 2026, month: 9, day: 14 },
      hijri: { year: 1448, month: 3, day: 2 },
    },
  }),

  // ─── 4. Coğrafi Veriler (İller, İlçeler, Posta Kodları) ─────────────────
  '/api/v1/geo/provinces': makeTrEndpoint({
    summary: 'Türkiye 81 il listesi ve plaka kodları',
    description: "Adana (01) ile Düzce (81) arası tüm Türkiye illerini ve plaka kodlarını listeler.",
    bodySchema: { type: 'object' },
    bodyExample: {},
    responseExample: {
      provinces: [
        { id: 1, name: 'Adana' },
        { id: 7, name: 'Antalya' },
        { id: 34, name: 'İstanbul' },
        { id: 35, name: 'İzmir' },
      ],
    },
  }),

  '/api/v1/geo/districts': makeTrEndpoint({
    summary: 'İl koduna göre Türkiye resmi ilçeleri listesi',
    description: '1-81 arasındaki plaka kodunu alıp o ile bağlı tüm ilçeleri listeler.',
    bodySchema: {
      type: 'object',
      required: ['provinceId'],
      properties: {
        provinceId: { type: 'integer', minimum: 1, maximum: 81, description: 'İl plaka kodu (1-81)' },
      },
    },
    bodyExample: { provinceId: 7 },
    responseExample: {
      provinceId: 7,
      provinceName: 'Antalya',
      districts: ['Akseki', 'Alanya', 'Kepez', 'Konyaaltı', 'Manavgat', 'Muratpaşa'],
    },
  }),

  '/api/v1/geo/postal': makeTrEndpoint({
    summary: 'Posta kodundan il adı ve plaka kodu tespiti',
    bodySchema: {
      type: 'object',
      required: ['postalCode'],
      properties: {
        postalCode: { type: 'string', minLength: 5, maxLength: 10, description: 'Posta kodu' },
      },
    },
    bodyExample: { postalCode: '07070' },
    responseExample: { postalCode: '07070', provinceId: 7, provinceName: 'Antalya' },
  }),

  // ─── 5. E-Ticaret, Stok ve Pazaryeri Hesaplamaları ──────────────────────
  '/api/v1/commerce/reorder-point': makeTrEndpoint({
    summary: 'Stok yeniden sipariş noktası (ROP) ve emniyet stoğu hesabı',
    description: 'Günlük talep, tedarik süresi ve emniyet stoğuna göre sipariş verilmesi gereken minimum stok seviyesini hesaplar.',
    bodySchema: {
      type: 'object',
      required: ['dailyDemand', 'leadTimeDays', 'currentStock'],
      properties: {
        dailyDemand: { type: 'number', minimum: 0, description: 'Günlük ortalama satış/tüketim miktarı' },
        leadTimeDays: { type: 'number', minimum: 0, description: 'Tedarikçiden mal gelme süresi (gün)' },
        safetyStock: { type: 'number', minimum: 0, default: 0, description: 'Emniyet stoğu miktarı' },
        currentStock: { type: 'number', minimum: 0, description: 'Mevcut depodaki stok miktarı' },
      },
    },
    bodyExample: { dailyDemand: 50, leadTimeDays: 7, safetyStock: 100, currentStock: 250 },
    responseExample: {
      reorderPoint: 450,
      currentStock: 250,
      shouldReorder: true,
      recommendedOrderQuantity: 200,
    },
  }),

  '/api/v1/commerce/stripe-split': makeTrEndpoint({
    summary: 'Pazaryeri ödeme bölüşümü ve komisyon hesabı',
    description: 'Tahsil edilen tutar, platform komisyonu ve ödeme kuruluşu kesintisinden sonra satıcıya aktarılacak net tutarı hesaplar.',
    bodySchema: {
      type: 'object',
      required: ['chargeCents'],
      properties: {
        chargeCents: { type: 'integer', minimum: 0, description: 'Müşteriden çekilen toplam tutar (kuruş)' },
        applicationFeeCents: { type: 'integer', minimum: 0, default: 0, description: 'Platform hizmet komisyonu (kuruş)' },
        stripeFeeCents: { type: 'integer', minimum: 0, default: 0, description: 'Ödeme kuruluşu işlem komisyonu (kuruş)' },
      },
    },
    bodyExample: { chargeCents: 10000, applicationFeeCents: 1000, stripeFeeCents: 320 },
    responseExample: {
      chargeCents: 10000,
      platformNetCents: 680,
      connectedAccountCents: 9000,
      stripeFeeCents: 320,
    },
  }),

  '/api/v1/convert/unit': makeTrEndpoint({
    summary: 'Çok kategorili ölçü birimi çevirici (Uzunluk, Kütle, Sıcaklık, Alan, Hacim)',
    bodySchema: {
      type: 'object',
      required: ['category', 'from', 'to', 'value'],
      properties: {
        category: { type: 'string', enum: ['length', 'mass', 'temperature', 'area', 'volume'] },
        from: { type: 'string', description: 'Kaynak birim (örn: kg, m, c)' },
        to: { type: 'string', description: 'Hedef birim (örn: lb, ft, f)' },
        value: { type: 'number', description: 'Dönüştürülecek değer' },
      },
    },
    bodyExample: { category: 'mass', from: 'kg', to: 'lb', value: 10 },
    responseExample: { category: 'mass', from: 'kg', to: 'lb', inputValue: 10, outputValue: 22.0462 },
  }),

  '/api/v1/validate/batch': makeTrEndpoint({
    summary: 'Toplu veri doğrulama (Maksimum 100 öğe, 1 istek / öğe başına 1 kredi)',
    description: 'Tek bir HTTP çağrısında 100 adede kadar TCKN, IBAN, telefon, plaka vb. veriyi topluca doğrular.',
    bodySchema: {
      type: 'object',
      required: ['type', 'values'],
      properties: {
        type: {
          type: 'string',
          enum: [
            'tckn', 'vkn', 'iban', 'phone', 'postal', 'plate', 'card', 'imei', 'ean13',
            'vin', 'container', 'isbn10', 'isbn13', 'issn', 'isin', 'cusip', 'sedol',
            'aba', 'bic', 'gtin', 'uuid', 'url', 'ip', 'eth', 'btc', 'mersis', 'kep', 'cardBrand',
          ],
          description: 'Toplu doğrulanacak veri tipi',
        },
        values: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          maxItems: 100,
          description: 'Doğrulanacak değerler dizisi (en fazla 100 adet)',
        },
      },
    },
    bodyExample: {
      type: 'iban',
      values: ['TR330006100511123456789012', 'TR990000000000000000000000'],
    },
    responseExample: [
      { value: 'TR330006100511123456789012', valid: true, error: null },
      { value: 'TR990000000000000000000000', valid: false, error: 'Checksum invalid' },
    ],
  }),

  // ─── 6. Lojistik, Barkod, Kart ve Donanım Doğrulamaları ──────────────────
  '/api/v1/validate/email': makeTrEndpoint({
    summary: 'E-posta format ve DNS MX kaydı kontrolü',
    description: 'E-posta sözdizimi doğruluğunu ve domainin gerçekten e-posta kabul eden aktif bir MX sunucusu olup olmadığını denetler.',
    bodySchema: {
      type: 'object',
      required: ['email'],
      properties: { email: { type: 'string', format: 'email' } },
    },
    bodyExample: { email: 'yunus@noktanyus.com' },
    responseExample: { valid: true, domain: 'noktanyus.com', mxValid: true },
  }),

  '/api/v1/validate/phone-global': makeTrEndpoint({
    summary: 'Global uluslararası telefon numarası doğrulaması (Google libphonenumber)',
    description: 'Dünya çapındaki tüm ülke telefon numaralarını E.164 standardında doğrular ve operatör/bölge tespiti yapar.',
    bodySchema: {
      type: 'object',
      required: ['phone'],
      properties: {
        phone: { type: 'string', minLength: 5, maxLength: 32 },
        defaultCountry: { type: 'string', minLength: 2, maxLength: 3, default: 'TR' },
      },
    },
    bodyExample: { phone: '+14155552671', defaultCountry: 'US' },
    responseExample: { valid: true, e164: '+14155552671', country: 'US', type: 'mobile' },
  }),

  '/api/v1/validate/barcode': makeTrEndpoint({
    summary: 'EAN-13 perakende ürün barkodu kontrolü',
    bodySchema: {
      type: 'object',
      required: ['barcode'],
      properties: { barcode: { type: 'string', minLength: 13, maxLength: 20 } },
    },
    bodyExample: { barcode: '8690504012345' },
    responseExample: { valid: true, barcode: '8690504012345', country: 'TR' },
  }),

  '/api/v1/validate/gtin': makeTrEndpoint({
    summary: 'GS1 GTIN (GTIN-8, GTIN-12, GTIN-13, GTIN-14) doğrulaması',
    bodySchema: {
      type: 'object',
      required: ['gtin'],
      properties: { gtin: { type: 'string', minLength: 8, maxLength: 20 } },
    },
    bodyExample: { gtin: '08690504012345' },
    responseExample: { valid: true, length: 14 },
  }),

  '/api/v1/validate/card': makeTrEndpoint({
    summary: 'Kredi ve banka kartı Luhn algoritması kontrolü',
    bodySchema: {
      type: 'object',
      required: ['cardNumber'],
      properties: { cardNumber: { type: 'string', minLength: 13, maxLength: 32 } },
    },
    bodyExample: { cardNumber: '4532012345678910' },
    responseExample: { valid: true, length: 16 },
  }),

  '/api/v1/validate/card-brand': makeTrEndpoint({
    summary: 'Kart markası tespiti (Troy, Visa, Mastercard, Amex) ve Luhn kontrolü',
    bodySchema: {
      type: 'object',
      required: ['cardNumber'],
      properties: { cardNumber: { type: 'string', minLength: 13, maxLength: 32 } },
    },
    bodyExample: { cardNumber: '9792001234567890' },
    responseExample: { valid: true, brand: 'Troy', luhnValid: true },
  }),

  '/api/v1/validate/imei': makeTrEndpoint({
    summary: 'IMEI mobil cihaz kimlik numarası (Luhn MOD-10) doğrulaması',
    bodySchema: {
      type: 'object',
      required: ['imei'],
      properties: { imei: { type: 'string', minLength: 14, maxLength: 20 } },
    },
    bodyExample: { imei: '860123456789012' },
    responseExample: { valid: true, luhnValid: true },
  }),

  '/api/v1/validate/vin': makeTrEndpoint({
    summary: 'Araç Şasi Numarası (VIN / Vehicle Identification Number) kontrolü',
    bodySchema: {
      type: 'object',
      required: ['vin'],
      properties: { vin: { type: 'string', minLength: 11, maxLength: 24 } },
    },
    bodyExample: { vin: '1HGCR2F83HA000000' },
    responseExample: { valid: true, vin: '1HGCR2F83HA000000' },
  }),

  '/api/v1/validate/vin-decode': makeTrEndpoint({
    summary: 'NHTSA üzerinden araç şasi numarası (VIN) marka/model çözümleme',
    bodySchema: {
      type: 'object',
      required: ['vin'],
      properties: { vin: { type: 'string', minLength: 11, maxLength: 20 } },
    },
    bodyExample: { vin: '1HGCR2F83HA000000' },
    responseExample: { vin: '1HGCR2F83HA000000', make: 'Honda', model: 'Accord', year: 2017 },
  }),

  '/api/v1/validate/container': makeTrEndpoint({
    summary: 'ISO 6346 Denizyolu Konteyner numarası doğrulaması',
    bodySchema: {
      type: 'object',
      required: ['number'],
      properties: { number: { type: 'string', minLength: 10, maxLength: 20 } },
    },
    bodyExample: { number: 'MSKU1234567' },
    responseExample: { valid: true, ownerCode: 'MSK', serial: '123456', checkDigit: 7 },
  }),

  '/api/v1/validate/awb': makeTrEndpoint({
    summary: 'Hava Kargo Konşimento (Air Waybill / AWB) numarası kontrolü',
    bodySchema: {
      type: 'object',
      required: ['awb'],
      properties: { awb: { type: 'string', minLength: 8, maxLength: 20 } },
    },
    bodyExample: { awb: '020-12345675' },
    responseExample: { valid: true, airlineCode: '020', serial: '1234567', checkDigit: 5 },
  }),

  '/api/v1/validate/imo': makeTrEndpoint({
    summary: 'Gemi IMO numarası doğrulama (International Maritime Organization)',
    bodySchema: {
      type: 'object',
      required: ['imo'],
      properties: { imo: { type: 'string', minLength: 7, maxLength: 16 } },
    },
    bodyExample: { imo: '9074729' },
    responseExample: { valid: true, imo: '9074729' },
  }),

  '/api/v1/validate/mrz': makeTrEndpoint({
    summary: 'Pasaport ve Kimlik Kartı MRZ (ICAO 9303 TD3) 2 satır okuma ve doğrulama',
    bodySchema: {
      type: 'object',
      required: ['line1', 'line2'],
      properties: {
        line1: { type: 'string', minLength: 40, maxLength: 50 },
        line2: { type: 'string', minLength: 40, maxLength: 50 },
      },
    },
    bodyExample: {
      line1: 'P<TURTUGHAN<<YUNUS<<<<<<<<<<<<<<<<<<<<<<<<<<',
      line2: 'U123456785TUR9001015M2801012<<<<<<<<<<<<<<04',
    },
    responseExample: {
      valid: true,
      documentType: 'P',
      issuingState: 'TUR',
      surname: 'TUGHAN',
      names: 'YUNUS',
    },
  }),

  // ─── 7. Uluslararası Finans, Bankacılık ve Checksum Kodları ───────────────
  '/api/v1/validate/bic': makeTrEndpoint({
    summary: 'SWIFT / BIC banka tanımlayıcı kod format kontrolü',
    bodySchema: {
      type: 'object',
      required: ['bic'],
      properties: { bic: { type: 'string', minLength: 8, maxLength: 15 } },
    },
    bodyExample: { bic: 'TCZBTR2AXXX' },
    responseExample: { valid: true, bank: 'TCZB', country: 'TR', location: '2A' },
  }),

  '/api/v1/validate/aba': makeTrEndpoint({
    summary: 'ABD Banka Routing Transit Numarası (ABA) kontrolü',
    bodySchema: {
      type: 'object',
      required: ['routingNumber'],
      properties: { routingNumber: { type: 'string', minLength: 9, maxLength: 12 } },
    },
    bodyExample: { routingNumber: '021000021' },
    responseExample: { valid: true, routingNumber: '021000021' },
  }),

  '/api/v1/validate/isin': makeTrEndpoint({
    summary: 'ISIN (International Securities Identification Number) menkul kıymet kontrolü',
    bodySchema: {
      type: 'object',
      required: ['isin'],
      properties: { isin: { type: 'string', minLength: 12, maxLength: 16 } },
    },
    bodyExample: { isin: 'TRAAKBNK91N6' },
    responseExample: { valid: true, country: 'TR', security: 'AAKBNK91N', checkDigit: '6' },
  }),

  '/api/v1/validate/cusip': makeTrEndpoint({
    summary: 'CUSIP 9 karakterli Kuzey Amerika finansal araç kodu kontrolü',
    bodySchema: {
      type: 'object',
      required: ['cusip'],
      properties: { cusip: { type: 'string', minLength: 9, maxLength: 12 } },
    },
    bodyExample: { cusip: '037833100' },
    responseExample: { valid: true, issuer: '037833', issue: '10', checkDigit: '0' },
  }),

  '/api/v1/validate/sedol': makeTrEndpoint({
    summary: 'SEDOL Birleşik Krallık borsa menkul kıymet kodu doğrulaması',
    bodySchema: {
      type: 'object',
      required: ['sedol'],
      properties: { sedol: { type: 'string', minLength: 7, maxLength: 10 } },
    },
    bodyExample: { sedol: 'B0WN400' },
    responseExample: { valid: true, sedol: 'B0WN400', checkDigit: '0' },
  }),

  '/api/v1/validate/lei': makeTrEndpoint({
    summary: 'LEI (Legal Entity Identifier / ISO 17442) tüzel kişi kodu kontrolü',
    bodySchema: {
      type: 'object',
      required: ['lei'],
      properties: { lei: { type: 'string', minLength: 3, maxLength: 32 } },
    },
    bodyExample: { lei: '7245009UXRIGIRYKDF35' },
    responseExample: { valid: true, lei: '7245009UXRIGIRYKDF35' },
  }),

  '/api/v1/validate/figi': makeTrEndpoint({
    summary: 'FIGI (Financial Instrument Global Identifier) finansal enstrüman kodu kontrolü',
    bodySchema: {
      type: 'object',
      required: ['figi'],
      properties: { figi: { type: 'string', minLength: 3, maxLength: 32 } },
    },
    bodyExample: { figi: 'BBG000BLNNH6' },
    responseExample: { valid: true, figi: 'BBG000BLNNH6' },
  }),

  '/api/v1/validate/mic': makeTrEndpoint({
    summary: 'MIC (Market Identifier Code / ISO 10383) borsa piyasa kodu kontrolü',
    bodySchema: {
      type: 'object',
      required: ['mic'],
      properties: { mic: { type: 'string', minLength: 3, maxLength: 32 } },
    },
    bodyExample: { mic: 'XIST' },
    responseExample: { valid: true, mic: 'XIST', market: 'Borsa Istanbul' },
  }),

  '/api/v1/validate/wkn': makeTrEndpoint({
    summary: 'WKN Alman menkul kıymet kimlik numarası (Wertpapierkennnummer) kontrolü',
    bodySchema: {
      type: 'object',
      required: ['wkn'],
      properties: { wkn: { type: 'string', minLength: 3, maxLength: 32 } },
    },
    bodyExample: { wkn: '710000' },
    responseExample: { valid: true, wkn: '710000' },
  }),

  '/api/v1/validate/sci': makeTrEndpoint({
    summary: 'SEPA Alacaklı Tanımlayıcısı (Creditor Identifier / SCI) doğrulaması',
    bodySchema: {
      type: 'object',
      required: ['sci'],
      properties: { sci: { type: 'string', minLength: 3, maxLength: 32 } },
    },
    bodyExample: { sci: 'FR12ZZZ123456' },
    responseExample: { valid: true, country: 'FR' },
  }),

  '/api/v1/validate/clabe': makeTrEndpoint({
    summary: 'Meksika CLABE 18 haneli banka hesap numarası doğrulaması',
    bodySchema: {
      type: 'object',
      required: ['clabe'],
      properties: { clabe: { type: 'string', minLength: 18, maxLength: 22 } },
    },
    bodyExample: { clabe: '002010077777777771' },
    responseExample: { valid: true, bankCode: '002' },
  }),

  '/api/v1/validate/rib': makeTrEndpoint({
    summary: "Fransa RIB (Relevé d'Identité Bancaire) hesap kontrolü",
    bodySchema: {
      type: 'object',
      required: ['bank', 'branch', 'account', 'key'],
      properties: {
        bank: { type: 'string', minLength: 4, maxLength: 5 },
        branch: { type: 'string', minLength: 4, maxLength: 5 },
        account: { type: 'string', minLength: 10, maxLength: 12 },
        key: { type: 'string', minLength: 2, maxLength: 2 },
      },
    },
    bodyExample: { bank: '30002', branch: '00550', account: '0000157841Z', key: '25' },
    responseExample: { valid: true },
  }),

  '/api/v1/validate/ccc': makeTrEndpoint({
    summary: 'İspanya CCC (Código Cuenta Cliente) banka hesap kontrolü',
    bodySchema: {
      type: 'object',
      required: ['ccc'],
      properties: { ccc: { type: 'string', minLength: 20, maxLength: 24 } },
    },
    bodyExample: { ccc: '00491500051234567892' },
    responseExample: { valid: true },
  }),

  '/api/v1/validate/ogm': makeTrEndpoint({
    summary: 'Belçika OGM yapılandırılmış banka ödeme referansı kontrolü',
    bodySchema: {
      type: 'object',
      required: ['ogm'],
      properties: { ogm: { type: 'string', minLength: 10, maxLength: 20 } },
    },
    bodyExample: { ogm: '101/9563/87241' },
    responseExample: { valid: true },
  }),

  '/api/v1/validate/verhoeff': makeTrEndpoint({
    summary: 'Verhoeff algoritması kontrol basamağı doğrulama',
    bodySchema: {
      type: 'object',
      required: ['value'],
      properties: { value: { type: 'string', minLength: 2, maxLength: 64 } },
    },
    bodyExample: { value: '2363' },
    responseExample: { valid: true, checkDigit: 3 },
  }),

  '/api/v1/validate/damm': makeTrEndpoint({
    summary: 'Damm algoritması kontrol basamağı doğrulama',
    bodySchema: {
      type: 'object',
      required: ['value'],
      properties: { value: { type: 'string', minLength: 2, maxLength: 64 } },
    },
    bodyExample: { value: '5724' },
    responseExample: { valid: true, checkDigit: 4 },
  }),

  '/api/v1/validate/iso7064': makeTrEndpoint({
    summary: 'ISO 7064 (MOD 97-10 ve MOD 11-10) kontrol algoritması',
    bodySchema: {
      type: 'object',
      required: ['value'],
      properties: {
        value: { type: 'string', minLength: 2, maxLength: 64 },
        mode: { type: 'string', enum: ['mod97', 'mod11_10'], default: 'mod97' },
      },
    },
    bodyExample: { value: '12345678901234', mode: 'mod97' },
    responseExample: { valid: true },
  }),

  // ─── 8. GS1 Standartları ────────────────────────────────────────────────
  '/api/v1/validate/gln': makeTrEndpoint({
    summary: 'GS1 GLN (Global Location Number) lokasyon numarası kontrolü',
    bodySchema: {
      type: 'object',
      required: ['gln'],
      properties: { gln: { type: 'string', minLength: 8, maxLength: 32 } },
    },
    bodyExample: { gln: '4012345000019' },
    responseExample: { valid: true, checkDigit: 9 },
  }),

  '/api/v1/validate/sscc': makeTrEndpoint({
    summary: 'GS1 SSCC (Serial Shipping Container Code) sevkiyat konteyner kodu kontrolü',
    bodySchema: {
      type: 'object',
      required: ['sscc'],
      properties: { sscc: { type: 'string', minLength: 8, maxLength: 32 } },
    },
    bodyExample: { sscc: '376123450000000018' },
    responseExample: { valid: true, checkDigit: 8 },
  }),

  '/api/v1/validate/gsrn': makeTrEndpoint({
    summary: 'GS1 GSRN (Global Service Relation Number) hizmet ilişkisi kodu kontrolü',
    bodySchema: {
      type: 'object',
      required: ['gsrn'],
      properties: { gsrn: { type: 'string', minLength: 8, maxLength: 32 } },
    },
    bodyExample: { gsrn: '401234500000000017' },
    responseExample: { valid: true, checkDigit: 7 },
  }),

  '/api/v1/validate/grai': makeTrEndpoint({
    summary: 'GS1 GRAI (Global Returnable Asset Identifier) döngüsel varlık kontrolü',
    bodySchema: {
      type: 'object',
      required: ['grai'],
      properties: { grai: { type: 'string', minLength: 8, maxLength: 32 } },
    },
    bodyExample: { grai: '40123451234560' },
    responseExample: { valid: true, checkDigit: 0 },
  }),

  '/api/v1/validate/gsin': makeTrEndpoint({
    summary: 'GS1 GSIN (Global Shipment Identification Number) sevkiyat kimliği kontrolü',
    bodySchema: {
      type: 'object',
      required: ['gsin'],
      properties: { gsin: { type: 'string', minLength: 8, maxLength: 32 } },
    },
    bodyExample: { gsin: '40123450000000001' },
    responseExample: { valid: true },
  }),

  '/api/v1/validate/gdti': makeTrEndpoint({
    summary: 'GS1 GDTI (Global Document Type Identifier) doküman tipi kimliği kontrolü',
    bodySchema: {
      type: 'object',
      required: ['gdti'],
      properties: { gdti: { type: 'string', minLength: 8, maxLength: 32 } },
    },
    bodyExample: { gdti: '40123451234560' },
    responseExample: { valid: true },
  }),

  // ─── 9. Ulusal Kimlik ve Vergi Formatları ───────────────────────────────
  '/api/v1/validate/eu-vat': makeTrEndpoint({
    summary: 'Avrupa Birliği KDV Numarası (EU VAT - 27 Üye Ülke Algoritmaları)',
    bodySchema: {
      type: 'object',
      required: ['vat'],
      properties: { vat: { type: 'string', minLength: 4, maxLength: 24 } },
    },
    bodyExample: { vat: 'DE123456789' },
    responseExample: { valid: true, country: 'DE' },
  }),

  '/api/v1/validate/cpf': makeTrEndpoint({
    summary: 'Brezilya Bireysel Vergi Numarası (CPF) doğrulaması',
    bodySchema: {
      type: 'object',
      required: ['cpf'],
      properties: { cpf: { type: 'string', minLength: 11, maxLength: 18 } },
    },
    bodyExample: { cpf: '12345678909' },
    responseExample: { valid: true, formatted: '123.456.789-09' },
  }),

  '/api/v1/validate/cnpj': makeTrEndpoint({
    summary: 'Brezilya Şirket Vergi Numarası (CNPJ) doğrulaması',
    bodySchema: {
      type: 'object',
      required: ['cnpj'],
      properties: { cnpj: { type: 'string', minLength: 14, maxLength: 22 } },
    },
    bodyExample: { cnpj: '12345678000195' },
    responseExample: { valid: true, formatted: '12.345.678/0001-95' },
  }),

  '/api/v1/validate/dni': makeTrEndpoint({
    summary: 'İspanya Ulusal Kimlik Kartı Numarası (DNI) kontrolü',
    bodySchema: {
      type: 'object',
      required: ['dni'],
      properties: { dni: { type: 'string', minLength: 8, maxLength: 16 } },
    },
    bodyExample: { dni: '12345678Z' },
    responseExample: { valid: true },
  }),

  '/api/v1/validate/aadhaar': makeTrEndpoint({
    summary: 'Hindistan Aadhaar 12 haneli biyometrik kimlik numarası kontrolü',
    bodySchema: {
      type: 'object',
      required: ['aadhaar'],
      properties: { aadhaar: { type: 'string', minLength: 12, maxLength: 16 } },
    },
    bodyExample: { aadhaar: '367598346012' },
    responseExample: { valid: true },
  }),

  // ─── 10. Web, Standartlar ve Akademik Kodlar ─────────────────────────────
  '/api/v1/validate/isbn': makeTrEndpoint({
    summary: 'Kitap ISBN-10 ve ISBN-13 numarası doğrulaması',
    bodySchema: {
      type: 'object',
      required: ['isbn'],
      properties: {
        isbn: { type: 'string', minLength: 10, maxLength: 20 },
        version: { type: 'string', enum: ['10', '13', 'auto'], default: 'auto' },
      },
    },
    bodyExample: { isbn: '978-3-16-148410-0', version: 'auto' },
    responseExample: { valid: true, isbn13: '9783161484100' },
  }),

  '/api/v1/validate/issn': makeTrEndpoint({
    summary: 'Süreli Yayın ISSN numarası doğrulaması',
    bodySchema: {
      type: 'object',
      required: ['issn'],
      properties: { issn: { type: 'string', minLength: 8, maxLength: 16 } },
    },
    bodyExample: { issn: '0378-5955' },
    responseExample: { valid: true, issn: '03785955' },
  }),

  '/api/v1/validate/doi': makeTrEndpoint({
    summary: 'Akademik Makale DOI (Digital Object Identifier) kontrolü',
    bodySchema: {
      type: 'object',
      required: ['doi'],
      properties: { doi: { type: 'string', minLength: 5, maxLength: 256 } },
    },
    bodyExample: { doi: '10.1000/182' },
    responseExample: { valid: true, prefix: '10.1000', suffix: '182' },
  }),

  '/api/v1/validate/orcid': makeTrEndpoint({
    summary: 'Araştırmacı ORCID (Open Researcher and Contributor ID) kontrolü',
    bodySchema: {
      type: 'object',
      required: ['orcid'],
      properties: { orcid: { type: 'string', minLength: 10, maxLength: 24 } },
    },
    bodyExample: { orcid: '0000-0002-1825-0097' },
    responseExample: { valid: true, formatted: '0000-0002-1825-0097' },
  }),

  '/api/v1/validate/isni': makeTrEndpoint({
    summary: 'ISNI (International Standard Name Identifier) kontrolü',
    bodySchema: {
      type: 'object',
      required: ['isni'],
      properties: { isni: { type: 'string', minLength: 10, maxLength: 24 } },
    },
    bodyExample: { isni: '0000 0001 2146 438X' },
    responseExample: { valid: true, isni: '000000012146438X' },
  }),

  '/api/v1/validate/uuid': makeTrEndpoint({
    summary: 'UUID (Universally Unique Identifier v1-v5) format kontrolü',
    bodySchema: {
      type: 'object',
      required: ['uuid'],
      properties: { uuid: { type: 'string', minLength: 32, maxLength: 40 } },
    },
    bodyExample: { uuid: '123e4567-e89b-12d3-a456-426614174000' },
    responseExample: { valid: true, version: 1 },
  }),

  '/api/v1/validate/url': makeTrEndpoint({
    summary: 'URL format, protokol ve hostname kontrolü',
    bodySchema: {
      type: 'object',
      required: ['url'],
      properties: { url: { type: 'string', minLength: 4, maxLength: 2048 } },
    },
    bodyExample: { url: 'https://noktanyus.com/api' },
    responseExample: { valid: true, protocol: 'https', hostname: 'noktanyus.com' },
  }),

  '/api/v1/validate/ip': makeTrEndpoint({
    summary: 'IPv4 ve IPv6 adres format ve özel blok (private IP) kontrolü',
    bodySchema: {
      type: 'object',
      required: ['ip'],
      properties: { ip: { type: 'string', minLength: 3, maxLength: 64 } },
    },
    bodyExample: { ip: '192.168.1.1' },
    responseExample: { valid: true, version: 4, isPrivate: true },
  }),

  '/api/v1/validate/mac': makeTrEndpoint({
    summary: 'MAC adresi (EUI-48 ve EUI-64) format kontrolü',
    bodySchema: {
      type: 'object',
      required: ['mac'],
      properties: { mac: { type: 'string', minLength: 11, maxLength: 24 } },
    },
    bodyExample: { mac: '00:1A:2B:3C:4D:5E' },
    responseExample: { valid: true, format: 'EUI-48' },
  }),

  '/api/v1/validate/asn': makeTrEndpoint({
    summary: 'BGP Otonom Sistem Numarası (Autonomous System Number / ASN) kontrolü',
    bodySchema: {
      type: 'object',
      required: ['asn'],
      properties: { asn: { type: 'string', minLength: 1, maxLength: 16 } },
    },
    bodyExample: { asn: 'AS15169' },
    responseExample: { valid: true, asn: 15169, holder: 'Google LLC' },
  }),

  '/api/v1/validate/port': makeTrEndpoint({
    summary: 'TCP / UDP port numarası ve standart servis kontrolü',
    bodySchema: {
      type: 'object',
      required: ['port'],
      properties: {
        port: {
          oneOf: [{ type: 'integer' }, { type: 'string' }],
          description: '1 - 65535 arası port numarası',
        },
      },
    },
    bodyExample: { port: 443 },
    responseExample: { valid: true, port: 443, service: 'https', type: 'well-known' },
  }),

  '/api/v1/validate/semver': makeTrEndpoint({
    summary: 'SemVer (Semantic Versioning 2.0.0) format kontrolü',
    bodySchema: {
      type: 'object',
      required: ['version'],
      properties: { version: { type: 'string', minLength: 1, maxLength: 64 } },
    },
    bodyExample: { version: '2.1.0-beta.1' },
    responseExample: { valid: true, major: 2, minor: 1, patch: 0, prerelease: 'beta.1' },
  }),

  '/api/v1/validate/slug': makeTrEndpoint({
    summary: 'SEO ve URL dostu Slug format kontrolü',
    bodySchema: {
      type: 'object',
      required: ['slug'],
      properties: { slug: { type: 'string', minLength: 1, maxLength: 128 } },
    },
    bodyExample: { slug: 'esas-spor-tesisleri' },
    responseExample: { valid: true, slug: 'esas-spor-tesisleri' },
  }),

  '/api/v1/validate/color': makeTrEndpoint({
    summary: 'Hex renk kodu kontrolü ve RGB dönüşümü',
    bodySchema: {
      type: 'object',
      required: ['color'],
      properties: { color: { type: 'string', minLength: 4, maxLength: 16 } },
    },
    bodyExample: { color: '#38bdf8' },
    responseExample: { valid: true, hex: '#38bdf8', rgb: { r: 56, g: 189, b: 248 } },
  }),

  '/api/v1/validate/locale': makeTrEndpoint({
    summary: 'BCP 47 Dil ve Bölge Kodu (Locale) format kontrolü',
    bodySchema: {
      type: 'object',
      required: ['locale'],
      properties: { locale: { type: 'string', minLength: 2, maxLength: 16 } },
    },
    bodyExample: { locale: 'tr-TR' },
    responseExample: { valid: true, language: 'tr', region: 'TR' },
  }),

  '/api/v1/validate/iso-country': makeTrEndpoint({
    summary: 'ISO 3166-1 Alpha-2 ve Alpha-3 Ülke Kodu kontrolü',
    bodySchema: {
      type: 'object',
      required: ['code'],
      properties: { code: { type: 'string', minLength: 2, maxLength: 3 } },
    },
    bodyExample: { code: 'TR' },
    responseExample: { valid: true, alpha2: 'TR', alpha3: 'TUR', name: 'Türkiye' },
  }),

  '/api/v1/validate/iso-language': makeTrEndpoint({
    summary: 'ISO 639 Dil Kodu format kontrolü',
    bodySchema: {
      type: 'object',
      required: ['code'],
      properties: { code: { type: 'string', minLength: 2, maxLength: 8 } },
    },
    bodyExample: { code: 'tr' },
    responseExample: { valid: true, code: 'tr', name: 'Turkish' },
  }),

  '/api/v1/validate/iata': makeTrEndpoint({
    summary: 'IATA 3 harfli uluslararası havalimanı kodu kontrolü',
    bodySchema: {
      type: 'object',
      required: ['code'],
      properties: { code: { type: 'string', minLength: 3, maxLength: 3 } },
    },
    bodyExample: { code: 'AYT' },
    responseExample: { valid: true, code: 'AYT', airport: 'Antalya Havalimanı', city: 'Antalya' },
  }),

  '/api/v1/validate/icao': makeTrEndpoint({
    summary: 'ICAO 4 harfli havacılık meydan kodu kontrolü',
    bodySchema: {
      type: 'object',
      required: ['code'],
      properties: { code: { type: 'string', minLength: 4, maxLength: 4 } },
    },
    bodyExample: { code: 'LTAI' },
    responseExample: { valid: true, code: 'LTAI', airport: 'Antalya Airport' },
  }),

  '/api/v1/validate/timezone': makeTrEndpoint({
    summary: 'IANA saat dilimi (Timezone Identifier) kontrolü ve UTC ofset tespiti',
    bodySchema: {
      type: 'object',
      required: ['zone'],
      properties: { zone: { type: 'string', minLength: 3, maxLength: 64 } },
    },
    bodyExample: { zone: 'Europe/Istanbul' },
    responseExample: { valid: true, zone: 'Europe/Istanbul', currentUtcOffset: '+03:00' },
  }),

  '/api/v1/validate/tld': makeTrEndpoint({
    summary: 'IANA yetkili Üst Düzey Alan Adı (Top-Level Domain / TLD) kontrolü',
    bodySchema: {
      type: 'object',
      required: ['domain'],
      properties: { domain: { type: 'string', minLength: 3, maxLength: 253 } },
    },
    bodyExample: { domain: 'noktanyus.com' },
    responseExample: { valid: true, tld: 'com', isKnownTld: true },
  }),

  '/api/v1/validate/eth': makeTrEndpoint({
    summary: 'Ethereum cüzdan adresi format ve EIP-55 büyük/küçük harf checksum kontrolü',
    bodySchema: {
      type: 'object',
      required: ['address'],
      properties: { address: { type: 'string', minLength: 40, maxLength: 64 } },
    },
    bodyExample: { address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' },
    responseExample: { valid: true, isChecksumValid: true },
  }),

  '/api/v1/validate/btc': makeTrEndpoint({
    summary: 'Bitcoin cüzdan adresi (Base58Check Legacy/P2SH ve Bech32 Segwit) kontrolü',
    bodySchema: {
      type: 'object',
      required: ['address'],
      properties: { address: { type: 'string', minLength: 14, maxLength: 90 } },
    },
    bodyExample: { address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' },
    responseExample: { valid: true, addressType: 'p2pkh', network: 'mainnet' },
  }),

  // ─── API Keys Yönetimi ───────────────────────────────────────────────────
  '/api/user/api-keys': {
    get: {
      tags: ['API Keys'],
      summary: 'Hesabınıza ait API anahtarlarını listeleme (Maskeli)',
      description: 'Güvenlik amacıyla anahtarların sadece prefix (ön ek) kısımları gösterilir.',
      security: [{ SessionCookie: [] }],
      responses: {
        '200': {
          description: 'API anahtarları listesi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiEnvelope' },
              example: {
                success: true,
                data: [
                  {
                    id: 'key_cm123456789',
                    name: 'E-Ticaret Canlı Entegrasyon',
                    prefix: 'nok_live_a1b2...',
                    scopes: ['read:profile', 'api:tr:all'],
                    lastUsedAt: '2026-09-14T14:30:00.000Z',
                    expiresAt: null,
                    createdAt: '2026-08-01T10:00:00.000Z',
                  },
                ],
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/401Unauthorized' },
      },
    },
    post: {
      tags: ['API Keys'],
      summary: 'Yeni API anahtarı oluşturma (Canlı Token Tek Seferlik Döner)',
      description: 'Yeni üretilen anahtarın tam metni yalnızca bu yanıtta tek bir sefer döner; veritabanında SHA-256 hash olarak saklanır.',
      security: [{ SessionCookie: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string', minLength: 1, maxLength: 64, description: 'Anahtar tanımlayıcı adı' },
                scopes: { type: 'array', items: { type: 'string' }, default: ['read:profile'] },
                expiresInDays: { type: 'integer', minimum: 1, maximum: 365, description: 'Geçerlilik süresi (gün)' },
              },
            },
            example: {
              name: 'Canlı Sunucu Entegrasyonu',
              scopes: ['read:profile', 'api:tr:all'],
              expiresInDays: 90,
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'API anahtarı oluşturuldu',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      key: { type: 'string', description: 'Tam token - bir daha görüntülenemez' },
                      prefix: { type: 'string' },
                      scopes: { type: 'array', items: { type: 'string' } },
                      expiresAt: { type: 'string', nullable: true },
                      warning: { type: 'string' },
                    },
                  },
                },
              },
              example: {
                success: true,
                data: {
                  id: 'key_cm123456789',
                  name: 'Canlı Sunucu Entegrasyonu',
                  key: 'nok_live_1234567890abcdef1234567890abcdef',
                  prefix: 'nok_live_1234...',
                  scopes: ['read:profile', 'api:tr:all'],
                  expiresAt: '2026-12-13T20:00:00.000Z',
                  warning: 'Bu anahtarı şimdi kopyalayıp güvenli bir yerde saklayın. Bir daha görüntülenemez.',
                },
              },
            },
          },
        },
        '400': { $ref: '#/components/responses/400BadRequest' },
        '401': { $ref: '#/components/responses/401Unauthorized' },
        '429': { $ref: '#/components/responses/429RateLimited' },
        '500': { $ref: '#/components/responses/500InternalError' },
      },
    },
  },

  '/api/user/api-keys/{id}': {
    delete: {
      tags: ['API Keys'],
      summary: 'API anahtarını anında iptal etme (Revoke)',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'İptal edilecek anahtar ID' }],
      security: [{ SessionCookie: [] }],
      responses: {
        '200': {
          description: 'Anahtar başarıyla iptal edildi',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiEnvelope' },
              example: { success: true, data: { revoked: true, id: 'key_cm123456789' } },
            },
          },
        },
        '401': { $ref: '#/components/responses/401Unauthorized' },
        '404': { description: 'API anahtarı bulunamadı' },
      },
    },
  },

  // ─── Abonelik ve Kredi Paketleri ─────────────────────────────────────────
  '/api/plans': {
    get: {
      tags: ['Plans'],
      summary: 'Aktif abonelik planları ve kota limitleri',
      description: 'Mevcut planların aylık istek kotalarını, özelliklerini ve fiyatlandırmasını döner.',
      responses: {
        '200': {
          description: 'Plan listesi',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        slug: { type: 'string', example: 'pro' },
                        name: { type: 'string', example: 'Pro Geliştirici' },
                        priceCents: { type: 'integer', example: 49900 },
                        currency: { type: 'string', example: 'try' },
                        interval: { type: 'string', example: 'month' },
                        features: { type: 'array', items: { type: 'string' } },
                        limits: {
                          type: 'object',
                          properties: {
                            monthlyApiRequests: { type: 'integer', example: 50000 },
                          },
                        },
                      },
                    },
                  },
                },
              },
              example: {
                success: true,
                data: [
                  {
                    slug: 'starter',
                    name: 'Starter',
                    priceCents: 9900,
                    currency: 'try',
                    interval: 'month',
                    features: [
                      'Aylık 2.000 istek kotası',
                      'Kayıtta 100 ücretsiz hoş geldin kredisi',
                      'Tüm TR API servisleri',
                    ],
                    limits: { monthlyApiRequests: 2000 },
                  },
                  {
                    slug: 'pro',
                    name: 'Pro',
                    priceCents: 29900,
                    currency: 'try',
                    interval: 'month',
                    features: ['Aylık 10.000 istek kotası', 'Öncelikli destek', 'Kredi yükleme desteği'],
                    limits: { monthlyApiRequests: 10000 },
                  },
                  {
                    slug: 'business',
                    name: 'Business',
                    priceCents: 99900,
                    currency: 'try',
                    interval: 'month',
                    features: ['Aylık 50.000 istek kotası', 'Öncelikli SLA'],
                    limits: { monthlyApiRequests: 50000 },
                  },
                  {
                    slug: 'enterprise',
                    name: 'Enterprise',
                    priceCents: 0,
                    currency: 'try',
                    interval: 'month',
                    features: ['Özel kota', 'Kurumsal SLA'],
                    limits: { monthlyApiRequests: null },
                  },
                ],
              },
            },
          },
        },
      },
    },
  },

  '/api/plans/{slug}': {
    get: {
      tags: ['Plans'],
      summary: 'Tekil plan detayları ve limitleri',
      parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' }, description: 'Plan kısa adı (örn: pro)' }],
      responses: {
        '200': {
          description: 'Plan detayları',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiEnvelope' },
              example: {
                success: true,
                data: {
                  slug: 'pro',
                  name: 'Pro',
                  priceCents: 49900,
                  currency: 'try',
                  interval: 'month',
                  limits: { monthlyApiRequests: 50000 },
                },
              },
            },
          },
        },
        '404': { description: 'Plan bulunamadı' },
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Spec root & Configuration
// ─────────────────────────────────────────────────────────────────────────────

const SERVER_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXTAUTH_URL ||
  'https://noktanyus.com';

const PUBLIC_TAG_SET = new Set<string>(TAGS);

function generateCodeSamples(endpointPath: string, bodyExample: Record<string, unknown>): CodeSampleObject[] {
  const compactJson = JSON.stringify(bodyExample);
  return [
    {
      lang: 'Shell',
      label: 'cURL',
      source:
        'curl -X POST "https://noktanyus.com' +
        endpointPath +
        '" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d \'' +
        compactJson.replace(/'/g, "\\'") +
        '\'',
    },
    {
      lang: 'JavaScript',
      label: 'Node.js',
      source:
        'const response = await fetch("https://noktanyus.com' +
        endpointPath +
        '", {\n  method: "POST",\n  headers: {\n    "x-api-key": "YOUR_API_KEY",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify(' +
        compactJson +
        ')\n});\nconst result = await response.json();\nconsole.log(result);',
    },
    {
      lang: 'Python',
      label: 'Python',
      source:
        'import requests\n\nurl = "https://noktanyus.com' +
        endpointPath +
        '"\nheaders = {\n    "x-api-key": "YOUR_API_KEY",\n    "Content-Type": "application/json"\n}\npayload = ' +
        compactJson.replace(/true/g, 'True').replace(/false/g, 'False').replace(/null/g, 'None') +
        '\n\nresponse = requests.post(url, json=payload, headers=headers)\nprint(response.json())',
    },
    {
      lang: 'PHP',
      label: 'PHP',
      source:
        '<?php\n$ch = curl_init("https://noktanyus.com' +
        endpointPath +
        '");\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_POST, true);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(' +
        compactJson +
        '));\ncurl_setopt($ch, CURLOPT_HTTPHEADER, [\n    "Content-Type: application/json",\n    "x-api-key: YOUR_API_KEY"\n]);\n$res = curl_exec($ch);\ncurl_close($ch);\necho $res;',
    },
  ];
}

function getPublicPaths(allPaths: PathsObject): PathsObject {
  const filtered: PathsObject = {};
  for (const [pathKey, methodMap] of Object.entries(allPaths)) {
    const validMethods: Record<string, OperationObject> = {};
    for (const [method, op] of Object.entries(methodMap as Record<string, OperationObject>)) {
      if (op?.tags?.some((t) => PUBLIC_TAG_SET.has(t))) {
        if (method === 'post' && op.requestBody?.content?.['application/json']?.example && !op['x-codeSamples']) {
          op['x-codeSamples'] = generateCodeSamples(
            pathKey,
            op.requestBody.content['application/json'].example as Record<string, unknown>
          );
        }
        validMethods[method] = op;
      }
    }
    if (Object.keys(validMethods).length > 0) {
      filtered[pathKey] = validMethods;
    }
  }
  return filtered;
}

const API_DESCRIPTION = [
  '# Noktanyus TR Yardımcı API Referansı',
  '',
  'Türkiye e-ticaret, finans, lojistik ve resmi operasyonel iş akışları için geliştirilmiş yüksek performanslı yardımcı mikroservisler kataloğu.',
  '',
  '---',
  '',
  '## 1. Kimlik Doğrulama & Yetkilendirme (Authentication)',
  '',
  'Tüm API uçları **makineler arası (machine-to-machine)** entegrasyon için tasarlanmıştır.',
  '',
  'İsteklerinizi aşağıdaki HTTP başlıklarından biriyle gönderiniz:',
  "- `x-api-key: nokt_live_...` *(Önerilen)*",
  "- `Authorization: Bearer nokt_live_...`",
  '',
  '> **API Anahtarı Edinme**: Dashboard üzerinde yer alan **[API Anahtarları](/dashboard/api-keys)** sayfasından anında yeni bir anahtar üretebilirsiniz.',
  '',
  '---',
  '',
  '## 2. Kota ve Bakiye Modelleri (Quota & Billing)',
  '',
  'Her API çağrısı hesap kotanızdan düşülür. Sistem iki aşamalı esnek faturalandırma modelini destekler:',
  '',
  '1. **Abonelik Modeli**: Seçtiğiniz plana göre (Starter: 2.000 istek/ay, Pro: 10.000 istek/ay, Business: 50.000 istek/ay, Kurumsal: Özel Kota) aylık istek kotanız tanımlanır. Kota her fatura döneminde sıfırlanır.',
  '2. **Ön Ödemeli Kredi Modeli**: Kota dolduğunda veya abonelik dışı kullanımda, hesabınızdaki kredi bakiyesinden **1 istek = 1 kredi** olarak düşülür (`/validate/batch` toplu doğrulama ucunda doğrulanan öğe adedi kadar kredi düşer).',
  '3. **Sıfır Risk - Otomatik Kredi İadesi**: Bir API çağrısı sistem kaynaklı 5xx hatasıyla sonuçlanırsa, düşülen kredi **anında otomatik olarak hesabınıza iade edilir**.',
  '',
  '---',
  '',
  '## 3. API Hata Döngüsü ve Durum Kodları (Error Lifecycle)',
  '',
  "API'lerimiz öngörülebilir HTTP durum kodları ve makine tarafından parse edilebilir standart JSON hata şablonu kullanır.",
  '',
  '### Durum Kodları ve Hata Çözüm Tablosu:',
  '',
  '| HTTP Kodu | Hata Kodu (`error.code`) | Neden / Tetiklenme Durumu | Çözüm ve İstemci Döngüsü |',
  '| :--- | :--- | :--- | :--- |',
  '| **200 OK / 201 Created** | — | İşlem başarıyla tamamlandı (`success: true`). | `data` nesnesindeki sonucu işleyin. |',
  '| **400 Bad Request** | `VALIDATION` | İstek gövdesi eksik, hatalı veya Zod şemasına uymuyor. | `message.fieldErrors` alanını kontrol edip parametreleri düzeltin. |',
  '| **401 Unauthorized** | `UNAUTHORIZED` | `x-api-key` veya `Authorization` başlığı eksik. | İstek başlığına geçerli API anahtarınızı ekleyin. |',
  '| **401 Unauthorized** | `INVALID_KEY` | API anahtarı geçersiz, iptal edilmiş veya süresi dolmuş. | Dashboard üzerinden yeni bir API anahtarı üretip güncelleyin. |',
  '| **402 Payment Required** | `QUOTA_EXCEEDED` | Aylık istek kotanız doldu veya kredi bakiyeniz yetersiz. | Planınızı yükseltin veya /magaza/krediler üzerinden bakiye yükleyin. |',
  '| **429 Too Many Requests** | `RATE_LIMITED` | Dakika başına izin verilen hız sınırı aşıldı. | `Retry-After` başlığındaki süre kadar bekleyin (Exponential Backoff). |',
  '| **500 Internal Error** | `INTERNAL_ERROR` | Beklenmeyen sunucu hatası oluştu. | Harcanan kredi anında iade edilmiştir. Kısa süre sonra tekrar deneyin. |',
  '',
  '---',
  '',
  '## 4. Hız Sınırları ve Yanıt Başlıkları (Rate Limiting)',
  '',
  'Her başarılı veya sınıra takılan yanıtta hız limitinizin durumunu gösteren başlıklar iletilir:',
  '- `X-RateLimit-Limit`: Dakika başına izin verilen maksimum istek sayısı.',
  '- `X-RateLimit-Remaining`: Mevcut dakikalık pencerede kalan istek hakkınız.',
  '- `Retry-After`: 429 yanıtlarında tekrar istek yapmadan önce beklemeniz gereken saniye.',
].join('\n');

export const OPENAPI_SPEC: Document = {
  openapi: '3.1.0',
  info: {
    title: 'Noktanyus TR Yardımcı API Referansı',
    version: '1.0.0',
    description: API_DESCRIPTION.trim(),
    contact: { name: 'API Destek Ekibi', email: 'destek@noktanyus.com' },
    license: { name: 'Proprietary' },
  },
  servers: [
    { url: SERVER_URL, description: 'Canlı Sunucu (Production)' },
    { url: 'http://localhost:3000', description: 'Yerel Geliştirme (Local)' },
  ],
  tags: TAGS.map((name) => ({
    name,
    description:
      name === 'TR API'
        ? 'Doğrulama, finans, vergi, takvim, coğrafya, lojistik ve fatura yardımcı API uçları (x-api-key gerektirir)'
        : name === 'API Keys'
          ? 'Geliştirici makineler arası API anahtarı yönetimi'
          : 'Abonelik planları ve istek kotaları',
  })),
  paths: getPublicPaths(paths),
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'Makineler arası entegrasyon için API anahtarı. /dashboard/api-keys üzerinden üretilir.',
      },
      SessionCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'next-auth.session-token',
        description: 'Dashboard oturum çerezi',
      },
    },
    schemas: {
      ErrorResponse,
      ApiEnvelope,
      Pagination,
    },
    responses: ComponentResponses,
  },
};

/**
 * JSON string export — Redoc + /api/openapi/route.ts bunu kullanır.
 */
export const OPENAPI_SPEC_JSON = JSON.stringify(OPENAPI_SPEC);

/**
 * OpenAPI 3.1.0 Specification Builder — Public API Reference
 *
 * Single source of truth for the Redoc / Swagger UI surface at /docs and
 * the JSON spec served at /api/openapi. Edit endpoints in one place —
 * the spec, page and middleware exclusions all read from here.
 *
 * Coverage (Phase D.4):
 *  - Auth      : register, login, password reset, email verification, 2FA, SAML
 *  - OAuth 2.0 : authorize, decision, token (authorization_code + refresh_token, PKCE)
 *  - AI        : admin/blog/ai-generate, admin/products/ai-generate-description,
 *                user/ai/usage
 *  - Products  : public catalog + admin CRUD
 *  - Blog      : admin CRUD
 *  - API Keys  : user/api-keys collection
 *  - Public    : newsletter subscribe/unsubscribe/verify, plans, Turnstile verify
 *
 * Security schemes:
 *  - ApiKeyAuth   : X-API-Key header (machine-to-machine)
 *  - OAuth2Auth   : authorizationCode + refreshToken (PKCE S256)
 *  - SessionCookie: NextAuth session cookie (browser)
 *
 * Tip güvenliği: openapi-types paketi projede kurulu değil. Spec içerik
 * açısından JSON Schema 2020-12 ile uyumlu, runtime'da sadece JSON.stringify
 * üzerinden kullanılıyor — bu yüzden minimal yerel tipler yeterli.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Minimal OpenAPI 3.1 type definitions (lokal — openapi-types paketi opsiyonel)
// ─────────────────────────────────────────────────────────────────────────────

type Referenceable<T> = T | { $ref: string };

interface ParameterObject {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required?: boolean;
  description?: string;
  schema?: SchemaObject;
}

interface RequestBodyObject {
  required?: boolean;
  description?: string;
  content: Record<string, { schema?: Referenceable<SchemaObject> }>;
}

interface ResponseObject {
  description: string;
  headers?: Record<string, { schema?: SchemaObject; description?: string }>;
  content?: Record<string, { schema?: Referenceable<SchemaObject> }>;
}

interface OperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  security?: Array<Record<string, string[]>>;
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses: Record<string, ResponseObject>;
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
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable components
// ─────────────────────────────────────────────────────────────────────────────

const ErrorResponse: SchemaObject = {
  type: 'object',
  required: ['success', 'error'],
  properties: {
    success: { type: 'boolean', enum: [false], example: false },
    error: {
      oneOf: [
        { type: 'string' },
        {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'invalid_request' },
            message: { type: 'string', example: 'Geçersiz istek' },
          },
          required: ['code', 'message'],
        },
      ],
    },
    details: { type: 'object', additionalProperties: true },
  },
};

const ApiEnvelope: SchemaObject = {
  type: 'object',
  required: ['success'],
  properties: {
    success: { type: 'boolean', example: true },
    data: {},
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
// Path registry — keep flat & alphabetical-by-tag for predictable docs
// ─────────────────────────────────────────────────────────────────────────────

const TAGS = ['TR API', 'Auth', 'OAuth 2.0', 'Products', 'Blog', 'API Keys', 'Newsletter', 'Plans', 'System'] as const;

const paths: PathsObject = {
  '/api/v1/validate/identity': {
    post: {
      tags: ['TR API'],
      summary: 'TCKN veya VKN format doğrulama',
      description: 'Türkiye kimlik / vergi numarası format ve checksum kontrolü. Abonelik kotası gerekir.',
      security: [{ ApiKeyAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['type', 'value'],
              properties: {
                type: { type: 'string', enum: ['tckn', 'vkn'] },
                value: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Doğrulama sonucu' },
        '401': { description: 'API key geçersiz' },
        '402': { description: 'Aylık kota aşıldı' },
      },
    },
  },
  '/api/v1/validate/iban': {
    post: {
      tags: ['TR API'],
      summary: 'TR IBAN doğrulama',
      security: [{ ApiKeyAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['iban'],
              properties: { iban: { type: 'string' } },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Doğrulama sonucu' },
        '401': { description: 'API key geçersiz' },
        '402': { description: 'Aylık kota aşıldı' },
      },
    },
  },
  '/api/v1/invoice/pdf': {
    post: {
      tags: ['TR API'],
      summary: 'Fatura / teklif PDF üretimi',
      description: 'GIB e-fatura değildir. Bilgilendirme / teklif PDF döner (application/pdf).',
      security: [{ ApiKeyAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['sellerName', 'buyerName', 'invoiceNumber', 'lines'],
              properties: {
                sellerName: { type: 'string' },
                buyerName: { type: 'string' },
                invoiceNumber: { type: 'string' },
                lines: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'PDF binary' },
        '401': { description: 'API key geçersiz' },
        '402': { description: 'Aylık kota aşıldı' },
      },
    },
  },
  '/api/v1/validate/phone': {
    post: {
      tags: ['TR API'],
      summary: 'TR telefon doğrulama',
      security: [{ ApiKeyAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['phone'],
              properties: {
                phone: { type: 'string' },
                type: { type: 'string', enum: ['any', 'mobile', 'landline'] },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Doğrulama sonucu + e164' },
        '401': { description: 'API key geçersiz' },
        '402': { description: 'Aylık kota aşıldı' },
      },
    },
  },
  '/api/v1/validate/postal': {
    post: {
      tags: ['TR API'],
      summary: 'Posta kodu doğrulama',
      security: [{ ApiKeyAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['postalCode'],
              properties: { postalCode: { type: 'string' } },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Doğrulama + il kodu' },
        '402': { description: 'Aylık kota aşıldı' },
      },
    },
  },
  '/api/v1/validate/plate': {
    post: {
      tags: ['TR API'],
      summary: 'Plaka format doğrulama',
      security: [{ ApiKeyAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['plate'],
              properties: { plate: { type: 'string' } },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Doğrulama sonucu' },
        '402': { description: 'Aylık kota aşıldı' },
      },
    },
  },
  '/api/v1/finance/kdv': {
    post: {
      tags: ['TR API'],
      summary: 'KDV hesaplama (net/brüt)',
      security: [{ ApiKeyAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['amountCents'],
              properties: {
                amountCents: { type: 'integer' },
                vatRate: { type: 'number' },
                mode: { type: 'string', enum: ['net', 'gross'] },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'net / KDV / brüt kuruş' },
        '402': { description: 'Aylık kota aşıldı' },
      },
    },
  },
  '/api/v1/iban/bank': {
    post: {
      tags: ['TR API'],
      summary: 'IBAN banka kodu çözümü',
      security: [{ ApiKeyAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['iban'],
              properties: { iban: { type: 'string' } },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Banka kodu + adı' },
        '402': { description: 'Aylık kota aşıldı' },
      },
    },
  },
  '/api/v1/finance/tevkifat': {
    post: {
      tags: ['TR API'],
      summary: 'KDV + tevkifat hesabı',
      security: [{ ApiKeyAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['amountCents'],
              properties: {
                amountCents: { type: 'integer' },
                vatRate: { type: 'integer', enum: [0, 1, 10, 20] },
                mode: { type: 'string', enum: ['net', 'gross'] },
                withholding: {
                  oneOf: [
                    { type: 'string', enum: ['2/10', '3/10', '4/10', '5/10', '7/10', '9/10', '10/10'] },
                    { type: 'number', minimum: 0, maximum: 1 },
                  ],
                },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Net / KDV / tevkifat / satıcıya ödenen' },
        '402': { description: 'Aylık kota aşıldı' },
      },
    },
  },
  '/api/v1/labor/severance': {
    post: {
      tags: ['TR API'],
      summary: 'Kıdem + ihbar tazminatı hesabı',
      security: [{ ApiKeyAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['monthlyGrossCents', 'startDate', 'endDate'],
              properties: {
                monthlyGrossCents: { type: 'integer' },
                startDate: { type: 'string' },
                endDate: { type: 'string' },
                severanceCeilingCents: { type: 'integer' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Kıdem net/brüt + ihbar brüt' },
        '402': { description: 'Aylık kota aşıldı' },
      },
    },
  },
  '/api/v1/calendar/business-days': {
    post: {
      tags: ['TR API'],
      summary: 'TR iş günü hesabı',
      security: [{ ApiKeyAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['startDate', 'endDate'],
              properties: {
                startDate: { type: 'string', format: 'date' },
                endDate: { type: 'string', format: 'date' },
                includeStart: { type: 'boolean' },
                includeEnd: { type: 'boolean' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'İş / tatil / hafta sonu gün sayıları' },
        '402': { description: 'Aylık kota aşıldı' },
      },
    },
  },
  '/api/v1/finance/to-words': {
    post: {
      tags: ['TR API'],
      summary: 'Tutarı Türkçe yazıya çevir',
      security: [{ ApiKeyAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['amountCents'],
              properties: {
                amountCents: { type: 'integer' },
                currency: { type: 'string', enum: ['TRY', 'USD', 'EUR', 'GBP'] },
                uppercaseCompact: { type: 'boolean' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Türkçe yazı + opsiyonel çek biçimi' },
        '402': { description: 'Aylık kota aşıldı' },
      },
    },
  },
  '/api/v1/validate/email': {
    post: {
      tags: ['TR API'],
      summary: 'E-posta format + MX doğrulama',
      security: [{ ApiKeyAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: { email: { type: 'string' } },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Format + MX sonucu' },
        '402': { description: 'Aylık kota aşıldı' },
      },
    },
  },
  '/api/v1/validate/batch': {
    post: {
      tags: ['TR API'],
      summary: 'Toplu doğrulama (max 100)',
      description: 'Kredi modunda öğe başına 1 kredi düşer.',
      security: [{ ApiKeyAuth: [] }],
      responses: { '200': { description: 'Sonuç listesi' }, '402': { description: 'Kota/kredi yetersiz' } },
    },
  },
  '/api/v1/validate/vin': { post: { tags: ['TR API'], summary: 'VIN doğrulama', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/container': { post: { tags: ['TR API'], summary: 'Konteyner no (ISO 6346)', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/isbn': { post: { tags: ['TR API'], summary: 'ISBN-10/13', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/issn': { post: { tags: ['TR API'], summary: 'ISSN', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/isin': { post: { tags: ['TR API'], summary: 'ISIN', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/cusip': { post: { tags: ['TR API'], summary: 'CUSIP', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/sedol': { post: { tags: ['TR API'], summary: 'SEDOL', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/aba': { post: { tags: ['TR API'], summary: 'US ABA routing', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/bic': { post: { tags: ['TR API'], summary: 'BIC/SWIFT format', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/gtin': { post: { tags: ['TR API'], summary: 'GTIN 8/12/13/14', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/barcode': { post: { tags: ['TR API'], summary: 'EAN-13 barkod', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/uuid': { post: { tags: ['TR API'], summary: 'UUID', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/url': { post: { tags: ['TR API'], summary: 'URL', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/ip': { post: { tags: ['TR API'], summary: 'IP v4/v6', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/card-brand': { post: { tags: ['TR API'], summary: 'Kart markası + Luhn', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/card': { post: { tags: ['TR API'], summary: 'Kart numarası (Luhn)', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/imei': { post: { tags: ['TR API'], summary: 'IMEI (Luhn)', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/eth': { post: { tags: ['TR API'], summary: 'Ethereum adres', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/btc': { post: { tags: ['TR API'], summary: 'Bitcoin adres', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/mersis': { post: { tags: ['TR API'], summary: 'MERSİS format', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/kep': { post: { tags: ['TR API'], summary: 'KEP adresi', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/finance/creditor-ref': { post: { tags: ['TR API'], summary: 'RF creditor reference', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/calendar/next-business-day': { post: { tags: ['TR API'], summary: 'Sonraki iş günü', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/calendar/add-business-days': { post: { tags: ['TR API'], summary: 'İş günü ekle/çıkar', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/calendar/is-business-day': { post: { tags: ['TR API'], summary: 'İş günü mü?', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/calendar/bist': { post: { tags: ['TR API'], summary: 'BIST işlem günleri', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/calendar/tebligat': { post: { tags: ['TR API'], summary: 'Tebligat süresi', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/calendar/hijri': { post: { tags: ['TR API'], summary: 'Hicri ↔ miladi', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/convert/unit': { post: { tags: ['TR API'], summary: 'Birim çevirici', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/parse/address': { post: { tags: ['TR API'], summary: 'TR adres parse', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },

  // GS1 / finans ID / MRZ / checksum
  '/api/v1/validate/gln': { post: { tags: ['TR API'], summary: 'GS1 GLN', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/sscc': { post: { tags: ['TR API'], summary: 'GS1 SSCC', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/gsrn': { post: { tags: ['TR API'], summary: 'GS1 GSRN', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/grai': { post: { tags: ['TR API'], summary: 'GS1 GRAI', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/gsin': { post: { tags: ['TR API'], summary: 'GS1 GSIN', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/gdti': { post: { tags: ['TR API'], summary: 'GS1 GDTI', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/lei': { post: { tags: ['TR API'], summary: 'LEI', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/figi': { post: { tags: ['TR API'], summary: 'FIGI', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/mic': { post: { tags: ['TR API'], summary: 'MIC', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/wkn': { post: { tags: ['TR API'], summary: 'WKN', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/sci': { post: { tags: ['TR API'], summary: 'SCI (SEPA)', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/mrz': { post: { tags: ['TR API'], summary: 'Pasaport MRZ (ICAO 9303)', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/verhoeff': { post: { tags: ['TR API'], summary: 'Verhoeff checksum', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/damm': { post: { tags: ['TR API'], summary: 'Damm checksum', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/iso7064': { post: { tags: ['TR API'], summary: 'ISO 7064 mod97/mod11-10', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/awb': { post: { tags: ['TR API'], summary: 'Hava AWB', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/imo': { post: { tags: ['TR API'], summary: 'IMO gemi no', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/orcid': { post: { tags: ['TR API'], summary: 'ORCID', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/isni': { post: { tags: ['TR API'], summary: 'ISNI', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/doi': { post: { tags: ['TR API'], summary: 'DOI format', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/eu-vat': { post: { tags: ['TR API'], summary: 'EU VAT (jsvat)', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/cpf': { post: { tags: ['TR API'], summary: 'Brezilya CPF', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/cnpj': { post: { tags: ['TR API'], summary: 'Brezilya CNPJ', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/dni': { post: { tags: ['TR API'], summary: 'İspanya DNI', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/aadhaar': { post: { tags: ['TR API'], summary: 'Hindistan Aadhaar', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/clabe': { post: { tags: ['TR API'], summary: 'Meksika CLABE', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/rib': { post: { tags: ['TR API'], summary: 'Fransa RIB', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/ccc': { post: { tags: ['TR API'], summary: 'İspanya CCC', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/ogm': { post: { tags: ['TR API'], summary: 'Belçika OGM', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/mac': { post: { tags: ['TR API'], summary: 'MAC EUI-48/64', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/asn': { post: { tags: ['TR API'], summary: 'ASN', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/port': { post: { tags: ['TR API'], summary: 'TCP/UDP port', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/iso-country': { post: { tags: ['TR API'], summary: 'ISO ülke kodu', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/iso-language': { post: { tags: ['TR API'], summary: 'ISO dil kodu', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/iata': { post: { tags: ['TR API'], summary: 'IATA havaalanı', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/icao': { post: { tags: ['TR API'], summary: 'ICAO kodu', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/timezone': { post: { tags: ['TR API'], summary: 'IANA timezone', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/semver': { post: { tags: ['TR API'], summary: 'Semver', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/slug': { post: { tags: ['TR API'], summary: 'Slug', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/color': { post: { tags: ['TR API'], summary: 'Hex renk', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/locale': { post: { tags: ['TR API'], summary: 'Locale', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/phone-global': { post: { tags: ['TR API'], summary: 'Global telefon (libphonenumber)', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/tld': { post: { tags: ['TR API'], summary: 'Domain TLD', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/validate/vin-decode': { post: { tags: ['TR API'], summary: 'VIN decode (NHTSA)', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/calendar/holidays': { post: { tags: ['TR API'], summary: 'Ülke tatilleri (date-holidays)', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/calendar/is-holiday': { post: { tags: ['TR API'], summary: 'Tatil günü mü?', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/finance/fx': { post: { tags: ['TR API'], summary: 'TCMB döviz (cache)', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/geo/provinces': { post: { tags: ['TR API'], summary: 'TR iller', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/geo/districts': { post: { tags: ['TR API'], summary: 'TR ilçeler (TurkiyeAPI)', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/geo/postal': { post: { tags: ['TR API'], summary: 'Posta → il eşlemesi', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/commerce/reorder-point': { post: { tags: ['TR API'], summary: 'Yeniden sipariş noktası', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },
  '/api/v1/commerce/stripe-split': { post: { tags: ['TR API'], summary: 'Stripe Connect bölüşüm', security: [{ ApiKeyAuth: [] }], responses: { '200': { description: 'OK' } } } },

  // ─── Auth ────────────────────────────────────────────────────────────────
  '/api/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Yeni kullanıcı kaydı (3-step wizard veya legacy)',
      description:
        'Self-serve onboarding son adımı. Hem wizard payload (planSlug + acceptTerms) hem legacy (name+email+password) kabul eder. Email doğrulama token üretir, Resend ile magic link gönderir. Rate limit: auth bucket.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              oneOf: [
                { $ref: '#/components/schemas/OnboardingPayload' },
                { $ref: '#/components/schemas/RegisterStep' },
              ],
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Kayıt kabul edildi (email enumeration koruması: her zaman sent=true)',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiEnvelope' } } },
        },
        '400': { description: 'Validation hatası', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        '429': { description: 'Rate limit aşıldı' },
      },
    },
  },

  '/api/auth/forgot-password': {
    post: {
      tags: ['Auth'],
      summary: 'Şifre sıfırlama talebi',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: { email: { type: 'string', format: 'email' } },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Talep alındı (email enumeration koruması)', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiEnvelope' } } } },
      },
    },
  },

  '/api/auth/reset-password': {
    post: {
      tags: ['Auth'],
      summary: 'Yeni şifre belirle',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token', 'password'],
              properties: {
                token: { type: 'string' },
                password: { type: 'string', minLength: 8 },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Şifre güncellendi', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiEnvelope' } } } },
        '400': { description: 'Token geçersiz / süresi dolmuş' },
      },
    },
  },

  '/api/auth/resend-verification': {
    post: {
      tags: ['Auth'],
      summary: 'Email doğrulama linkini yeniden gönder',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: { email: { type: 'string', format: 'email' } },
            },
          },
        },
      },
      responses: { '200': { description: 'Talep alındı' } },
    },
  },

  '/api/auth/2fa': {
    post: {
      tags: ['Auth'],
      summary: 'Login sırasında 2FA TOTP doğrula',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['challengeId', 'code'],
              properties: {
                challengeId: { type: 'string' },
                code: { type: 'string', minLength: 6, maxLength: 6 },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Doğrulandı, session başlatılır' },
        '401': { description: 'Kod yanlış / süre doldu' },
      },
    },
  },

  // ─── OAuth 2.0 ──────────────────────────────────────────────────────────
  '/api/auth/oauth/authorize': {
    get: {
      tags: ['OAuth 2.0'],
      summary: 'OAuth 2.0 Authorization Endpoint (RFC 6749 §4.1.1)',
      description:
        'Authorization Code + PKCE akışı. response_type=code, code_challenge_method=S256 zorunlu. Login değilse /giris\'e yönlendirir; giriş yapılmışsa /auth/oauth/consent\'e query string ile iletir.',
      parameters: [
        { name: 'response_type', in: 'query', required: true, schema: { type: 'string', enum: ['code'] } },
        { name: 'client_id', in: 'query', required: true, schema: { type: 'string' } },
        { name: 'redirect_uri', in: 'query', required: true, schema: { type: 'string', format: 'uri' } },
        { name: 'scope', in: 'query', required: false, schema: { type: 'string', default: 'read:profile' } },
        { name: 'state', in: 'query', required: false, schema: { type: 'string' } },
        { name: 'code_challenge', in: 'query', required: true, schema: { type: 'string' } },
        { name: 'code_challenge_method', in: 'query', required: false, schema: { type: 'string', enum: ['S256'], default: 'S256' } },
      ],
      responses: {
        '302': { description: 'Consent UI\'ya veya redirect_uri\'ye yönlendirme' },
        '400': { description: 'invalid_request / invalid_client', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  },

  '/api/auth/oauth/authorize/decision': {
    post: {
      tags: ['OAuth 2.0'],
      summary: 'Kullanıcı consent kararı (allow / deny)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['decision', 'state'],
              properties: {
                decision: { type: 'string', enum: ['allow', 'deny'] },
                state: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '302': { description: 'redirect_uri\'ye code veya error ile yönlendirme' },
      },
    },
  },

  '/api/auth/oauth/token': {
    post: {
      tags: ['OAuth 2.0'],
      summary: 'OAuth 2.0 Token Endpoint (RFC 6749 §3.2 + §4.1.3 + §6)',
      description:
        'Desteklenen grant_type: authorization_code (10dk code TTL), refresh_token (30g TTL). Client auth: HTTP Basic veya body. PKCE code_verifier zorunlu. Token DB\'de HASH\'li saklanır (SHA256).',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/OAuthTokenRequest' },
          },
          'application/x-www-form-urlencoded': {
            schema: { $ref: '#/components/schemas/OAuthTokenRequest' },
          },
        },
      },
      security: [
        { OAuth2Auth: [] },
        {},
      ],
      responses: {
        '200': {
          description: 'access_token + refresh_token',
          headers: { 'Cache-Control': { schema: { type: 'string', example: 'no-store' } } },
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['access_token', 'token_type', 'expires_in'],
                properties: {
                  access_token: { type: 'string' },
                  token_type: { type: 'string', example: 'Bearer' },
                  expires_in: { type: 'integer', example: 3600 },
                  refresh_token: { type: 'string' },
                  scope: { type: 'string', example: 'read:profile' },
                },
              },
            },
          },
        },
        '400': { description: 'invalid_grant / invalid_client / invalid_request (RFC 6749 §5.2)', content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'string' }, error_description: { type: 'string' } } } } } },
      },
    },
  },

  // ─── AI ──────────────────────────────────────────────────────────────────
  '/api/admin/blog/ai-generate': {
    post: {
      tags: ['AI'],
      summary: 'AI ile blog yazısı üret',
      description: 'Auth + planGate quota kontrolü. Pro/Enterprise planlı kullanıcılar da erişebilir (Phase D.3).',
      security: [{ SessionCookie: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/AiWriteRequest' } } },
      },
      responses: {
        '200': { description: 'AI üretimi başarılı', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiEnvelope' } } } },
        '401': { description: 'Auth gerekli' },
        '403': { description: 'Kota aşıldı' },
      },
    },
  },

  '/api/admin/products/ai-generate-description': {
    post: {
      tags: ['AI'],
      summary: 'Ürün açıklaması AI ile üret',
      security: [{ SessionCookie: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title'],
              properties: {
                title: { type: 'string' },
                keywords: { type: 'array', items: { type: 'string' } },
                tone: { type: 'string', enum: ['professional', 'casual', 'marketing'] },
                language: { type: 'string', default: 'tr' },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'AI tarafından üretilmiş ürün açıklaması' } },
    },
  },

  '/api/user/ai/usage': {
    get: {
      tags: ['AI'],
      summary: 'Bu ayki AI kullanım özeti',
      description: 'Aylık token + request kullanımı ve kalan kota.',
      security: [{ SessionCookie: [] }],
      responses: {
        '200': {
          description: 'Kullanım özeti',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/ApiEnvelope' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          planSlug: { type: 'string', nullable: true },
                          month: { type: 'string', example: '2026-08' },
                          tokensUsed: { type: 'integer' },
                          requestsUsed: { type: 'integer' },
                          tokensLimit: { type: 'integer', nullable: true },
                          requestsLimit: { type: 'integer', nullable: true },
                          tokensRemaining: { type: 'integer', nullable: true },
                          requestsRemaining: { type: 'integer', nullable: true },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
  },

  // ─── Products ────────────────────────────────────────────────────────────
  '/api/products': {
    get: {
      tags: ['Products'],
      summary: 'Aktif dijital ürünleri listele',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
        { name: 'category', in: 'query', schema: { type: 'string' } },
        { name: 'featured', in: 'query', schema: { type: 'boolean' } },
      ],
      responses: {
        '200': { description: 'Ürün listesi', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiEnvelope' } } } },
      },
    },
  },

  '/api/products/{slug}': {
    get: {
      tags: ['Products'],
      summary: 'Tekil ürün detayı',
      parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        '200': { description: 'Ürün detayı' },
        '404': { description: 'Ürün bulunamadı' },
      },
    },
  },

  '/api/admin/products': {
    post: {
      tags: ['Products'],
      summary: 'Yeni dijital ürün oluştur (admin)',
      security: [{ SessionCookie: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/DigitalProduct' } } },
      },
      responses: {
        '201': { description: 'Ürün oluşturuldu' },
        '400': { description: 'Validation hatası / slug çakışması' },
        '403': { description: 'Admin rolü gerekli' },
      },
    },
  },

  '/api/admin/products/{id}': {
    put: {
      tags: ['Products'],
      summary: 'Ürün güncelle (admin)',
      security: [{ SessionCookie: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/DigitalProduct' } } },
      },
      responses: { '200': { description: 'Güncellendi' }, '404': { description: 'Bulunamadı' } },
    },
    delete: {
      tags: ['Products'],
      summary: 'Ürün sil (admin)',
      security: [{ SessionCookie: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Silindi' }, '404': { description: 'Bulunamadı' } },
    },
  },

  // ─── Blog ────────────────────────────────────────────────────────────────
  '/api/admin/blog': {
    get: {
      tags: ['Blog'],
      summary: 'Tüm blog yazılarını listele (admin)',
      security: [{ SessionCookie: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'scheduled', 'published'] } },
      ],
      responses: { '200': { description: 'Blog listesi' } },
    },
    post: {
      tags: ['Blog'],
      summary: 'Yeni blog yazısı oluştur (admin)',
      security: [{ SessionCookie: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'content', 'author', 'category'],
              properties: {
                title: { type: 'string' },
                slug: { type: 'string' },
                description: { type: 'string' },
                content: { type: 'string' },
                author: { type: 'string' },
                category: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                thumbnail: { type: 'string', format: 'uri' },
                status: { type: 'string', enum: ['draft', 'scheduled', 'published'], default: 'draft' },
                scheduledAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      responses: { '201': { description: 'Blog oluşturuldu' } },
    },
  },

  '/api/admin/blog/{slug}': {
    put: {
      tags: ['Blog'],
      summary: 'Blog güncelle (admin)',
      security: [{ SessionCookie: [] }],
      parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Güncellendi' }, '404': { description: 'Bulunamadı' } },
    },
    delete: {
      tags: ['Blog'],
      summary: 'Blog sil (admin)',
      security: [{ SessionCookie: [] }],
      parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Silindi' } },
    },
  },

  // ─── API Keys ────────────────────────────────────────────────────────────
  '/api/user/api-keys': {
    get: {
      tags: ['API Keys'],
      summary: 'API anahtarlarımı listele (masked)',
      security: [{ SessionCookie: [] }],
      responses: {
        '200': {
          description: 'Masked key listesi — sadece prefix görünür',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/ApiEnvelope' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            prefix: { type: 'string', example: 'nok_live_a1b2...' },
                            scopes: { type: 'array', items: { type: 'string' } },
                            lastUsedAt: { type: 'string', format: 'date-time', nullable: true },
                            expiresAt: { type: 'string', format: 'date-time', nullable: true },
                            createdAt: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['API Keys'],
      summary: 'Yeni API anahtarı oluştur',
      description: '⚠️ Plain key response\'ta TEK SEFER döner; saklanmalıdır. DB\'de HASH\'li saklanır.',
      security: [{ SessionCookie: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string', minLength: 1, maxLength: 64 },
                scopes: { type: 'array', items: { type: 'string' }, default: ['read:profile'] },
                expiresInDays: { type: 'integer', minimum: 1, maximum: 365 },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Yeni anahtar — düz metin SADECE bu response\'ta',
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
                      key: { type: 'string', description: 'Plain text — bir daha gösterilmeyecek' },
                      prefix: { type: 'string' },
                      scopes: { type: 'array', items: { type: 'string' } },
                      expiresAt: { type: 'string', format: 'date-time', nullable: true },
                      warning: { type: 'string', example: 'Bu anahtarı şimdi kaydedin. Bir daha gösterilmeyecek.' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  '/api/user/api-keys/{id}': {
    delete: {
      tags: ['API Keys'],
      summary: 'API anahtarı iptal et',
      security: [{ SessionCookie: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'İptal edildi' }, '404': { description: 'Bulunamadı' } },
    },
  },

  // ─── Newsletter ──────────────────────────────────────────────────────────
  '/api/newsletter/subscribe': {
    post: {
      tags: ['Newsletter'],
      summary: 'Newsletter aboneliği başlat',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: {
                email: { type: 'string', format: 'email' },
                source: { type: 'string', example: 'homepage-footer' },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'Doğrulama emaili gönderildi' } },
    },
  },

  '/api/newsletter/unsubscribe': {
    post: {
      tags: ['Newsletter'],
      summary: 'Abonelikten çık',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token'],
              properties: { token: { type: 'string', description: 'Email\'deki one-click unsubscribe token' } },
            },
          },
        },
      },
      responses: { '200': { description: 'Abonelik iptal edildi' } },
    },
  },

  '/api/newsletter/verify': {
    post: {
      tags: ['Newsletter'],
      summary: 'Double opt-in doğrulama',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token'],
              properties: { token: { type: 'string' } },
            },
          },
        },
      },
      responses: { '200': { description: 'Onaylandı' } },
    },
  },

  // ─── Plans ───────────────────────────────────────────────────────────────
  '/api/plans': {
    get: {
      tags: ['Plans'],
      summary: 'Aktif abonelik planlarını listele',
      responses: {
        '200': {
          description: 'Plan listesi',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        slug: { type: 'string', example: 'pro' },
                        name: { type: 'string' },
                        priceCents: { type: 'integer' },
                        currency: { type: 'string', example: 'try' },
                        interval: { type: 'string', enum: ['month', 'year'] },
                        features: { type: 'array', items: { type: 'string' } },
                        limits: {
                          type: 'object',
                          properties: {
                            aiTokensPerMonth: { type: 'integer' },
                            aiRequestsPerMonth: { type: 'integer' },
                          },
                        },
                      },
                    },
                  },
                },
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
      summary: 'Tekil plan detayı',
      parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Plan detayı' }, '404': { description: 'Plan yok' } },
    },
  },

  // ─── System ──────────────────────────────────────────────────────────────
  '/api/openapi': {
    get: {
      tags: ['System'],
      summary: 'Bu OpenAPI 3.1.0 spec\'i JSON olarak döner',
      responses: {
        '200': {
          description: 'OpenAPI spec',
          content: { 'application/json': { schema: { type: 'object' } } },
        },
      },
    },
  },

  '/api/verify-turnstile': {
    post: {
      tags: ['System'],
      summary: 'Cloudflare Turnstile token doğrulama',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token'],
              properties: { token: { type: 'string', description: 'Turnstile client token' } },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Token geçerli' },
        '400': { description: 'Token geçersiz' },
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Spec root
// ─────────────────────────────────────────────────────────────────────────────

const SERVER_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXTAUTH_URL ||
  'https://noktanyus.com';

export const OPENAPI_SPEC: Document = {
  openapi: '3.1.0',
  info: {
    title: 'Noktanyus Mağaza & TR Yardımcı API',
    version: '1.0.0',
    description:
      'Hazır paket satışı + TR e-ticaret yardımcı API (doğrulama, KDV/tevkifat, kıdem, iş günü, sayıdan yazıya, e-posta MX, fatura PDF). Auth, ürün kataloğu, API key ve abonelik kotası.',
    contact: { name: 'API Support', email: 'api@noktanyus.local' },
    license: { name: 'Proprietary' },
  },
  servers: [
    { url: SERVER_URL, description: 'Current deployment' },
    { url: 'http://localhost:3000', description: 'Local development' },
  ],
  tags: TAGS.map((name) => ({ name })),
  paths,
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'Machine-to-machine API anahtarı. /api/user/api-keys ile üretilir.',
      },
      OAuth2Auth: {
        type: 'oauth2',
        description:
          'OAuth 2.0 Authorization Code with PKCE (RFC 7636, S256). Akış: /api/auth/oauth/authorize → consent → code → /api/auth/oauth/token.',
        flows: {
          authorizationCode: {
            authorizationUrl: '/api/auth/oauth/authorize',
            tokenUrl: '/api/auth/oauth/token',
            refreshUrl: '/api/auth/oauth/token',
            scopes: {
              'read:profile': 'Kullanıcı profil bilgilerini oku',
              'read:orders': 'Sipariş geçmişini oku',
              'write:products': 'Ürün oluştur / güncelle (admin)',
            },
          },
        },
      },
      SessionCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'next-auth.session-token',
        description: 'NextAuth session cookie (browser tabanlı admin/SSR akışları için).',
      },
    },
    schemas: {
      ErrorResponse,
      ApiEnvelope,
      Pagination,
      OnboardingPayload: {
        type: 'object',
        required: ['planSlug', 'acceptTerms'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 80 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          planSlug: { type: 'string', example: 'pro' },
          acceptTerms: { type: 'boolean', enum: [true] },
          marketingOptIn: { type: 'boolean', default: false },
        },
      },
      RegisterStep: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 80 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
      OAuthTokenRequest: {
        type: 'object',
        required: ['grant_type'],
        properties: {
          grant_type: { type: 'string', enum: ['authorization_code', 'refresh_token'] },
          code: { type: 'string', description: 'authorization_code grant için zorunlu' },
          redirect_uri: { type: 'string', format: 'uri' },
          client_id: { type: 'string' },
          client_secret: { type: 'string' },
          code_verifier: { type: 'string', description: 'PKCE verifier (authorization_code)' },
          refresh_token: { type: 'string', description: 'refresh_token grant için zorunlu' },
          scope: { type: 'string' },
        },
      },
      AiWriteRequest: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: { type: 'string', minLength: 10, maxLength: 2000 },
          tone: { type: 'string', enum: ['professional', 'casual', 'educational', 'marketing'] },
          length: { type: 'string', enum: ['short', 'medium', 'long'], default: 'medium' },
          language: { type: 'string', default: 'tr' },
          keywords: { type: 'array', items: { type: 'string' } },
          existingTitle: { type: 'string' },
          existingDescription: { type: 'string' },
        },
      },
      DigitalProduct: {
        type: 'object',
        required: ['title', 'shortDescription', 'description', 'fileUrl', 'fileName', 'priceCents'],
        properties: {
          title: { type: 'string' },
          slug: { type: 'string', description: 'Opsiyonel — title\'dan üretilir' },
          shortDescription: { type: 'string', maxLength: 280 },
          description: { type: 'string' },
          thumbnail: { type: 'string', format: 'uri' },
          images: { type: 'array', items: { type: 'string', format: 'uri' } },
          fileUrl: { type: 'string', format: 'uri' },
          fileName: { type: 'string' },
          fileSize: { type: 'integer' },
          priceCents: { type: 'integer', minimum: 0 },
          currency: { type: 'string', enum: ['try', 'usd', 'eur'], default: 'try' },
          downloadCountMax: { type: 'integer', default: 5 },
          ttlHours: { type: 'integer', default: 72 },
          technologies: { type: 'array', items: { type: 'string' } },
          category: { type: 'string', default: 'general' },
          version: { type: 'string' },
          requirements: { type: 'string' },
          active: { type: 'boolean', default: true },
          featured: { type: 'boolean', default: false },
          order: { type: 'integer', default: 0 },
        },
      },
    },
  },
};

/**
 * JSON string export — Redoc + /api/openapi/route.ts bunu kullanır.
 * Edge runtime'da import edilebilmesi için string olarak dışa aktarıyoruz.
 */
export const OPENAPI_SPEC_JSON = JSON.stringify(OPENAPI_SPEC);
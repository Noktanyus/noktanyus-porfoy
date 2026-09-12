/**
 * KVKK/GDPR Compliance — Zod Schemas (Phase 4 C)
 *
 * Compliance modülünün tüm input/output validation katmanı.
 * Prisma JSON kolonlarındaki runtime shape güvenliği burada sağlanır
 * (Prisma'da Json tipi structural validation yapmaz).
 *
 * Pattern reuse:
 *   - src/modules/ai-bulk/schemas.ts (zod + safeParse pattern)
 *   - src/modules/brand-voice/schemas.ts (Json sub-schema pattern)
 *   - src/lib/schemas/plan.ts (enum/preset pattern)
 */

import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

/** Site status — ComplianceSite.status enum ile birebir. */
export const SiteStatusSchema = z.enum([
  'pending',
  'scanning',
  'compliant',
  'warning',
  'critical',
]);
export type SiteStatus = z.infer<typeof SiteStatusSchema>;

/** Scan interval — scanInterval preset. */
export const ScanIntervalSchema = z.enum(['daily', 'weekly', 'monthly']);
export type ScanInterval = z.infer<typeof ScanIntervalSchema>;

/** Tarayıcı dili. */
export const SiteLanguageSchema = z.enum(['tr', 'en']);
export type SiteLanguage = z.infer<typeof SiteLanguageSchema>;

/** Cookie kategorisi — KVKK/GDPR için gerekli 3 temel kategori. */
export const CookieTypeSchema = z.enum(['necessary', 'analytics', 'marketing']);
export type CookieType = z.infer<typeof CookieTypeSchema>;

/** Threat severity — DataBreachIncident ile paylaşılır. */
export const ThreatSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type ThreatSeverity = z.infer<typeof ThreatSeveritySchema>;

/** Privacy policy yetki alanı. */
export const PolicyJurisdictionSchema = z.enum(['KVKK', 'GDPR', 'KVKK+GDPR']);
export type PolicyJurisdiction = z.infer<typeof PolicyJurisdictionSchema>;

/** Policy üretim kaynağı. */
export const PolicyGeneratorSchema = z.enum(['ai', 'manual']);
export type PolicyGenerator = z.infer<typeof PolicyGeneratorSchema>;

// ============================================================================
// Cookie / Script / Form / Threat sub-schemas
// ============================================================================

/** Tek bir cookie kaydı. */
export const CookieSchema = z.object({
  name: z.string().min(1).max(200),
  provider: z.string().max(200).optional(),
  purpose: z.string().max(500).optional(),
  /** ISO 8601 duration veya natural language ("session", "1 year"). */
  duration: z.string().max(100).optional(),
  type: CookieTypeSchema,
  /** GDPR açısından ön-onay olmaksızın kullanılabilir mi (sadece necessary). */
  exemptFromConsent: z.boolean().optional().default(false),
});
export type CookieRecord = z.infer<typeof CookieSchema>;

/** Tek bir tracking script. */
export const TrackingScriptSchema = z.object({
  url: z.string().url().max(2000),
  provider: z.string().max(200),
  /** Provider'ın bilinen adı (GA4, Yandex Metrika, Facebook Pixel vb.) */
  knownTracker: z.string().max(100).optional(),
  /** GDPR-compliant kategori: false ise açık rıza gerekir. */
  gdprCompliant: z.boolean().default(false),
});
export type TrackingScript = z.infer<typeof TrackingScriptSchema>;

/** Tek bir form — kişisel veri toplama analizi. */
export const FormFieldSchema = z.object({
  name: z.string().max(100),
  /** "email", "phone", "tc_kimlik", "address", ... */
  type: z.string().max(50),
  required: z.boolean().default(false),
  /** Hassas veri kategorisi mi? (KVKK Madde 6: özel nitelikli kişisel veri) */
  sensitive: z.boolean().default(false),
});
export type FormField = z.infer<typeof FormFieldSchema>;

export const FormSchema = z.object({
  /** Sayfanın URL'i. */
  url: z.string().url().max(2000),
  /** Form action URL'i (varsa). */
  action: z.string().max(2000).optional(),
  method: z.enum(['GET', 'POST']).default('POST'),
  fields: z.array(FormFieldSchema).max(50),
  /** Açık rıza mekanizması var mı (checkbox/cookie banner). */
  consentRequired: z.boolean().default(false),
});
export type FormRecord = z.infer<typeof FormSchema>;

/** Tek bir uyumluluk tehdidi. */
export const ThreatSchema = z.object({
  severity: ThreatSeveritySchema,
  type: z.string().max(100), // "missing_cookie_consent" | "tracking_without_consent" | "sensitive_field_no_consent" | "missing_https"
  description: z.string().min(1).max(1000),
  /** KVKK/GDPR referansı — opsiyonel (örn. "KVKK Madde 5/1"). */
  regulationRef: z.string().max(200).optional(),
  fixSuggestion: z.string().max(1000).optional(),
  /** Threat'in bulunduğu sayfa URL'i (varsa). */
  pageUrl: z.string().url().max(2000).optional(),
});
export type Threat = z.infer<typeof ThreatSchema>;

// ============================================================================
// ScanResult — scanner.ts çıktısı ve CookieScan JSON kolonları için shape
// ============================================================================

export const ScanResultSchema = z.object({
  cookies: z.array(CookieSchema).max(500),
  trackingScripts: z.array(TrackingScriptSchema).max(200),
  forms: z.array(FormSchema).max(200),
  threats: z.array(ThreatSchema).max(200),
  pagesScanned: z.number().int().min(0).default(0),
  durationMs: z.number().int().min(0),
  /** Hesaplanan 0-100 arası compliance skoru. */
  score: z.number().int().min(0).max(100),
});
export type ScanResult = z.infer<typeof ScanResultSchema>;

// ============================================================================
// Add ComplianceSite
// ============================================================================

/** Domain validasyonu — basit host (subdomain.alanadi.com) formatı. */
const DomainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Domain en az 3 karakter olmalı')
  .max(253, 'Domain çok uzun')
  .regex(
    /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/,
    'Geçerli bir domain girin (örn: example.com)'
  );

/** ISO 3166-1 alpha-2 country kodu (case-insensitive, uppercase normalize). */
const CountrySchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(2, 'Ülke kodu 2 karakter olmalı (ISO 3166-1)')
  .regex(/^[A-Z]{2}$/);

export const AddSiteSchema = z.object({
  domain: DomainSchema,
  name: z.string().trim().min(2, 'İsim en az 2 karakter').max(100),
  contactEmail: z.string().trim().toLowerCase().email('Geçerli bir email girin'),
  country: CountrySchema.default('TR'),
  language: SiteLanguageSchema.default('tr'),
  scanInterval: ScanIntervalSchema.default('weekly'),
  notes: z.string().max(2000).optional(),
});
export type AddSiteInput = z.infer<typeof AddSiteSchema>;

// ============================================================================
// StartScan (POST /api/compliance/sites/[id]/scan)
// ============================================================================

export const StartScanSchema = z.object({
  /** Opsiyonel: scan timeout (ms). Default scanner.ts içinde. */
  timeoutMs: z.number().int().min(5000).max(120000).optional(),
  /** Opsiyonel: taranacak URL pattern listesi (boş = ana sayfa + keşfedilen linkler). */
  urlPatterns: z.array(z.string().regex(/^\//, 'Path / ile başlamalı')).max(20).optional(),
});
export type StartScanInput = z.infer<typeof StartScanSchema>;

// ============================================================================
// List sites / list scans query
// ============================================================================

export const ListSitesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: SiteStatusSchema.optional(),
  search: z.string().max(100).optional(),
});
export type ListSitesQuery = z.infer<typeof ListSitesQuerySchema>;

export const ListScansQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListScansQuery = z.infer<typeof ListScansQuerySchema>;

// ============================================================================
// Update site status (manual override / dashboard action)
// ============================================================================

export const UpdateSiteStatusSchema = z.object({
  status: SiteStatusSchema,
  notes: z.string().max(2000).optional(),
});
export type UpdateSiteStatusInput = z.infer<typeof UpdateSiteStatusSchema>;

// ============================================================================
// Schedule next scan (interval change / cron override)
// ============================================================================

export const ScheduleNextScanSchema = z.object({
  scanInterval: ScanIntervalSchema,
  /** Opsiyonel: bir sonraki taramayı zorla hemen tetiklemek için. */
  forceNow: z.boolean().default(false),
});
export type ScheduleNextScanInput = z.infer<typeof ScheduleNextScanSchema>;

// ============================================================================
// Helpers
// ============================================================================

/** scanInterval string → milisaniye cinsinden süre. */
export function scanIntervalToMs(interval: ScanInterval): number {
  switch (interval) {
    case 'daily':
      return 24 * 60 * 60 * 1000;
    case 'weekly':
      return 7 * 24 * 60 * 60 * 1000;
    case 'monthly':
      return 30 * 24 * 60 * 60 * 1000;
  }
}

/**
 * AI Privacy Policy Generator — Phase 4 C.3
 *
 * Provider-agnostic (src/lib/ai-client.ts) — MiniMax, OpenAI, OpenRouter,
 * Anthropic, Mistral, Groq vb. tüm OpenAI uyumlu API'leri destekler.
 * Konfigürasyon yoksa mock fallback döner (kvkk-template.md temel alınır).
 *
 * Pipeline:
 *   1. Jurisdiction'a göre base template yükle (.md)
 *   2. Scan sonuçlarından cookie/3rd-party listelerini inject et
 *   3. Custom clauses (varsa) sona ekle
 *   4. System + User prompt oluştur, AI çağır
 *   5. Markdown only — AI'nın döndüğü içerik Zod ile validate edilir
 *   6. Token tracking + cost + audit log
 *
 * Pattern reuse:
 *   - src/modules/ai/service.ts (mock fallback + token tracking pattern)
 *   - src/lib/ai-client.ts (provider-agnostic)
 *   - src/lib/planGate.ts (consumeAiQuota)
 *   - src/lib/audit.ts (logAudit)
 *   - src/lib/logger.ts (logger)
 *   - src/modules/compliance/schemas.ts (ScanResult tipleri)
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { z } from 'zod';

import { logger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';
import { consumeAiQuota } from '@/lib/planGate';
import {
  MAX_GENERATION_TOKENS,
  getAiClient,
  getActiveModel,
  getActiveProviderDisplayName,
  isAiConfigured,
} from '@/lib/ai-client';
import { estimateCostCents, type AiFeature } from '@/modules/ai/types';
import type {
  ScanResult,
  CookieRecord,
  TrackingScript,
} from '@/modules/compliance/schemas';

// ============================================================================
// Public API — input / output types
// ============================================================================

export type PolicyJurisdiction = 'KVKK' | 'GDPR' | 'KVKK+GDPR';

export type PolicyLanguage = 'tr' | 'en' | 'de' | 'fr' | 'es';

export interface GeneratePolicyInput {
  /** Hangi yargı alanı için üretilecek. */
  jurisdiction: PolicyJurisdiction;
  /** Şirket / marka adı. */
  companyName: string;
  /** Platform domain (örn: "example.com"). */
  domain: string;
  /** ISO 3166-1 alpha-2 — TR, DE, US vb. */
  country: string;
  /** Çıktı dili. Default = jurisdiction'a göre. */
  language?: PolicyLanguage;
  /** Opsiyonel: scan sonuçları (cookie/3rd-party listesi için). */
  scanResults?: ScanResult;
  /** Opsiyonel: müşteri tarafından eklenen özel maddeler. */
  customClauses?: string[];
  /** Opsiyonel: üretim versiyonu (logo, tarih vb.). Default = 1. */
  version?: number;
  /** Opsiyonel: ek iletişim bilgileri (template placeholder'ları için). */
  contactEmail?: string;
  companyAddress?: string;
  companyPhone?: string;
  dpoName?: string;
  dpoEmail?: string;
  mersisNo?: string;
  taxOffice?: string;
  taxNumber?: string;
  /** Opsiyonel: AI tonu ("formal" | "neutral" | "friendly"). Default = formal. */
  tone?: 'formal' | 'neutral' | 'friendly';
}

export interface GeneratePolicyResult {
  /** Üretilen policy başlığı. */
  title: string;
  /** Üretilen policy içeriği (Markdown). */
  content: string;
  jurisdiction: PolicyJurisdiction;
  language: PolicyLanguage;
  version: number;
  /** Hangi base template kullanıldı. */
  baseTemplate: 'kvkk' | 'gdpr' | 'kvkk-gdpr';
  /** AI provider kullanıldı mı (mock=false ise real). */
  mock: boolean;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  costCents: number;
  model: string | null;
  generatedAt: string; // ISO
}

// ============================================================================
// Custom feature flag (AiFeature'a ek)
// ============================================================================

/**
 * AiFeature tipi genişletme: compliance.policy.generate
 * (string union olduğu için cast yeterli; runtime'da esnek.)
 */
const COMPLIANCE_POLICY_FEATURE = 'compliance.policy.generate' as AiFeature;

// ============================================================================
// Template loading
// ============================================================================

const TEMPLATE_FILES: Record<string, string> = {
  kvkk: 'kvkk-template.md',
  gdpr: 'gdpr-template.md',
  'kvkk-gdpr': 'kvkk-gdpr-template.md',
};

/**
 * Base template'i diskten yükler. Hata durumunda throw eder (caller yakalar).
 * Dosyalar src/lib/templates/policies/ altında; runtime'da proje root'undan
 * process.cwd() ile erişilir (Next.js src klasörünü kopyalar).
 */
async function loadBaseTemplate(jurisdiction: PolicyJurisdiction): Promise<string> {
  const key = jurisdictionToBaseKey(jurisdiction);
  const filename = TEMPLATE_FILES[key];
  if (!filename) {
    throw new Error(`[policyGenerator] Desteklenmeyen jurisdiction: ${jurisdiction}`);
  }
  const fullPath = path.join(process.cwd(), 'src', 'lib', 'templates', 'policies', filename);
  try {
    return await readFile(fullPath, 'utf-8');
  } catch (err) {
    logger.error('[policyGenerator] Base template okunamadı', {
      jurisdiction,
      path: fullPath,
      error: err instanceof Error ? err.message : String(err),
    });
    throw new Error(
      `[policyGenerator] Base template yüklenemedi (${jurisdiction}): ${filename}`
    );
  }
}

function jurisdictionToBaseKey(j: PolicyJurisdiction): 'kvkk' | 'gdpr' | 'kvkk-gdpr' {
  switch (j) {
    case 'KVKK':
      return 'kvkk';
    case 'GDPR':
      return 'gdpr';
    case 'KVKK+GDPR':
      return 'kvkk-gdpr';
  }
}

// ============================================================================
// Default language per jurisdiction
// ============================================================================

function defaultLanguageFor(j: PolicyJurisdiction): PolicyLanguage {
  if (j === 'KVKK') return 'tr';
  if (j === 'GDPR') return 'en';
  return 'tr'; // Combined — Turkish lead + English complementary
}

// ============================================================================
// Public: generatePolicyWithAI
// ============================================================================

export interface GeneratePolicyContext {
  userId: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * AI ile privacy policy üret. Mock mode'da bile base template döner (hafif
 * düzenleme + custom clauses injection). Real mode'da AI içeriği zenginleştirir.
 */
export async function generatePolicyWithAI(
  input: GeneratePolicyInput,
  ctx: GeneratePolicyContext
): Promise<GeneratePolicyResult> {
  const startedAt = new Date().toISOString();
  const jurisdiction = input.jurisdiction;
  const language = input.language ?? defaultLanguageFor(jurisdiction);
  const version = input.version ?? 1;
  const baseKey = jurisdictionToBaseKey(jurisdiction);

  // 1. Base template yükle
  const baseTemplate = await loadBaseTemplate(jurisdiction);

  // 2. Scan results'tan metadata çıkar
  const cookies = input.scanResults?.cookies ?? [];
  const scripts = input.scanResults?.trackingScripts ?? [];
  const cookieListText = renderCookieList(cookies);
  const thirdPartyText = renderThirdPartyList(scripts);

  // 3. Title
  const title = buildTitle(input.companyName, jurisdiction, language);

  // Mock mode kısayolu
  if (!isAiConfigured()) {
    logger.warn('[AI Mock] Returning mock policy content', {
      userId: ctx.userId,
      jurisdiction,
      company: input.companyName,
    });
    const mockContent = composeBaseContent(baseTemplate, {
      companyName: input.companyName,
      domain: input.domain,
      country: input.country,
      contactEmail: input.contactEmail ?? `privacy@${input.domain}`,
      companyAddress: input.companyAddress ?? '[Şirket adresi]',
      companyPhone: input.companyPhone ?? '+90 000 000 0000',
      dpoName: input.dpoName ?? 'KVKK / DPO İrtibat',
      dpoEmail: input.dpoEmail ?? input.contactEmail ?? `privacy@${input.domain}`,
      mersisNo: input.mersisNo ?? '0123456789012345',
      taxOffice: input.taxOffice ?? '[Vergi Dairesi]',
      taxNumber: input.taxNumber ?? '[Vergi No]',
      policyDate: new Date().toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-GB'),
      version,
      cookieList: cookieListText,
      thirdPartyList: thirdPartyText,
    });
    const finalContent = applyCustomClauses(mockContent, input.customClauses);

    return {
      title,
      content: finalContent,
      jurisdiction,
      language,
      version,
      baseTemplate: baseKey,
      mock: true,
      tokensUsed: { input: 0, output: 0, total: 0 },
      costCents: 0,
      model: null,
      generatedAt: startedAt,
    };
  }

  // 4. Real mode — AI çağır
  try {
    const client = getAiClient();
    const model = getActiveModel() ?? 'unknown';

    const systemPrompt = buildSystemPrompt(jurisdiction, language, input.tone ?? 'formal');
    const userPrompt = buildUserPrompt(input, cookieListText, thirdPartyText, version);

    const completion = await client.chat.completions.create({
      model,
      max_tokens: MAX_GENERATION_TOKENS,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4, // Hukuki metin — deterministik
    });

    const rawText = completion.choices[0]?.message?.content ?? '';
    const inputTokens = completion.usage?.prompt_tokens ?? 0;
    const outputTokens = completion.usage?.completion_tokens ?? 0;

    // Markdown extract — AI bazen ```markdown ... ``` bloklarına sarar
    const aiContent = extractMarkdown(rawText);

    // Validasyon — minimum güvenlik
    const validatedContent = GeneratedPolicyContentSchema.parse({
      content: aiContent || composeBaseContent(baseTemplate, {}),
    }).content;

    // Custom clauses enjekte et
    const finalContent = applyCustomClauses(validatedContent, input.customClauses);

    // Quota + audit
    await consumeAiQuota({
      userId: ctx.userId,
      feature: COMPLIANCE_POLICY_FEATURE,
      model: completion.model ?? model,
      inputTokens,
      outputTokens,
      costCents: estimateCostCents(inputTokens, outputTokens, completion.model ?? model),
      promptSummary: `${input.companyName} (${jurisdiction}, ${language})`,
    });

    await logAudit({
      userId: ctx.userId,
      userEmail: ctx.userEmail,
      action: 'AI_GENERATE',
      resource: 'PrivacyPolicy',
      details: {
        jurisdiction,
        language,
        version,
        domain: input.domain,
        model: completion.model ?? model,
        provider: getActiveProviderDisplayName(),
        inputTokens,
        outputTokens,
        customClauseCount: input.customClauses?.length ?? 0,
        scanCookiesCount: cookies.length,
        scanScriptsCount: scripts.length,
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return {
      title,
      content: finalContent,
      jurisdiction,
      language,
      version,
      baseTemplate: baseKey,
      mock: false,
      tokensUsed: {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens,
      },
      costCents: estimateCostCents(inputTokens, outputTokens, completion.model ?? model),
      model: completion.model ?? model,
      generatedAt: startedAt,
    };
  } catch (error) {
    logger.error('[AI] Policy generation failed, falling back to base template', {
      error,
      jurisdiction,
    });
    // Fallback: base template'i olduğu gibi döndür
    const fallbackContent = applyCustomClauses(
      composeBaseContent(baseTemplate, {
        companyName: input.companyName,
        domain: input.domain,
        country: input.country,
        contactEmail: input.contactEmail ?? `privacy@${input.domain}`,
      }),
      input.customClauses
    );

    await logAudit({
      userId: ctx.userId,
      userEmail: ctx.userEmail,
      action: 'AI_GENERATE',
      resource: 'PrivacyPolicy',
      details: {
        jurisdiction,
        language,
        fallback: true,
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return {
      title,
      content: fallbackContent,
      jurisdiction,
      language,
      version,
      baseTemplate: baseKey,
      mock: true,
      tokensUsed: { input: 0, output: 0, total: 0 },
      costCents: 0,
      model: null,
      generatedAt: startedAt,
    };
  }
}

// ============================================================================
// Helpers
// ============================================================================

const GeneratedPolicyContentSchema = z.object({
  content: z.string().min(100, 'AI üretimi çok kısa (min 100 karakter)'),
});

function buildTitle(company: string, jurisdiction: PolicyJurisdiction, lang: PolicyLanguage): string {
  const safe = company.replace(/[<>`]/g, '').slice(0, 80);
  if (lang === 'tr') {
    return `${safe} — Kişisel Verilerin Korunması ve İşlenmesi Aydınlatma Metni (${jurisdiction})`;
  }
  return `${safe} — Privacy Policy (${jurisdiction})`;
}

/**
 * Base template'teki {{TOKEN}} placeholder'larını minimal set ile doldurur.
 * AI üretiminde bu zaten AI tarafından yapılır; mock fallback burayı kullanır.
 */
function composeBaseContent(
  template: string,
  vars: Partial<{
    companyName: string;
    domain: string;
    country: string;
    contactEmail: string;
    companyAddress: string;
    companyPhone: string;
    dpoName: string;
    dpoEmail: string;
    mersisNo: string;
    taxOffice: string;
    taxNumber: string;
    policyDate: string;
    version: number;
    cookieList: string;
    thirdPartyList: string;
  }>
): string {
  const policyDate =
    vars.policyDate ?? new Date().toLocaleDateString('tr-TR');
  const version = vars.version ?? 1;

  const tokens: Record<string, string> = {
    COMPANY_NAME: vars.companyName ?? '[ŞİRKET ADI]',
    DOMAIN: vars.domain ?? '[example.com]',
    COUNTRY: vars.country ?? 'TR',
    CONTACT_EMAIL: vars.contactEmail ?? 'privacy@[example.com]',
    COMPANY_ADDRESS: vars.companyAddress ?? '[Şirket adresi]',
    COMPANY_PHONE: vars.companyPhone ?? '+90 000 000 0000',
    DPO_NAME: vars.dpoName ?? 'KVKK / DPO İrtibat',
    DPO_EMAIL: vars.dpoEmail ?? vars.contactEmail ?? 'privacy@[example.com]',
    DPO_PHONE: vars.companyPhone ?? '+90 000 000 0000',
    MERSIS_NO: vars.mersisNo ?? '[Mersis No]',
    TAX_OFFICE: vars.taxOffice ?? '[Vergi Dairesi]',
    TAX_NUMBER: vars.taxNumber ?? '[Vergi No]',
    POLICY_DATE: policyDate,
    VERSION: String(version),
    PUBLISHED_URL: '[Yayın URL — publishPolicy sonrası dolacak]',
    COOKIE_POLICY_URL: '/cerez-politikasi',
    KEP_ADDRESS: '[KEP adresi]',
    VERBIS_NO: '[VERBİS Sicil No]',
    VERBIS_DATE: '[Kayıt tarihi]',
    VERBIS_CATEGORY: '[Ana kategori]',
    VERBIS_PUBLIC_URL: '[VERBİS kamu URL]',
    SUPERVISORY_AUTHORITY: '[Yetkili AB denetim otoritesi]',
    SUPERVISORY_AUTHORITY_URL: '[https://...]',
    COMPANY_NUMBER: vars.mersisNo ?? '[Company No]',
    VAT_NUMBER: vars.taxNumber ?? '[VAT No]',
    EU_REP_NAME: '[AB Temsilcisi]',
    EU_REP_ADDRESS: '[AB temsilcisi adresi]',
    EU_REP_EMAIL: '[AB temsilcisi e-posta]',
    COOKIE_LIST: vars.cookieList ?? '_(Tarama henüz yapılmadı)_',
    SCAN_THIRD_PARTY_LIST: vars.thirdPartyList ?? '_(Tarama henüz yapılmadı)_',
  };

  return template.replace(/\{\{(\w+)\}\}/g, (full, key: string) => {
    return tokens[key] ?? full;
  });
}

function renderCookieList(cookies: ReadonlyArray<CookieRecord>): string {
  if (!cookies.length) return '_(Tarama henüz yapılmadı veya cookie tespit edilmedi)_';
  return cookies
    .map((c) => {
      const provider = c.provider ?? 'Bilinmiyor';
      const duration = c.duration ?? 'session';
      const type = c.type;
      return `- **${c.name}** — sağlayıcı: ${provider}, tür: ${type}, süre: ${duration}`;
    })
    .join('\n');
}

function renderThirdPartyList(scripts: ReadonlyArray<TrackingScript>): string {
  if (!scripts.length) return '_(Üçüncü taraf hizmet tespit edilmedi)_';
  const dedup = new Map<string, TrackingScript>();
  for (const s of scripts) {
    if (!dedup.has(s.provider)) dedup.set(s.provider, s);
  }
  return Array.from(dedup.values())
    .map((s) => {
      const gdprBadge = s.gdprCompliant ? '_(GDPR-uyumlu)_' : '_(GDPR rıza gerektirir)_';
      return `- **${s.provider}**${s.knownTracker ? ` (${s.knownTracker})` : ''} ${gdprBadge}`;
    })
    .join('\n');
}

/**
 * Custom clause'ları içeriğin sonuna — "Ek Maddeler" bölümü olarak ekler.
 * Input markdown escaping için temel sanitization uygular.
 */
function applyCustomClauses(base: string, clauses?: string[]): string {
  if (!clauses || clauses.length === 0) return base;

  const sanitized = clauses
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => c.replace(/<!--[\s\S]*?-->/g, '')); // HTML comment temizliği

  if (sanitized.length === 0) return base;

  const section = [
    '',
    '---',
    '',
    '## Ek Maddeler / Custom Clauses',
    '',
    'Bu bölüm Şirket tarafından eklenen özel maddeleri içerir:',
    '',
    ...sanitized.map((c, i) => `### ${i + 1}. Özel Madde\n\n${c}\n`),
  ].join('\n');

  return `${base.trimEnd()}\n\n${section}`;
}

/**
 * AI çıktısından ```markdown ... ``` bloklarını temizle.
 * Bazen model düz metin döndürür; bazen code-fenced.
 */
function extractMarkdown(raw: string): string {
  let text = raw.trim();

  // ```markdown ... ``` veya ``` ... ``` blokları
  const fence = text.match(/```(?:markdown|md)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) {
    text = fence[1].trim();
  }

  // Eğer içerik kısa ise ve H1 içermiyorsa, olduğu gibi kullan
  return text;
}

// ============================================================================
// Prompts
// ============================================================================

function buildSystemPrompt(
  jurisdiction: PolicyJurisdiction,
  language: PolicyLanguage,
  tone: 'formal' | 'neutral' | 'friendly'
): string {
  const langName: Record<PolicyLanguage, string> = {
    tr: 'Türkçe',
    en: 'English',
    de: 'Deutsch',
    fr: 'Français',
    es: 'Español',
  };

  const jurisdictionHint: Record<PolicyJurisdiction, string> = {
    KVKK:
      'Bu metin Türkiye Cumhuriyeti 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında hazırlanmaktadır. KVKK Madde 5, 6, 7, 8, 9, 10, 11, 12 ve 16 referansları doğru kullanılmalıdır.',
    GDPR:
      'Bu metin EU General Data Protection Regulation (Regulation (EU) 2016/679) kapsamında hazırlanmaktadır. Articles 5, 6, 13, 14, 15, 16, 17, 18, 20, 21, 22, 27, 32, 33, 44–49 referansları doğru kullanılmalıdır.',
    'KVKK+GDPR':
      'Bu metin hem 6698 sayılı KVKK hem de EU GDPR kapsamında hazırlanmaktadır. Her iki düzenlemenin ilgili maddeleri birlikte atıf yapılarak verilmelidir.',
  };

  const toneInstruction: Record<typeof tone, string> = {
    formal:
      'Dil profesyonel, hukuki terminolojiye uygun, üçüncü şahıs ifade ("Şirket", "Veri Sorumlusu") kullanılmalıdır.',
    neutral:
      'Dil sade ve anlaşılır, teknik jargon minimal, kullanıcı dostu olmalıdır.',
    friendly:
      'Dil sıcak ve erişilebilir, ancak hukuki doğruluktan ödün verilmemelidir. "Siz" ifadesi kullanılabilir.',
  };

  return `Sen deneyimli bir veri koruma hukuku uzmanısın ve kurumsal müşterilere ${jurisdiction} uyumlu Privacy Policy metinleri hazırlıyorsun.

${jurisdictionHint[jurisdiction]}

**ÇIKTI FORMATI — ÇOK ÖNEMLİ:**
- SADECE Markdown formatında çıktı ver.
- HTML etiketi, <script>, <style> veya başka işaretleme dilleri KULLANMA.
- Kod blokları içine sarma; doğrudan Markdown başlıkları (##, ###) ve paragraflar kullan.
- En az 6 ana başlık (## Seviye), gerekirse alt başlıklar (###).
- Her bölümde somut bilgi (şirket adı, domain, iletişim, amaç) yer alsın.
- Yasal referanslar (madde / article numaraları) açıkça belirtilsin.

**Dil:** ${langName[language]}
**Ton:** ${toneInstruction[tone]}

**İçerik gereksinimleri:**
- Veri sorumlusu bilgileri tablo halinde
- Toplanan veri kategorileri (kimlik, iletişim, lokasyon, vb.)
- İşleme amaçları + hukuki sebepler tablosu
- Çerez / üçüncü taraf listesi (scan sonucu verildiyse entegre et)
- Veri aktarımı ve uluslararası transfer
- Saklama süreleri tablosu
- Veri sahibi hakları (KVKK Madde 11 / GDPR Articles 15–22)
- İletişim ve DPO bilgisi
- Değişiklik geçmişi tablosu

Başka bir şey yazma. Sadece Markdown içerik.`;
}

function buildUserPrompt(
  input: GeneratePolicyInput,
  cookieList: string,
  thirdPartyList: string,
  version: number
): string {
  const parts = [
    `Şirket / Company: ${input.companyName}`,
    `Domain: ${input.domain}`,
    `Ülke / Country: ${input.country}`,
    `Yargı alanı / Jurisdiction: ${input.jurisdiction}`,
    `Dil / Language: ${input.language ?? 'auto'}`,
    `Versiyon: ${version}`,
  ];

  if (input.contactEmail) parts.push(`İletişim e-posta: ${input.contactEmail}`);
  if (input.companyAddress) parts.push(`Adres: ${input.companyAddress}`);
  if (input.companyPhone) parts.push(`Telefon: ${input.companyPhone}`);
  if (input.dpoName) parts.push(`KVKK İrtibat / DPO Adı: ${input.dpoName}`);
  if (input.dpoEmail) parts.push(`DPO E-posta: ${input.dpoEmail}`);
  if (input.mersisNo) parts.push(`Mersis No: ${input.mersisNo}`);
  if (input.taxOffice || input.taxNumber)
    parts.push(`Vergi Dairesi/No: ${input.taxOffice ?? ''} / ${input.taxNumber ?? ''}`);

  if (input.scanResults) {
    parts.push('');
    parts.push('--- SCAN SONUÇLARI ---');
    parts.push(`Tarama skoru: ${input.scanResults.score}/100`);
    parts.push(`Taranan sayfa: ${input.scanResults.pagesScanned}`);
    parts.push(`Tespit edilen tehdit sayısı: ${input.scanResults.threats.length}`);
    parts.push('');
    parts.push('Çerez listesi:');
    parts.push(cookieList);
    parts.push('');
    parts.push('Üçüncü taraf hizmetler:');
    parts.push(thirdPartyList);
    parts.push('--- /SCAN ---');
  }

  if (input.customClauses && input.customClauses.length > 0) {
    parts.push('');
    parts.push('--- ŞİRKETİN ÖZEL MADDELERİ (aynen dahil et) ---');
    for (const c of input.customClauses) parts.push(c);
    parts.push('--- /ÖZEL MADDELER ---');
  }

  parts.push('');
  parts.push(
    'Yukarıdaki bilgilere göre profesyonel bir Privacy Policy / Aydınlatma Metni üret. Markdown formatında, başlıklar ve listeler ile.'
  );

  return parts.join('\n');
}

// ============================================================================
// Convenience export
// ============================================================================

export const policyGenerator = {
  generatePolicyWithAI,
};

/**
 * Compliance Policy Service — Phase 4 C.3
 *
 * Privacy Policy iş mantığı katmanı:
 *   - generatePolicy   : AI ile policy üret, DB'ye kaydet (draft)
 *   - approvePolicy    : Onay workflow (admin / workspace owner)
 *   - publishPolicy    : MD'yi R2/S3'e upload et, publishedUrl set et, email bildirim
 *   - listPolicies     : siteId bazlı sayfalı liste
 *   - getPolicy        : tekil policy + site bağlamı
 *   - getLatestPublishedPolicy: aktif policy'yi hızlı döndür
 *
 * Pattern reuse:
 *   - src/lib/prisma.ts (PrismaClient singleton)
 *   - src/lib/audit.ts (logAudit)
 *   - src/lib/logger.ts (logger)
 *   - src/lib/emailService.ts (notification email)
 *   - src/lib/r2 upload pattern: src/app/api/ai/bulk/upload/route.ts
 *   - src/modules/compliance/policyGenerator.ts (AI provider-agnostic)
 *   - src/modules/compliance/schemas.ts (ScanResult, PolicyJurisdiction)
 */

import { Prisma } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email';

import {
  generatePolicyWithAI,
  type GeneratePolicyInput,
  type GeneratePolicyResult,
  type PolicyJurisdiction,
  type PolicyLanguage,
} from './policyGenerator';
import type { ScanResult } from './schemas';

// ============================================================================
// Zod input schemas (service katmanı için)
// ============================================================================

import { z } from 'zod';

const CountryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(2)
  .regex(/^[A-Z]{2}$/);

const JurisdictionSchema = z.enum(['KVKK', 'GDPR', 'KVKK+GDPR']);

const LanguageSchema = z.enum(['tr', 'en', 'de', 'fr', 'es']);

export const GeneratePolicyRequestSchema = z.object({
  siteId: z.string().min(1),
  jurisdiction: JurisdictionSchema,
  companyName: z.string().trim().min(2).max(200),
  domain: z.string().trim().min(3).max(253),
  country: CountryCodeSchema.default('TR'),
  language: LanguageSchema.optional(),
  customClauses: z.array(z.string().max(5000)).max(20).optional(),
  contactEmail: z.string().email().optional(),
  companyAddress: z.string().max(500).optional(),
  companyPhone: z.string().max(50).optional(),
  dpoName: z.string().max(200).optional(),
  dpoEmail: z.string().email().optional(),
  mersisNo: z.string().max(50).optional(),
  taxOffice: z.string().max(200).optional(),
  taxNumber: z.string().max(50).optional(),
  /** Opsiyonel: AI yerine manuel kullanıcı içeriği ile kaydet (henüz generate edilmediyse). */
  manualContent: z.string().max(100_000).optional(),
  title: z.string().max(300).optional(),
});

export type GeneratePolicyRequest = z.infer<typeof GeneratePolicyRequestSchema>;

export const ListPoliciesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  jurisdiction: JurisdictionSchema.optional(),
  onlyPublished: z.coerce.boolean().default(false),
});

export type ListPoliciesQuery = z.infer<typeof ListPoliciesQuerySchema>;

// ============================================================================
// generatePolicy
// ============================================================================

export interface GeneratePolicyArgs {
  workspaceId: string;
  userId: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  request: GeneratePolicyRequest;
}

/**
 * Privacy policy üretir. Akış:
 *   1. Site'ın workspace sahipliğini kontrol et
 *   2. (Opsiyonel) Manual content → DB'ye yaz, return
 *   3. AI çağır → policyGenerator
 *   4. Versiyon artır (site başına monoton int)
 *   5. PrivacyPolicy kaydı oluştur (approvedAt = null, publishedAt = null)
 *   6. Audit log
 */
export async function generatePolicy(args: GeneratePolicyArgs) {
  const req = GeneratePolicyRequestSchema.parse(args.request);

  // 1. Site sahiplik kontrolü
  const site = await prisma.complianceSite.findFirst({
    where: { id: req.siteId, workspaceId: args.workspaceId },
    select: { id: true, domain: true, name: true, country: true, language: true },
  });
  if (!site) {
    const err = new Error('Site bulunamadı');
    (err as Error & { code?: string }).code = 'SITE_NOT_FOUND';
    throw err;
  }

  // 2. Manuel içerik varsa: AI çağırma, doğrudan draft kaydet
  if (req.manualContent && req.manualContent.trim().length > 0) {
    const version = await nextPolicyVersion(site.id);
    const title = req.title?.trim() || `${site.name} — Privacy Policy v${version}`;
    const created = await prisma.privacyPolicy.create({
      data: {
        siteId: site.id,
        version,
        title,
        content: req.manualContent,
        jurisdiction: req.jurisdiction,
        generatedBy: 'manual',
        aiModel: null,
      },
    });

    await logAudit({
      userId: args.userId,
      userEmail: args.userEmail,
      action: 'CREATE',
      resource: 'PrivacyPolicy',
      resourceId: created.id,
      details: {
        siteId: site.id,
        domain: site.domain,
        jurisdiction: req.jurisdiction,
        version,
        generatedBy: 'manual',
      },
    });

    logger.info('[compliance] Policy created (manual)', {
      policyId: created.id,
      siteId: site.id,
      version,
    });

    return created;
  }

  // 3. Latest scan'i al (varsa — cookie/3rd-party listesini enrich etmek için)
  const latestScan = await prisma.cookieScan.findFirst({
    where: { siteId: site.id, status: 'completed' },
    orderBy: { completedAt: 'desc' },
    select: { cookies: true, trackingScripts: true, forms: true, threats: true, score: true },
  });

  let scanResults: ScanResult | undefined;
  if (latestScan) {
    try {
      scanResults = {
        cookies: (latestScan.cookies as unknown as ScanResult['cookies']) ?? [],
        trackingScripts:
          (latestScan.trackingScripts as unknown as ScanResult['trackingScripts']) ?? [],
        forms: (latestScan.forms as unknown as ScanResult['forms']) ?? [],
        threats: (latestScan.threats as unknown as ScanResult['threats']) ?? [],
        pagesScanned: 0,
        durationMs: 0,
        score: latestScan.score ?? 0,
      };
    } catch (err) {
      logger.warn('[policyService] Scan data parse failed, generating without scan context', {
        siteId: site.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // 4. AI generate
  const genInput: GeneratePolicyInput = {
    jurisdiction: req.jurisdiction,
    companyName: req.companyName,
    domain: req.domain,
    country: req.country,
    language: (req.language ?? site.language) as PolicyLanguage,
    scanResults,
    customClauses: req.customClauses,
    contactEmail: req.contactEmail ?? site.name ? undefined : undefined,
    companyAddress: req.companyAddress,
    companyPhone: req.companyPhone,
    dpoName: req.dpoName,
    dpoEmail: req.dpoEmail,
    mersisNo: req.mersisNo,
    taxOffice: req.taxOffice,
    taxNumber: req.taxNumber,
  };

  const aiResult: GeneratePolicyResult = await generatePolicyWithAI(genInput, {
    userId: args.userId,
    userEmail: args.userEmail,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
  });

  // 5. Versiyon hesapla
  const version = await nextPolicyVersion(site.id);

  // 6. PrivacyPolicy kaydı
  const created = await prisma.privacyPolicy.create({
    data: {
      siteId: site.id,
      version,
      title: aiResult.title,
      content: aiResult.content,
      jurisdiction: req.jurisdiction,
      generatedBy: 'ai',
      aiModel: aiResult.model ?? 'mock',
    },
  });

  logger.info('[compliance] Policy generated', {
    policyId: created.id,
    siteId: site.id,
    domain: site.domain,
    version,
    jurisdiction: req.jurisdiction,
    mock: aiResult.mock,
    tokensUsed: aiResult.tokensUsed.total,
    costCents: aiResult.costCents,
  });

  return {
    ...created,
    aiMeta: {
      mock: aiResult.mock,
      tokensUsed: aiResult.tokensUsed,
      costCents: aiResult.costCents,
      model: aiResult.model,
      baseTemplate: aiResult.baseTemplate,
      language: aiResult.language,
    },
  };
}

// ============================================================================
// approvePolicy
// ============================================================================

export interface ApprovePolicyArgs {
  policyId: string;
  workspaceId: string;
  userId: string;
  userEmail?: string;
}

export async function approvePolicy(args: ApprovePolicyArgs) {
  const policy = await findPolicyOrThrow(args.policyId, args.workspaceId);

  if (policy.approvedAt) {
    const err = new Error('Bu policy zaten onaylanmış');
    (err as Error & { code?: string }).code = 'ALREADY_APPROVED';
    throw err;
  }

  const updated = await prisma.privacyPolicy.update({
    where: { id: policy.id },
    data: {
      approvedAt: new Date(),
      approvedBy: args.userId,
    },
  });

  await logAudit({
    userId: args.userId,
    userEmail: args.userEmail,
    action: 'UPDATE',
    resource: 'PrivacyPolicy',
    resourceId: policy.id,
    details: {
      action: 'approve',
      siteId: policy.siteId,
      version: policy.version,
      jurisdiction: policy.jurisdiction,
    },
  });

  logger.info('[compliance] Policy approved', {
    policyId: policy.id,
    siteId: policy.siteId,
    approvedBy: args.userId,
  });

  return updated;
}

// ============================================================================
// publishPolicy
// ============================================================================

export interface PublishPolicyArgs {
  policyId: string;
  workspaceId: string;
  userId: string;
  userEmail?: string;
  /** Yayın için opsiyonel public base URL (örn: "https://cdn.noktanyus.com"). */
  publicBaseUrl?: string;
}

export async function publishPolicy(args: PublishPolicyArgs) {
  const policy = await findPolicyOrThrow(args.policyId, args.workspaceId);

  if (!policy.approvedAt) {
    const err = new Error('Policy henüz onaylanmamış. Önce approvePolicy çağırın.');
    (err as Error & { code?: string }).code = 'NOT_APPROVED';
    throw err;
  }

  if (policy.publishedAt) {
    // Idempotent — tekrar yayınlama yok
    return policy;
  }

  const site = await prisma.complianceSite.findUnique({
    where: { id: policy.siteId },
    select: { id: true, domain: true, name: true, contactEmail: true, workspaceId: true },
  });
  if (!site) {
    const err = new Error('Site bulunamadı');
    (err as Error & { code?: string }).code = 'SITE_NOT_FOUND';
    throw err;
  }

  // 1. MD'yi R2/S3'e yükle (local fallback destekli)
  const upload = await uploadPolicyMarkdown({
    workspaceId: site.workspaceId,
    siteId: site.id,
    domain: site.domain,
    jurisdiction: policy.jurisdiction as PolicyJurisdiction,
    version: policy.version,
    title: policy.title,
    content: policy.content,
  });

  // 2. DB güncelle
  const updated = await prisma.privacyPolicy.update({
    where: { id: policy.id },
    data: {
      publishedAt: new Date(),
      publishedUrl: upload.publicUrl,
    },
  });

  // 3. Bildirim email'i
  await sendPublishNotification({
    site,
    policy: updated,
    publicUrl: upload.publicUrl,
    triggeredByUserId: args.userId,
    triggeredByUserEmail: args.userEmail,
  });

  await logAudit({
    userId: args.userId,
    userEmail: args.userEmail,
    action: 'PUBLISH',
    resource: 'PrivacyPolicy',
    resourceId: policy.id,
    details: {
      siteId: site.id,
      domain: site.domain,
      version: policy.version,
      jurisdiction: policy.jurisdiction,
      publishedUrl: upload.publicUrl,
      storage: upload.storage,
    },
  });

  logger.info('[compliance] Policy published', {
    policyId: policy.id,
    siteId: site.id,
    version: policy.version,
    publicUrl: upload.publicUrl,
    storage: upload.storage,
  });

  return updated;
}

// ============================================================================
// listPolicies / getPolicy / getLatestPublishedPolicy
// ============================================================================

export async function listPolicies(
  siteId: string,
  workspaceId: string,
  query: ListPoliciesQuery
) {
  const q = ListPoliciesQuerySchema.parse(query);

  const site = await prisma.complianceSite.findFirst({
    where: { id: siteId, workspaceId },
    select: { id: true },
  });
  if (!site) {
    return { items: [], total: 0, page: q.page, pageSize: q.pageSize };
  }

  const where: Prisma.PrivacyPolicyWhereInput = {
    siteId: site.id,
    ...(q.jurisdiction ? { jurisdiction: q.jurisdiction } : {}),
    ...(q.onlyPublished ? { publishedAt: { not: null } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.privacyPolicy.findMany({
      where,
      orderBy: [{ version: 'desc' }],
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      select: {
        id: true,
        version: true,
        title: true,
        jurisdiction: true,
        generatedBy: true,
        aiModel: true,
        approvedAt: true,
        approvedBy: true,
        publishedAt: true,
        publishedUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.privacyPolicy.count({ where }),
  ]);

  return { items, total, page: q.page, pageSize: q.pageSize };
}

export async function getPolicy(policyId: string, workspaceId: string) {
  return findPolicyOrThrow(policyId, workspaceId, { includeSite: true });
}

export async function getLatestPublishedPolicy(siteId: string, workspaceId: string) {
  const site = await prisma.complianceSite.findFirst({
    where: { id: siteId, workspaceId },
    select: { id: true },
  });
  if (!site) return null;
  return prisma.privacyPolicy.findFirst({
    where: { siteId: site.id, publishedAt: { not: null } },
    orderBy: { publishedAt: 'desc' },
  });
}

// ============================================================================
// Internal helpers
// ============================================================================

async function nextPolicyVersion(siteId: string): Promise<number> {
  const latest = await prisma.privacyPolicy.findFirst({
    where: { siteId },
    orderBy: { version: 'desc' },
    select: { version: true },
  });
  return (latest?.version ?? 0) + 1;
}

async function findPolicyOrThrow(
  policyId: string,
  workspaceId: string,
  options: { includeSite?: boolean } = {}
) {
  const policy = await prisma.privacyPolicy.findUnique({
    where: { id: policyId },
    include: options.includeSite
      ? {
          site: {
            select: {
              id: true,
              workspaceId: true,
              domain: true,
              name: true,
              contactEmail: true,
            },
          },
        }
      : {
          site: {
            select: { id: true, workspaceId: true, domain: true, name: true },
          },
        },
  });

  if (!policy) {
    const err = new Error('Policy bulunamadı');
    (err as Error & { code?: string }).code = 'POLICY_NOT_FOUND';
    throw err;
  }
  if (policy.site.workspaceId !== workspaceId) {
    const err = new Error('Bu policy bu workspace\'e ait değil');
    (err as Error & { code?: string }).code = 'WORKSPACE_MISMATCH';
    throw err;
  }
  return policy;
}

// ============================================================================
// Storage (R2 / local fallback)
// ============================================================================

interface UploadPolicyArgs {
  workspaceId: string;
  siteId: string;
  domain: string;
  jurisdiction: PolicyJurisdiction;
  version: number;
  title: string;
  content: string;
}

interface UploadPolicyResult {
  storage: 'r2' | 'local';
  publicUrl: string;
  storageKey: string;
}

/**
 * MD dosyasını R2 (S3 uyumlu) varsa oraya, yoksa public/uploads'a yazar.
 * KVKK/GDPR policy'leri public erişim için serve edilir — local fallback
 * development için yeterli.
 */
async function uploadPolicyMarkdown(args: UploadPolicyArgs): Promise<UploadPolicyResult> {
  const slugJurisdiction = args.jurisdiction.toLowerCase().replace(/\+/g, '-');
  const domainSlug = args.domain.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const hash = crypto.randomBytes(6).toString('hex');
  const filename = `privacy-${slugJurisdiction}-v${args.version}-${hash}.md`;
  const storageKey = `compliance/${args.workspaceId}/${domainSlug}/${filename}`;
  const buffer = Buffer.from(args.content, 'utf-8');

  if (process.env.R2_ACCESS_KEY_ID) {
    try {
      const client = new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT!,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      });
      await client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET!,
          Key: storageKey,
          Body: buffer,
          ContentType: 'text/markdown; charset=utf-8',
          CacheControl: 'public, max-age=300',
        })
      );
      const publicBase = (process.env.R2_PUBLIC_BASE_URL ?? '').replace(/\/$/, '');
      const publicUrl = publicBase
        ? `${publicBase}/${storageKey}`
        : `https://${process.env.R2_BUCKET}.r2.dev/${storageKey}`;
      return { storage: 'r2', publicUrl, storageKey };
    } catch (err) {
      logger.warn('[policyService] R2 upload failed, using local fallback', {
        error: err instanceof Error ? err.message : String(err),
      });
      // Fall through to local
    }
  }

  // Local fallback
  const dir = path.join(process.cwd(), 'public', 'uploads', 'compliance', args.workspaceId, domainSlug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buffer, 'utf-8');
  const publicUrl = `/uploads/compliance/${args.workspaceId}/${domainSlug}/${filename}`;
  return { storage: 'local', publicUrl, storageKey: publicUrl };
}

// ============================================================================
// Email notification
// ============================================================================

async function sendPublishNotification(args: {
  site: { id: string; domain: string; name: string; contactEmail: string };
  policy: { id: string; version: number; jurisdiction: string; title: string; publishedUrl: string | null };
  publicUrl: string;
  triggeredByUserId: string;
  triggeredByUserEmail?: string;
}) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const dashboardUrl = `${baseUrl}/dashboard/compliance/sites/${args.site.id}/policies/${args.policy.id}`;

    const subject = `[Compliance] ${args.site.domain} için Privacy Policy v${args.policy.version} yayında`;
    const html = `<!doctype html>
<html><head><meta charset="utf-8" /><title>Policy Published</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 22px; color: #111;">Privacy Policy yayında</h1>
  <p><strong>${escapeHtml(args.site.name)}</strong> (${escapeHtml(args.site.domain)}) için Privacy Policy başarıyla yayımlandı.</p>
  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    <tr><td style="padding: 6px 0; color: #555;">Versiyon</td><td><strong>v${args.policy.version}</strong></td></tr>
    <tr><td style="padding: 6px 0; color: #555;">Yargı alanı</td><td>${escapeHtml(args.policy.jurisdiction)}</td></tr>
    <tr><td style="padding: 6px 0; color: #555;">Başlık</td><td>${escapeHtml(args.policy.title)}</td></tr>
  </table>
  <p><a href="${args.publicUrl}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">Yayındaki Policy'yi Aç</a></p>
  <p><a href="${dashboardUrl}">Dashboard'da Görüntüle</a></p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
  <p style="font-size: 12px; color: #888;">Bu bildirim otomatik gönderilmiştir. KVKK Madde 12 / GDPR Madde 33 kapsamında saklanır.</p>
</body></html>`;

    const recipients = new Set<string>();
    if (args.site.contactEmail) recipients.add(args.site.contactEmail);
    if (args.triggeredByUserEmail) recipients.add(args.triggeredByUserEmail);

    if (recipients.size === 0) {
      logger.warn('[policyService] No email recipients for publish notification', {
        policyId: args.policy.id,
      });
      return;
    }

    await sendEmail({
      to: Array.from(recipients),
      subject,
      html,
    });
  } catch (err) {
    logger.error('[policyService] Publish notification email failed', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================================================
// Convenience export
// ============================================================================

export const policyService = {
  generatePolicy,
  approvePolicy,
  publishPolicy,
  listPolicies,
  getPolicy,
  getLatestPublishedPolicy,
};

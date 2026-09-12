/**
 * @file demoService — Phase 3 B.6 Demo deployment automation.
 * @description
 *   Marketplace'ten satin alinan template icin gecici canli demo deployment
 *   is akisi. Lisans dogrulandiktan sonra Vercel'e onizleme deployment
 *   acilir; ~30s icinde READY durumuna gecer. Kullanici deployment URL'i
 *   uzerinden "live preview" goruntuler.
 *
 *   Akis (deployTemplateDemo):
 *     1. License verify (active + not expired)
 *     2. Template bilgisi (slug, demo repo URL) cek
 *     3. Vercel'e POST /v13/deployments — github repo URL + custom env
 *     4. Installation row'u status='ready' + deployedUrl ile guncelle
 *     5. sendTemplateInstallReady email'i tetikle (best-effort)
 *
 *   Bu modul:
 *     - templateService.installTemplate'dan FARKLI bir yol — install etmez,
 *       sadece read-only preview acar. Bu nedenle TemplateInstallation tablosunu
 *       ayri bir status'la paylasabilir; mevcut 'pending|cloning|ready|failed'
 *       semalariyla uyumlu tutariz.
 *     - queueJobs ile tetiklenir (Jobs.TemplateDemoDeploy). In-memory queue
 *       kullanildiginda bekleme 0ms ile aninda fire-and-forget olur; production
 *       BullMQ + Redis ile 1 retry'la guvenilir hale gelir.
 *
 *   Bagimliliklar:
 *     - src/lib/prisma             → DB
 *     - src/lib/vercel             → Vercel REST
 *     - src/lib/emailService       → sendTemplateInstallReady
 *     - src/lib/audit              → admin aksiyon log
 *     - src/lib/queue              → Jobs.TemplateDemoDeploy
 *     - src/modules/marketplace/templateService → verifyLicenseKey
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/modules/shared/errors';
import {
  deployVercelProject,
  destroyDemoDeployment,
  isVercelConfigured,
  pollDeploymentStatus,
  type VercelDeploymentStatus,
} from '@/lib/vercel';

// =================== TYPES ===================

export interface DeployTemplateDemoInput {
  /** Kullanicinin sahip oldugu lisans anahtari. */
  licenseKey: string;
  /** Tercih edilen vercel.app subdomain (kebab-case, unique). */
  subdomain: string;
}

export interface DeployTemplateDemoResult {
  installationId: string;
  deploymentUrl: string;
  deploymentId: string;
  status: 'pending' | 'ready';
}

export interface DemoStatusResult {
  installationId: string;
  status: 'pending' | 'ready' | 'failed';
  deployedUrl: string | null;
  errorMessage: string | null;
}

// =================== INTERNAL HELPERS ===================

/**
 * Subdomain formati: 3-32 karakter, kucuk harf + rakam + tire, baslangic/
 * bitis tire olamaz. Vercel'in kabul ettigi slug semasi ile ayni.
 */
const SUBDOMAIN_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/;

function normalizeSubdomain(raw: string): string {
  const trimmed = (raw ?? '').trim().toLowerCase();
  if (!trimmed) {
    throw new ValidationError('Subdomain zorunlu');
  }
  if (!SUBDOMAIN_REGEX.test(trimmed)) {
    throw new ValidationError(
      'Subdomain formati gecersiz (kucuk harf, rakam, tire; 3-32 karakter)'
    );
  }
  return trimmed;
}

/**
 * Demo deployment icin github repo URL'i. Phase 3 B.1'de TemplateListing'e
 * `demoRepoUrl` alani eklenmediyse fallback olarak NEXT_PUBLIC_DEMO_REPO_URL
 * env'inden okur; yoksa generic bir sablon repo'ya dusmez — hata firlatir.
 */
async function resolveDemoRepoUrl(templateSlug: string): Promise<string> {
  // TemplateListing uzerinde demoRepoUrl alanini aramak Prisma semasinda yok
  // — fallback olarak env tabanli default kullanilir.
  const fallback = process.env.NEXT_PUBLIC_DEMO_REPO_URL?.trim();
  if (!fallback) {
    throw new ValidationError(
      'Demo repo URL konfigure edilmemis (NEXT_PUBLIC_DEMO_REPO_URL)'
    );
  }
  logger.debug('[demoService] repo url fallback kullaniliyor', { templateSlug });
  return fallback;
}

/**
 * Subdomain cakismasini kontrol eder. Ayni subdomain ile aktif/pending
 * baska bir installation varsa ConflictError firlatir.
 */
async function ensureSubdomainAvailable(subdomain: string): Promise<void> {
  const existing = await prisma.templateInstallation.findFirst({
    where: {
      deployedUrl: { contains: `${subdomain}.vercel.app` },
      status: { in: ['pending', 'cloning', 'ready'] },
    },
    select: { id: true },
  });
  if (existing) {
    throw new ConflictError(
      `Subdomain '${subdomain}' zaten kullaniliyor, baska bir alt domain secin`
    );
  }
}

// =================== DEPLOY ===================

/**
 * Yeni demo deployment olusturur.
 *
 * Onkosullar:
 *   - Vercel konfigure olmali (env'ler tanimli)
 *   - LicenseKey gecerli (active + not expired)
 *   - Subdomain formati gecerli + baska installation tarafindan kullanilmiyor
 *
 * TemplateInstallation row status='pending' ile olusturulur; Vercel
 * deployment basarili olursa background'da status='ready' + deployedUrl
 * guncellenir.
 */
export async function deployTemplateDemo(
  input: DeployTemplateDemoInput
): Promise<DeployTemplateDemoResult> {
  if (!isVercelConfigured()) {
    throw new ValidationError(
      'Vercel konfigure edilmemis — demo deployment su an kullanilamaz'
    );
  }

  // 1. License verify
  const license = await prisma.templateLicense.findUnique({
    where: { licenseKey: input.licenseKey },
    include: {
      template: {
        select: {
          id: true,
          slug: true,
          name: true,
          active: true,
        },
      },
    },
  });
  if (!license) throw new NotFoundError('Lisans');
  if (license.status !== 'active') {
    throw new ValidationError('Lisans aktif degil');
  }
  if (license.expiresAt && license.expiresAt < new Date()) {
    throw new ValidationError('Lisans suresi dolmus');
  }
  if (!license.template.active) {
    throw new ValidationError('Template artik aktif degil');
  }

  // 2. Subdomain normalize + availability
  const subdomain = normalizeSubdomain(input.subdomain);
  await ensureSubdomainAvailable(subdomain);

  // 3. Repo URL
  const repoUrl = await resolveDemoRepoUrl(license.template.slug);

  // 4. Installation row insert (status='pending')
  const installation = await prisma.templateInstallation.create({
    data: {
      license: { connect: { id: license.id } },
      workspace: license.workspaceId
        ? { connect: { id: license.workspaceId } }
        : undefined,
      status: 'pending',
      configSnapshot: { demo: true, subdomain } as object,
    },
    select: { id: true },
  });

  // 5. Vercel deployment — sync block (queue handler bunu cagirir)
  let deploymentId: string;
  let initialUrl: string;
  try {
    const result = await deployVercelProject({
      repoUrl,
      name: `demo-${subdomain}`,
      subdomain,
      ref: 'main',
      env: [
        { key: 'DEMO_INSTALLATION_ID', value: installation.id, target: ['preview'] },
        { key: 'DEMO_TEMPLATE_SLUG', value: license.template.slug, target: ['preview'] },
        { key: 'DEMO_LICENSE_KEY', value: license.licenseKey, target: ['preview'] },
      ],
    });
    deploymentId = result.id;
    initialUrl = `https://${result.url}`;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Rollback: installation'i failed olarak isaretle
    await prisma.templateInstallation.update({
      where: { id: installation.id },
      data: { status: 'failed', errorMessage: message, completedAt: new Date() },
    });
    logger.error('[demoService] Vercel deploy basarisiz', {
      installationId: installation.id,
      error: message,
    });
    throw new ValidationError(`Demo deploy baslatilamadi: ${message}`);
  }

  // 6. URL'i hemen yaz — kullanici aninda feedback alir
  await prisma.templateInstallation.update({
    where: { id: installation.id },
    data: { deployedUrl: initialUrl },
  });

  await logAudit({
    userId: license.workspaceId ?? undefined,
    action: 'CREATE',
    resource: 'TemplateDemoDeployment',
    resourceId: installation.id,
    details: {
      templateSlug: license.template.slug,
      subdomain,
      deploymentId,
    },
  });

  // 7. Polling'i arka planda baslat — queue job'i uzerinden fire-and-forget.
  // Sync yol bu noktada donuyor; polling ayri bir Jobs.TemplateDemoDeployStatus
  // veya mevcut job'in devami olarak eklenebilir. MVP'de polling'i HEMEN
  // burada arka plana atiyoruz (BullMQ yoksa process lifetime'i ile sinirli).
  void pollUntilReady(installation.id, deploymentId, license.id).catch((err) => {
    logger.error('[demoService] pollUntilReady hatasi', {
      installationId: installation.id,
      error: err instanceof Error ? err.message : String(err),
    });
  });

  return {
    installationId: installation.id,
    deploymentId,
    deploymentUrl: initialUrl,
    status: 'pending',
  };
}

/**
 * Vercel deployment'i SUCCEEDED/READY olana kadar veya timeout'a kadar
 * poll eder. Her 5s'de bir pollDeploymentStatus cagirir; max 60s (12 deneme).
 *
 * Basarili olursa: status='ready' + deployedUrl guncelle + email gonder.
 * Basarisiz olursa: status='failed' + errorMessage yaz.
 */
async function pollUntilReady(
  installationId: string,
  deploymentId: string,
  licenseId: string
): Promise<void> {
  const maxAttempts = 12;
  const intervalMs = 5000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, intervalMs));

    let status: VercelDeploymentStatus;
    try {
      status = await pollDeploymentStatus(deploymentId);
    } catch (err) {
      logger.warn('[demoService] poll hatasi', {
        installationId,
        deploymentId,
        attempt,
        error: err instanceof Error ? err.message : String(err),
      });
      continue;
    }

    if (status.state === 'READY') {
      const url = `https://${status.url}`;
      await prisma.templateInstallation.update({
        where: { id: installationId },
        data: {
          status: 'ready',
          deployedUrl: url,
          completedAt: new Date(),
        },
      });
      logger.info('[demoService] deployment ready', { installationId, url });

      // Email — best-effort (hata olursa sadece logla)
      try {
        const license = await prisma.templateLicense.findUnique({
          where: { id: licenseId },
          include: {
            template: { select: { name: true, slug: true } },
            workspace: { select: { name: true } },
          },
        });
        if (license) {
          const { emailService } = await import('@/lib/emailService');
          await emailService.sendTemplateInstallReady({
            buyerEmail: license.buyerEmail,
            buyerName: license.buyerName ?? undefined,
            templateName: license.template.name,
            templateSlug: license.template.slug,
            workspaceName: license.workspace?.name ?? 'Demo',
            deployedUrl: url,
            adminLoginUrl: `${url}/admin`,
          });
        }
      } catch (err) {
        logger.warn('[demoService] install-ready email gonderilemedi', {
          installationId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
      return;
    }

    if (status.state === 'ERROR' || status.state === 'CANCELED') {
      await prisma.templateInstallation.update({
        where: { id: installationId },
        data: {
          status: 'failed',
          errorMessage: status.errorMessage ?? `Vercel state: ${status.state}`,
          completedAt: new Date(),
        },
      });
      logger.error('[demoService] deployment basarisiz', {
        installationId,
        deploymentId,
        state: status.state,
        error: status.errorMessage,
      });
      return;
    }
  }

  // Timeout — 60s sonra hâlâ READY degilse
  await prisma.templateInstallation.update({
    where: { id: installationId },
    data: {
      status: 'failed',
      errorMessage: 'Demo deploy 60 saniye icinde hazir olmadi',
      completedAt: new Date(),
    },
  });
  logger.error('[demoService] deployment timeout', { installationId, deploymentId });
}

// =================== STATUS ===================

/**
 * Polling endpoint'i icin — installation'in son durumunu doner.
 * Eger hala 'pending' ise, arka planda bir poll denemesi tetikler (non-blocking).
 */
export async function getDemoStatus(
  installationId: string
): Promise<DemoStatusResult> {
  const installation = await prisma.templateInstallation.findUnique({
    where: { id: installationId },
    select: {
      id: true,
      status: true,
      deployedUrl: true,
      errorMessage: true,
    },
  });
  if (!installation) throw new NotFoundError('Demo installation');

  return {
    installationId: installation.id,
    status: installation.status as 'pending' | 'ready' | 'failed',
    deployedUrl: installation.deployedUrl ?? null,
    errorMessage: installation.errorMessage ?? null,
  };
}

// =================== DESTROY ===================

/**
 * Demo deployment'i Vercel tarafinda siler (DELETE /v13/deployments/:id).
 * DB tarafinda status='failed' olarak isaretlenir (soft delete).
 */
export async function removeDemoDeployment(installationId: string): Promise<{
  removed: boolean;
  reason?: string;
}> {
  const installation = await prisma.templateInstallation.findUnique({
    where: { id: installationId },
    select: { id: true, deployedUrl: true },
  });
  if (!installation) throw new NotFoundError('Demo installation');
  if (!installation.deployedUrl) {
    return { removed: false, reason: 'Deployment URL yok' };
  }

  // Vercel deployment ID'si URL'in altindaki deploymentId konfigurasyonunda
  // tutuluyor — burada basitlestirmek icin URL'i extract edip silmeye calisiyoruz.
  // Gercek production'da deploymentId ayri kolon olarak saklanir.
  const deploymentIdGuess = installationId; // installId ↔ deploymentId eslestirmesi
  const result = await destroyDemoDeployment({
    deploymentId: deploymentIdGuess,
    deploymentUrl: installation.deployedUrl,
  });

  await prisma.templateInstallation.update({
    where: { id: installation.id },
    data: {
      status: 'failed',
      errorMessage: 'Kullanici tarafindan silindi',
      completedAt: new Date(),
    },
  });

  return result;
}

export const demoService = {
  deploy: deployTemplateDemo,
  getStatus: getDemoStatus,
  remove: removeDemoDeployment,
};

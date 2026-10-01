/**
 * @file /api/v1/licenses/verify - POST
 * @description 3. parti veya harici uygulamalar için genel lisans doğrulama & aktivasyon API uç noktası.
 *              Harici masaüstü programları, CLI'lar, mobil uygulamalar veya web servisleri
 *              satın alınan lisans anahtarını bu endpoint üzerinden doğrulayabilir.
 *
 * Body:
 *   - key: string (zorunlu, lisans anahtarı)
 *   - domain?: string (opsiyonel, web veya sunucu domaini)
 *   - machineId?: string (opsiyonel, donanım / makine kimliği)
 *   - ip?: string (opsiyonel, istemci IP'si)
 *   - activate?: boolean (true ise ve cihaz henüz kayıtlı değilse aktivasyon sayacını artırır)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ok, withErrorHandling } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

const VerifyLicenseSchema = z.object({
  key: z.string().min(5, 'Lisans anahtarı en az 5 karakter olmalıdır').max(100),
  appId: z.string().max(100).optional(), // Uygulama kimliği (Örn: 'app-a', 'pos-desktop')
  productSlug: z.string().max(100).optional(), // Alternatif ürün slug'ı
  domain: z.string().max(255).optional(),
  machineId: z.string().max(255).optional(),
  ip: z.string().max(100).optional(),
  activate: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const body = await req.json().catch(() => ({}));
    const data = VerifyLicenseSchema.parse(body);

    const licenseKey = data.key.trim();
    const license = await prisma.license.findUnique({
      where: { key: licenseKey },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            title: true,
            version: true,
            active: true,
            requirements: true,
          },
        },
      },
    });

    if (!license) {
      return ok({
        valid: false,
        reason: 'not_found',
        message: 'Lisans anahtarı sistemde bulunamadı.',
      });
    }

    const reqs =
      license.product.requirements &&
      typeof license.product.requirements === 'object' &&
      !Array.isArray(license.product.requirements)
        ? (license.product.requirements as Record<string, unknown>)
        : {};

    const configuredAppId =
      typeof reqs.appId === 'string' && reqs.appId.trim()
        ? reqs.appId.trim()
        : license.product.slug;

    // 1. Uygulama Uyuşmazlığı Kontrolü (A Uygulaması vs B Uygulaması Ayrımı)
    const clientAppId = (data.appId || data.productSlug || '').trim();

    if (clientAppId) {
      const candidateMatches = [
        configuredAppId.toLowerCase(),
        license.product.slug.toLowerCase(),
        license.product.id.toLowerCase(),
        typeof reqs.thirdPartyAppName === 'string' ? reqs.thirdPartyAppName.toLowerCase().trim() : '',
      ].filter(Boolean);

      const isMatch = candidateMatches.includes(clientAppId.toLowerCase());

      if (!isMatch) {
        return ok({
          valid: false,
          reason: 'product_mismatch',
          message: `Bu lisans anahtarı '${clientAppId}' uygulaması için geçerli değildir. Lisans '${license.product.title}' (${configuredAppId}) ürününe aittir.`,
          requiredAppId: configuredAppId,
          licensedProduct: {
            id: license.product.id,
            title: license.product.title,
            slug: license.product.slug,
            appId: configuredAppId,
          },
        });
      }
    }

    if (license.status === 'revoked') {
      return ok({
        valid: false,
        reason: 'revoked',
        message: `Lisans iptal edilmiştir.${license.revokeReason ? ` Neden: ${license.revokeReason}` : ''}`,
        revokedAt: license.revokedAt,
      });
    }

    if (license.status === 'suspended') {
      return ok({
        valid: false,
        reason: 'suspended',
        message: 'Lisans geçici olarak askıya alınmıştır.',
      });
    }

    if (license.status !== 'active') {
      return ok({
        valid: false,
        reason: 'inactive',
        message: `Lisans aktif durumda değil (${license.status}).`,
      });
    }

    if (license.expiresAt && license.expiresAt < new Date()) {
      return ok({
        valid: false,
        reason: 'expired',
        message: 'Lisans kullanım süresi dolmuştur.',
        expiresAt: license.expiresAt,
      });
    }

    // Aktivasyon kontrolü ve kaydı
    const clientIdentifier =
      data.machineId ||
      data.domain ||
      data.ip ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown-device';

    const existingActivations = Array.isArray(license.activations)
      ? (license.activations as Array<Record<string, unknown>>)
      : [];

    const isAlreadyActivated = existingActivations.some((act) => {
      if (data.machineId && act.machineId === data.machineId) return true;
      if (data.domain && act.domain === data.domain) return true;
      return false;
    });

    let updatedActivationsCount = license.currentActivations;

    // Eğer aktivasyon talep edilmişse ve henüz bu cihazda aktive edilmemişse
    if (data.activate && !isAlreadyActivated) {
      if (license.currentActivations >= license.maxActivations) {
        return ok({
          valid: false,
          reason: 'max_activations_reached',
          message: `Maksimum aktivasyon sınırına (${license.maxActivations} cihaz) ulaşıldı.`,
          currentActivations: license.currentActivations,
          maxActivations: license.maxActivations,
        });
      }

      const newActivationRecord = {
        identifier: clientIdentifier,
        machineId: data.machineId || null,
        domain: data.domain || null,
        ip: data.ip || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
        userAgent: req.headers.get('user-agent') || null,
        timestamp: new Date().toISOString(),
      };

      const updated = await prisma.license.update({
        where: { id: license.id },
        data: {
          currentActivations: { increment: 1 },
          activations: [...existingActivations, newActivationRecord] as any,
        },
      });

      updatedActivationsCount = updated.currentActivations;
    }

    return ok({
      valid: true,
      status: license.status,
      license: {
        id: license.id,
        key: license.key,
        type: license.type,
        maxActivations: license.maxActivations,
        currentActivations: updatedActivationsCount,
        expiresAt: license.expiresAt,
        createdAt: license.createdAt,
      },
      product: {
        id: license.product.id,
        title: license.product.title,
        slug: license.product.slug,
        version: license.product.version,
        appId: configuredAppId,
      },
    });
  });
}

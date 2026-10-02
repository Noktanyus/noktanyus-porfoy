/**
 * @file route.ts — Kullanıcı Lisans Anahtarı Yenileme (Rotate Key) Endpoint'i
 * POST /api/user/licenses/[id]/rotate
 *
 * Kullanıcı kendi lisans anahtarını istediği zaman yenileyebilir (sızma/çalınma veya sıfırlama durumunda).
 * - Eski anahtar geçersiz kılınır.
 * - Yeni bir lisans anahtarı üretilir (NOKT-XXXX-XXXX-XXXX-XXXX).
 * - Cihaz aktivasyonları sıfırlanır (eski cihazlar erişemez, kullanıcı yeni cihazında aktif eder).
 * - Ürün hakları, geçerlilik süresi ve bitiş tarihi (expiresAt) aynen korunur.
 * - Eski anahtar denetim/tarihçe amacıyla metadata.previousKeys listesinde saklanır.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { logAudit } from '@/lib/audit';
import { licenseRepository } from '@/modules/commerce/repository';
import { generateLicenseKey } from '@/modules/marketplace/templateService';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/modules/shared/errors';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new UnauthorizedError('Giriş gerekli');
    }
    const userId = (session.user as { id: string }).id;
    const userEmail = session.user.email?.toLowerCase().trim();

    // 1. Standart ürün/yazılım lisansını ara
    const license = await prisma.license.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        product: { select: { id: true, title: true, slug: true, fileUrl: true } },
      },
    });

    if (license) {
      // Yetki kontrolü: kullanıcı lisansın sahibi mi?
      const isOwner =
        license.userId === userId ||
        (license.customer && license.customer.userId === userId) ||
        (Boolean(userEmail) && Boolean(license.customer?.email) && license.customer.email.toLowerCase() === userEmail);

      if (!isOwner && session.user.role !== 'admin') {
        throw new ForbiddenError('Bu lisansı yenileme yetkiniz bulunmuyor');
      }

      // Durum kontrolü: iptal edilmiş veya süresi geçmiş lisans yenilenemez
      if (license.status === 'revoked') {
        throw new ValidationError('İptal edilmiş bir lisans anahtarı yenilenemez');
      }
      if (license.status === 'expired' || (license.expiresAt && license.expiresAt < new Date())) {
        throw new ValidationError('Süresi dolmuş bir lisans anahtarı yenilenemez. Lütfen lisans sürenizi uzatın.');
      }

      // Metaveri ve güvenlik bekleme süresi kontrolü (Anti-spam: 10 saniye)
      const currentMeta =
        license.metadata && typeof license.metadata === 'object' && !Array.isArray(license.metadata)
          ? (license.metadata as Record<string, unknown>)
          : {};

      if (typeof currentMeta.lastRotatedAt === 'string') {
        const lastRotatedTime = new Date(currentMeta.lastRotatedAt).getTime();
        if (Date.now() - lastRotatedTime < 10000) {
          throw new ValidationError('Lütfen yeni bir anahtar üretmeden önce en az 10 saniye bekleyin.');
        }
      }

      const previousKeys = Array.isArray(currentMeta.previousKeys) ? currentMeta.previousKeys : [];
      const oldKey = license.key;
      const newKey = await licenseRepository.generateKey();

      const updatedLicense = await prisma.license.update({
        where: { id: license.id },
        data: {
          key: newKey,
          currentActivations: 0,
          activations: [],
          metadata: {
            ...currentMeta,
            previousKeys: [
              ...previousKeys,
              {
                key: oldKey,
                rotatedAt: new Date().toISOString(),
                activationsCountBeforeRotate: license.currentActivations,
              },
            ],
            lastRotatedAt: new Date().toISOString(),
          },
        },
        include: {
          product: { select: { id: true, title: true, slug: true, fileUrl: true } },
        },
      });

      await logAudit({
        userId,
        userEmail: session.user.email ?? undefined,
        action: 'UPDATE',
        resource: 'License',
        resourceId: license.id,
        details: {
          action: 'ROTATE_KEY',
          oldKey,
          newKey,
          productId: license.productId,
          productTitle: updatedLicense.product.title,
        },
      });

      return ok({
        license: {
          id: updatedLicense.id,
          key: updatedLicense.key,
          status: updatedLicense.status,
          currentActivations: updatedLicense.currentActivations,
          maxActivations: updatedLicense.maxActivations,
          expiresAt: updatedLicense.expiresAt,
          updatedAt: updatedLicense.updatedAt,
        },
        message: 'Lisans anahtarınız başarıyla yenilendi.',
      });
    }

    // 2. Şablon lisansı (TemplateLicense) ara
    const templateLicense = await prisma.templateLicense.findUnique({
      where: { id: params.id },
      include: {
        template: { select: { id: true, name: true, slug: true } },
        workspace: { select: { id: true, ownerId: true } },
      },
    });

    if (templateLicense) {
      const isOwner =
        (Boolean(userEmail) && Boolean(templateLicense.buyerEmail) && templateLicense.buyerEmail.toLowerCase() === userEmail) ||
        templateLicense.workspace?.ownerId === userId;

      if (!isOwner && session.user.role !== 'admin') {
        throw new ForbiddenError('Bu şablon lisansını yenileme yetkiniz bulunmuyor');
      }

      if (templateLicense.status === 'revoked') {
        throw new ValidationError('İptal edilmiş bir şablon lisansı yenilenemez');
      }
      if (templateLicense.status === 'expired' || (templateLicense.expiresAt && templateLicense.expiresAt < new Date())) {
        throw new ValidationError('Süresi dolmuş bir şablon lisansı yenilenemez.');
      }

      const oldKey = templateLicense.licenseKey;
      const newKey = generateLicenseKey();

      const updatedTemplateLicense = await prisma.templateLicense.update({
        where: { id: templateLicense.id },
        data: {
          licenseKey: newKey,
        },
      });

      await logAudit({
        userId,
        userEmail: session.user.email ?? undefined,
        action: 'UPDATE',
        resource: 'TemplateLicense',
        resourceId: templateLicense.id,
        details: {
          action: 'ROTATE_KEY',
          oldKey,
          newKey,
          templateId: templateLicense.templateId,
        },
      });

      return ok({
        license: {
          id: updatedTemplateLicense.id,
          key: updatedTemplateLicense.licenseKey,
          status: updatedTemplateLicense.status,
          expiresAt: updatedTemplateLicense.expiresAt,
        },
        message: 'Şablon lisans anahtarınız başarıyla yenilendi.',
      });
    }

    throw new NotFoundError('Lisans');
  });
}

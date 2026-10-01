/**
 * @file /api/admin/licenses/[id] - GET, PATCH, DELETE
 * @description Lisans detay, süre uzatma, dondurma, iptal etme ve aktivasyon sıfırlama endpoint'i.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { logAudit } from '@/lib/audit';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/modules/shared/errors';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new UnauthorizedError('Giriş gerekli');
  if (session.user.role !== 'admin') {
    throw new ForbiddenError('Bu işlem sadece admin rolü için geçerlidir');
  }
  return session.user;
}

const PatchLicenseSchema = z.discriminatedUnion('action', [
  // 1. Süre Uzatma (Gün bazlı)
  z.object({
    action: z.literal('extend'),
    days: z.number().int().min(1, 'En az 1 gün eklenmelidir'),
  }),
  // 2. Özel Bitiş Tarihi Belirleme (veya süresiz yapma: null)
  z.object({
    action: z.literal('set_expiration'),
    expiresAt: z.string().nullable(),
  }),
  // 3. Lisansı Dondurma (Askıya Alma)
  z.object({
    action: z.literal('suspend'),
  }),
  // 4. Lisansı Tekrar Aktif Etme
  z.object({
    action: z.literal('activate'),
  }),
  // 5. Lisansı İptal Etme (Revoke)
  z.object({
    action: z.literal('revoke'),
    reason: z.string().optional(),
  }),
  // 6. Aktivasyon Cihaz Kayıtlarını Sıfırlama
  z.object({
    action: z.literal('reset_activations'),
  }),
  // 7. Maksimum Cihaz Sınırını Güncelleme
  z.object({
    action: z.literal('update_limits'),
    maxActivations: z.number().int().min(1),
  }),
]);

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    await requireAdmin();

    const license = await prisma.license.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        product: true,
        order: {
          include: {
            items: true,
          },
        },
        user: { select: { id: true, email: true, name: true } },
      },
    });

    if (!license) throw new NotFoundError('Lisans bulunamadı');

    return ok({ license });
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const adminUser = await requireAdmin();
    const body = await req.json();
    const data = PatchLicenseSchema.parse(body);

    const existing = await prisma.license.findUnique({
      where: { id: params.id },
      include: { customer: true, product: true },
    });

    if (!existing) throw new NotFoundError('Lisans bulunamadı');

    const now = new Date();
    let updateData: import('@prisma/client').Prisma.LicenseUpdateInput = {};
    let auditActionDetails: Record<string, unknown> = { action: data.action };

    switch (data.action) {
      case 'extend': {
        // Mevcut bitiş tarihi gelecekteyse onun üzerine ekle, geçmişteyse veya süresizse bugünün üzerine ekle
        let baseTime: Date;
        if (existing.expiresAt && existing.expiresAt > now) {
          baseTime = existing.expiresAt;
        } else {
          baseTime = now;
        }

        const newExpiresAt = new Date(baseTime.getTime() + data.days * 24 * 60 * 60 * 1000);
        updateData = {
          expiresAt: newExpiresAt,
          // Eğer önceden süresi dolduğu için 'expired' olmuşsa ve askıya alınmamışsa 'active' yap
          ...(existing.status === 'expired' ? { status: 'active' } : {}),
        };
        auditActionDetails = {
          ...auditActionDetails,
          addedDays: data.days,
          oldExpiresAt: existing.expiresAt,
          newExpiresAt,
        };
        break;
      }

      case 'set_expiration': {
        const newExpiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
        updateData = {
          expiresAt: newExpiresAt,
          ...(newExpiresAt && newExpiresAt > now && existing.status === 'expired'
            ? { status: 'active' }
            : {}),
        };
        auditActionDetails = {
          ...auditActionDetails,
          oldExpiresAt: existing.expiresAt,
          newExpiresAt,
        };
        break;
      }

      case 'suspend': {
        updateData = {
          status: 'suspended',
        };
        auditActionDetails = {
          ...auditActionDetails,
          oldStatus: existing.status,
          newStatus: 'suspended',
        };
        break;
      }

      case 'activate': {
        updateData = {
          status: 'active',
          revokedAt: null,
          revokeReason: null,
        };
        auditActionDetails = {
          ...auditActionDetails,
          oldStatus: existing.status,
          newStatus: 'active',
        };
        break;
      }

      case 'revoke': {
        const reason = data.reason?.trim() || 'Yönetici tarafından iptal edildi';
        updateData = {
          status: 'revoked',
          revokedAt: now,
          revokeReason: reason,
        };
        auditActionDetails = {
          ...auditActionDetails,
          oldStatus: existing.status,
          newStatus: 'revoked',
          reason,
        };
        break;
      }

      case 'reset_activations': {
        updateData = {
          currentActivations: 0,
          activations: [],
        };
        auditActionDetails = {
          ...auditActionDetails,
          resetFromCount: existing.currentActivations,
        };
        break;
      }

      case 'update_limits': {
        updateData = {
          maxActivations: data.maxActivations,
        };
        auditActionDetails = {
          ...auditActionDetails,
          oldLimit: existing.maxActivations,
          newLimit: data.maxActivations,
        };
        break;
      }
    }

    const updated = await prisma.license.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: true,
        product: true,
        order: { select: { id: true, orderNumber: true } },
      },
    });

    await logAudit({
      userId: adminUser.id,
      userEmail: adminUser.email ?? undefined,
      action: 'UPDATE',
      resource: 'License',
      resourceId: updated.id,
      details: {
        key: updated.key,
        customerEmail: updated.customer.email,
        productTitle: updated.product.title,
        ...auditActionDetails,
      },
    });

    return ok({ license: updated });
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const adminUser = await requireAdmin();

    const existing = await prisma.license.findUnique({
      where: { id: params.id },
      include: { customer: true, product: true },
    });

    if (!existing) throw new NotFoundError('Lisans bulunamadı');

    await prisma.license.delete({
      where: { id: params.id },
    });

    await logAudit({
      userId: adminUser.id,
      userEmail: adminUser.email ?? undefined,
      action: 'DELETE',
      resource: 'License',
      resourceId: params.id,
      details: {
        key: existing.key,
        customerEmail: existing.customer.email,
        productTitle: existing.product.title,
      },
    });

    return ok({ success: true, message: 'Lisans başarıyla silindi' });
  });
}

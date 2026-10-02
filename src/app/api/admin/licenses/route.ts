/**
 * @file /api/admin/licenses - GET, POST
 * @description Admin için lisansları listeleme ve manuel lisans oluşturma endpoint'i.
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, created, withErrorHandling } from '@/lib/apiResponse';
import { logAudit } from '@/lib/audit';
import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError } from '@/modules/shared/errors';
import { licenseRepository, customerRepository } from '@/modules/commerce/repository';
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

const CreateLicenseSchema = z.object({
  productId: z.string().min(1, 'Ürün seçilmelidir'),
  customerEmail: z.string().email('Geçerli bir e-posta giriniz'),
  customerName: z.string().optional(),
  type: z.enum(['ONE_TIME', 'SUBSCRIPTION', 'PERPETUAL', 'TRIAL']).default('ONE_TIME'),
  durationDays: z.number().int().min(0).optional(), // 0 veya undefined = süresiz
  maxActivations: z.number().int().min(1).default(1),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q')?.trim().toLowerCase() ?? '';
    const statusFilter = searchParams.get('status')?.trim().toLowerCase() ?? 'all';

    const now = new Date();

    // Filtreleme koşulları
    const andConditions: import('@prisma/client').Prisma.LicenseWhereInput[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { key: { contains: search, mode: 'insensitive' } },
          { customer: { email: { contains: search, mode: 'insensitive' } } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
          { product: { title: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    if (statusFilter === 'active') {
      andConditions.push({
        status: 'active',
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      });
    } else if (statusFilter === 'suspended') {
      andConditions.push({ status: 'suspended' });
    } else if (statusFilter === 'revoked') {
      andConditions.push({ status: 'revoked' });
    } else if (statusFilter === 'expired') {
      andConditions.push({
        OR: [
          { status: 'expired' },
          {
            AND: [{ status: 'active' }, { expiresAt: { lte: now } }],
          },
        ],
      });
    }

    const where: import('@prisma/client').Prisma.LicenseWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const [licenses, allLicensesCounts, products] = await Promise.all([
      prisma.license.findMany({
        where,
        include: {
          customer: { select: { id: true, email: true, name: true } },
          product: { select: { id: true, title: true, slug: true, category: true } },
          order: { select: { id: true, orderNumber: true, totalCents: true, currency: true, createdAt: true } },
          user: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.license.findMany({
        select: {
          id: true,
          status: true,
          expiresAt: true,
        },
      }),
      prisma.digitalProduct.findMany({
        where: { active: true },
        select: { id: true, title: true, category: true },
        orderBy: { title: 'asc' },
      }),
    ]);

    // Canlı durum hesaplama (Süresi dolanları dinamik tespit)
    let activeCount = 0;
    let expiredCount = 0;
    let suspendedCount = 0;
    let revokedCount = 0;

    for (const lic of allLicensesCounts) {
      if (lic.status === 'revoked') {
        revokedCount++;
      } else if (lic.status === 'suspended') {
        suspendedCount++;
      } else if (lic.expiresAt && lic.expiresAt <= now) {
        expiredCount++;
      } else {
        activeCount++;
      }
    }

    return ok({
      licenses,
      stats: {
        total: allLicensesCounts.length,
        active: activeCount,
        expired: expiredCount,
        suspended: suspendedCount,
        revoked: revokedCount,
      },
      products,
    });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const adminUser = await requireAdmin();
    const body = await req.json();
    const data = CreateLicenseSchema.parse(body);

    const product = await prisma.digitalProduct.findUnique({
      where: { id: data.productId },
    });
    if (!product) throw new NotFoundError('Seçilen ürün bulunamadı');

    const customer = await customerRepository.getOrCreate({
      email: data.customerEmail,
      name: data.customerName,
    });

    const key = await licenseRepository.generateKey();

    let expiresAt: Date | null = null;
    if (data.durationDays && data.durationDays > 0) {
      expiresAt = new Date(Date.now() + data.durationDays * 24 * 60 * 60 * 1000);
    }

    const license = await prisma.license.create({
      data: {
        key,
        customerId: customer.id,
        productId: product.id,
        type: data.type,
        status: 'active',
        maxActivations: data.maxActivations,
        currentActivations: 0,
        expiresAt,
        metadata: data.notes
          ? { notes: data.notes, createdBy: adminUser.email }
          : { createdBy: adminUser.email },
      },
      include: {
        customer: true,
        product: true,
      },
    });

    await logAudit({
      userId: adminUser.id,
      userEmail: adminUser.email ?? undefined,
      action: 'CREATE',
      resource: 'License',
      resourceId: license.id,
      details: {
        key: license.key,
        productTitle: product.title,
        customerEmail: customer.email,
        durationDays: data.durationDays,
        type: data.type,
      },
    });

    return created({ license });
  });
}

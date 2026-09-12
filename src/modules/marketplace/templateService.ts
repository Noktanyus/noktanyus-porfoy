/**
 * Template Marketplace — Core Service
 *
 * Phase 3 B.1 kapsamında template vitrin yönetimi, lisans üretimi/verify ve
 * kurulum işlemlerinin business logic katmanı. Route handler'lar ince
 * kalır; tüm DB / queue / audit orchestration burada toplanır.
 *
 * Sorumluluklar:
 *  - TemplateListing CRUD  (admin yetkisi zorunlu)
 *  - Public vitrin listeleme (filtre/sort/pagination)
 *  - Lisans anahtarı üretimi (32 byte hex, unique)
 *  - Kurulum iş akışı (license verify → workspace check → installation row → queue)
 *  - Kullanıcının workspace lisanslarını listeleme
 *
 * Bagimliliklar:
 *  - src/lib/prisma.ts        → DB
 *  - src/lib/audit.ts         → admin aksiyon log
 *  - src/lib/queue.ts         → async install job (Jobs.TemplateInstall)
 *  - src/modules/shared/errors → ValidationError, NotFoundError, ...
 *
 * NOT: Admin rolu "user.role === 'admin'" semasi ile kontrol edilir.
 * Session katmanindan gelen user objesinin sahip oldugu rol (NextAuth
 * credentials provider uzerinden env.ADMIN_EMAIL match) "admin" string'i
 * olarak tasinir. rbac.ts workspace rolleri ile karismamalidir.
 */

import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';
import { queue, Jobs } from '@/lib/queue';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/modules/shared/errors';

import {
  CreateTemplateListingInput,
  InstallTemplateInput,
  ListTemplatesQuery,
  RecordTemplatePurchaseInput,
  UpdateTemplateListingInput,
} from './templateSchemas';

// =================== TYPES ===================

/** Sort opsiyonunun Prisma orderBy semasina cevrilmis hali. */
type TemplateSort = ListTemplatesQuery['sort'];

const SORT_TO_ORDERBY: Record<
  TemplateSort,
  Prisma.TemplateListingOrderByWithRelationInput
> = {
  newest: { createdAt: 'desc' },
  popular: { downloads: 'desc' },
  'price-asc': { priceCents: 'asc' },
  'price-desc': { priceCents: 'desc' },
};

/** Session katmanindan gelen minimal user. */
export interface SessionUserLike {
  id: string;
  role?: string; // "admin" | "user" | ...
  email?: string;
}

/** Pagination meta verisi — API response'lara eklenir. */
export interface PageMeta {
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface PaginatedTemplates {
  items: Array<Prisma.TemplateListingGetPayload<{
    include: { author: { select: { id: true; name: true; email: true } } };
  }>>;
  meta: PageMeta;
}

// =================== INTERNAL HELPERS ===================

/**
 * Admin rolu zorunlu — template listing yonetimi sadece admin tarafindan
 * yapilabilir. Aksiyon deneme kaydi audit'e yazilir.
 */
function requireAdmin(user: SessionUserLike | null | undefined): asserts user is SessionUserLike {
  if (!user || !user.id) {
    throw new UnauthorizedError('Oturum gerekli');
  }
  if (user.role !== 'admin') {
    throw new ForbiddenError('Bu islem sadece admin tarafindan yapilabilir');
  }
}

/**
 * 32 byte (64 hex karakter) restgele lisans anahtari uretir.
 * Collision olasiligi astronomik olarak dusuk (2^256); yine de DB unique
 * constraint ile son savunma katmanidir.
 */
export function generateLicenseKey(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Kullanici bir template icin admin yetkisi var mi yoksa kendi authorId'si
 * uzerinden mi degistiriyor kontrol eder. Burada su anki kural:
 *   - Sadece admin update/delete yapabilir (authorId kendi olsa bile).
 * Gelecekte author'lar kendi template'lerini guncelleyebilir — su anki
 * MVP kapsaminda admin-only.
 */
function requireTemplateAdmin(user: SessionUserLike | null | undefined) {
  requireAdmin(user);
}

/**
 * String alanlari trim'le — slug, name, tagline icin tutarlilik.
 */
function normalizeListingInput(
  input: CreateTemplateListingInput
): CreateTemplateListingInput {
  return {
    ...input,
    slug: input.slug.trim().toLowerCase(),
    name: input.name.trim(),
    tagline: input.tagline.trim(),
    description: input.description.trim(),
    longDescription: input.longDescription?.trim(),
    version: input.version.trim(),
  };
}

// =================== TEMPLATE LISTING CRUD ===================

/**
 * Yeni template listing olusturur. Sadece admin.
 * - slug unique kontrolu (DB constraint ile son savunma)
 * - previewImages/features/techStack JSON normalize (array kontrol)
 */
export async function createTemplateListing(
  author: SessionUserLike,
  input: CreateTemplateListingInput
) {
  requireTemplateAdmin(author);

  const normalized = normalizeListingInput(input);

  const data: Prisma.TemplateListingCreateInput = {
    slug: normalized.slug,
    name: normalized.name,
    tagline: normalized.tagline,
    description: normalized.description,
    longDescription: normalized.longDescription ?? null,
    category: normalized.category,
    previewImages: normalized.previewImages as Prisma.InputJsonValue,
    demoUrl: normalized.demoUrl ?? null,
    priceCents: normalized.priceCents,
    currency: normalized.currency,
    licenseType: normalized.licenseType,
    features: normalized.features as Prisma.InputJsonValue,
    techStack: normalized.techStack as Prisma.InputJsonValue,
    version: normalized.version,
    author: { connect: { id: author.id } },
  };

  // unique slug check — erken donusu daha temiz hata mesaji verir
  const existing = await prisma.templateListing.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });
  if (existing) {
    throw new ConflictError(`'${data.slug}' slug'i zaten kullaniliyor`);
  }

  try {
    const listing = await prisma.templateListing.create({
      data,
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });

    await logAudit({
      userId: author.id,
      userEmail: author.email,
      action: 'CREATE',
      resource: 'TemplateListing',
      resourceId: listing.id,
      details: { slug: listing.slug, name: listing.name, category: listing.category },
    });

    logger.info('Template listing created', {
      templateId: listing.id,
      slug: listing.slug,
      authorId: author.id,
    });

    return listing;
  } catch (err) {
    // P2002 race condition fallback (unique constraint)
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      throw new ConflictError('Bu slug veya deger zaten kullaniliyor');
    }
    throw err;
  }
}

/**
 * Template listing'i gunceller. Sadece admin.
 * Body'de gelen alanlar kismi guncellemeye dahil edilir.
 */
export async function updateTemplateListing(
  admin: SessionUserLike,
  id: string,
  input: UpdateTemplateListingInput
) {
  requireTemplateAdmin(admin);

  const existing = await prisma.templateListing.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });
  if (!existing) throw new NotFoundError('Template listing');

  const data: Prisma.TemplateListingUpdateInput = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.tagline !== undefined) data.tagline = input.tagline.trim();
  if (input.description !== undefined) data.description = input.description.trim();
  if (input.longDescription !== undefined) data.longDescription = input.longDescription;
  if (input.category !== undefined) data.category = input.category;
  if (input.previewImages !== undefined) data.previewImages = input.previewImages as Prisma.InputJsonValue;
  if (input.demoUrl !== undefined) data.demoUrl = input.demoUrl;
  if (input.priceCents !== undefined) data.priceCents = input.priceCents;
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.licenseType !== undefined) data.licenseType = input.licenseType;
  if (input.features !== undefined) data.features = input.features as Prisma.InputJsonValue;
  if (input.techStack !== undefined) data.techStack = input.techStack as Prisma.InputJsonValue;
  if (input.version !== undefined) data.version = input.version.trim();
  if (input.active !== undefined) data.active = input.active;
  if (input.featured !== undefined) data.featured = input.featured;

  const updated = await prisma.templateListing.update({
    where: { id },
    data,
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });

  await logAudit({
    userId: admin.id,
    userEmail: admin.email,
    action: 'UPDATE',
    resource: 'TemplateListing',
    resourceId: id,
    details: { fields: Object.keys(input) },
  });

  logger.info('Template listing updated', { templateId: id, adminId: admin.id });

  return updated;
}

/**
 * Template listing soft-delete (active=false). Sadece admin.
 * Hard delete MVP kapsaminda yok — ileride "trash + restore" akisi eklenebilir.
 */
export async function deleteTemplateListing(admin: SessionUserLike, id: string) {
  requireTemplateAdmin(admin);

  const existing = await prisma.templateListing.findUnique({
    where: { id },
    select: { id: true, active: true },
  });
  if (!existing) throw new NotFoundError('Template listing');

  const updated = await prisma.templateListing.update({
    where: { id },
    data: { active: false },
    select: { id: true, slug: true, active: true },
  });

  await logAudit({
    userId: admin.id,
    userEmail: admin.email,
    action: 'DELETE',
    resource: 'TemplateListing',
    resourceId: id,
    details: { soft: true },
  });

  logger.info('Template listing soft-deleted', { templateId: id, adminId: admin.id });

  return updated;
}

// =================== PUBLIC VITRIN ===================

/**
 * Public vitrin: filtre + siralama + pagination.
 * active=false olanlar haric tutulur (soft-deleted).
 */
export async function listTemplates(query: ListTemplatesQuery): Promise<PaginatedTemplates> {
  const { category, search, sort, page, pageSize } = query;
  const where: Prisma.TemplateListingWhereInput = { active: true };
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { tagline: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const orderBy = SORT_TO_ORDERBY[sort] ?? SORT_TO_ORDERBY.newest;

  const [total, items] = await Promise.all([
    prisma.templateListing.count({ where }),
    prisma.templateListing.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return {
    items: items as PaginatedTemplates['items'],
    meta: {
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

/**
 * Slug ile tek template getirir (public detay sayfasi icin).
 * active=false ise 404 doner.
 */
export async function getTemplateBySlug(slug: string) {
  const template = await prisma.templateListing.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });
  if (!template || !template.active) {
    throw new NotFoundError('Template');
  }
  return template;
}

/**
 * ID ile tek template getirir (admin detay / edit ekrani icin).
 * active=false da dahil edilir (admin'in inactive listingleri gorebilmesi lazim).
 */
export async function getTemplateById(id: string) {
  const template = await prisma.templateListing.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });
  if (!template) throw new NotFoundError('Template');
  return template;
}

/**
 * Admin dashboard: tum template'ler (active + inactive), author bilgisiyle.
 * TemplateInstallation dogrudan TemplateListing'e bagli olmadigi icin
 * installation sayisi template uzerinden _count ile cekilemez — bu nedenle
 * burada sadece licenses + purchases sayilari raporlanir. Installation
 * sayisi ayrica aggregate query ile toplanabilir (ileride).
 */
export async function listAllTemplates(admin: SessionUserLike, take = 100) {
  requireTemplateAdmin(admin);
  return prisma.templateListing.findMany({
    orderBy: { createdAt: 'desc' },
    take,
    include: {
      author: { select: { id: true, name: true, email: true } },
      _count: { select: { licenses: true, purchases: true } },
    },
  });
}

// =================== LICENSE ===================

/**
 * Bir template purchase kaydi olusturur ve otomatik lisans uretir.
 * Idempotent: ayni (source, externalId) ikinci kez gelirse mevcut purchase'i
 * doner (webhook retry senaryosu).
 *
 * Oncelik sirasina gore:
 *  1. Idempotent mevcut purchase kontrolu
 *  2. Template aktif mi?
 *  3. Lisans anahtari uret (unique constraint'i DB kontrol eder)
 *  4. Purchase + License tek transaction icinde insert
 */
export async function recordPurchaseAndIssueLicense(
  input: RecordTemplatePurchaseInput,
  actor?: SessionUserLike
) {
  const template = await prisma.templateListing.findUnique({
    where: { id: input.templateId },
    select: { id: true, active: true, licenseType: true, priceCents: true, currency: true },
  });
  if (!template) throw new NotFoundError('Template');
  if (!template.active) throw new ValidationError('Template aktif degil, satis yapilamaz');

  // Idempotent mevcut purchase
  const existingPurchase = await prisma.templatePurchase.findUnique({
    where: {
      source_externalId: { source: input.source, externalId: input.externalId },
    },
    include: { template: { select: { slug: true, name: true } } },
  });
  if (existingPurchase) {
    logger.info('Template purchase already recorded (idempotent)', {
      purchaseId: existingPurchase.id,
      source: input.source,
      externalId: input.externalId,
    });
    return existingPurchase;
  }

  // Unique licenseKey — DB'ye yazarken P2002 alirsak yeniden uretiriz
  let licenseKey = generateLicenseKey();
  let license: { id: string; licenseKey: string } | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const purchase = await tx.templatePurchase.create({
          data: {
            template: { connect: { id: template.id } },
            buyerEmail: input.buyerEmail,
            buyerName: input.buyerName,
            workspace: input.workspaceId
              ? { connect: { id: input.workspaceId } }
              : undefined,
            source: input.source,
            externalId: input.externalId,
            amountCents: input.amountCents,
            currency: input.currency,
            status: input.status,
            webhookPayload: input.webhookPayload
              ? (input.webhookPayload as Prisma.InputJsonValue)
              : Prisma.JsonNull,
          },
        });

        const lic = await tx.templateLicense.create({
          data: {
            template: { connect: { id: template.id } },
            workspace: input.workspaceId
              ? { connect: { id: input.workspaceId } }
              : undefined,
            buyerEmail: input.buyerEmail,
            buyerName: input.buyerName,
            licenseKey,
            type: template.licenseType,
            status: 'active',
            purchasePriceCents: input.amountCents,
            currency: input.currency,
          },
          select: { id: true, licenseKey: true },
        });

        return { purchase, license: lic };
      });

      license = result.license;

      // Audit log (fire-and-forget; hata olursa islem rollback olmaz)
      await logAudit({
        userId: actor?.id,
        userEmail: actor?.email ?? input.buyerEmail,
        action: 'CREATE',
        resource: 'TemplateLicense',
        resourceId: result.license.id,
        details: {
          templateId: template.id,
          source: input.source,
          externalId: input.externalId,
          amountCents: input.amountCents,
        },
      });

      return result.purchase;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        !license
      ) {
        // licenseKey collision — yeni uret, tekrar dene
        licenseKey = generateLicenseKey();
        continue;
      }
      throw err;
    }
  }

  // 3 deneme de basarisiz olursa
  throw new Error('Lisans anahtari uretilemedi (collision)');
}

/**
 * Public license verify endpoint'i icin.
 * - active olmali
 * - expired olmamali (expiresAt null veya > now)
 * - revoked olmamali
 */
export async function verifyLicenseKey(licenseKey: string) {
  const license = await prisma.templateLicense.findUnique({
    where: { licenseKey },
    include: {
      template: {
        select: {
          id: true,
          slug: true,
          name: true,
          licenseType: true,
          version: true,
        },
      },
    },
  });

  if (!license) throw new NotFoundError('Lisans');
  if (license.status === 'revoked') {
    throw new ForbiddenError('Bu lisans iptal edildi');
  }
  if (license.status === 'expired' || (license.expiresAt && license.expiresAt < new Date())) {
    throw new ForbiddenError('Bu lisansin suresi dolmus');
  }

  return {
    licenseKey: license.licenseKey,
    status: license.status,
    type: license.type,
    expiresAt: license.expiresAt,
    template: license.template,
    workspaceId: license.workspaceId,
  };
}

/**
 * Workspace'in tum aktif lisanslari (sahip oldugu template'ler).
 * revoked/expired haric tutulur.
 */
export async function listUserLicenses(workspaceId: string) {
  if (!workspaceId) throw new ValidationError('workspaceId zorunlu');

  return prisma.templateLicense.findMany({
    where: {
      workspaceId,
      status: 'active',
    },
    include: {
      template: {
        select: {
          id: true,
          slug: true,
          name: true,
          tagline: true,
          previewImages: true,
          version: true,
        },
      },
      _count: {
        select: { installations: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// =================== INSTALLATION ===================

/**
 * Bir template'i workspace'e kur. Akis:
 *  1. License key verify (active + not expired)
 *  2. Lisansin workspace'iyle (ya da kullanicinin baglanti talebi) eslesme kontrolu
 *     - Eger license.workspaceId set edilmemisse, install aninda baglanir
 *  3. TemplateInstallation row insert (status='pending')
 *  4. BullMQ job enqueue (Jobs.TemplateInstall) — worker kurulumu yapacak
 *  5. Return installation row
 */
export async function installTemplate(
  user: SessionUserLike,
  input: InstallTemplateInput
) {
  if (!user?.id) throw new UnauthorizedError('Oturum gerekli');

  // 1. License verify
  const license = await prisma.templateLicense.findUnique({
    where: { licenseKey: input.licenseKey },
    include: {
      template: { select: { id: true, slug: true, name: true, active: true } },
    },
  });
  if (!license) throw new NotFoundError('Lisans');
  if (license.status !== 'active') {
    throw new ForbiddenError('Lisans aktif degil');
  }
  if (license.expiresAt && license.expiresAt < new Date()) {
    throw new ForbiddenError('Lisans suresi dolmus');
  }

  // 2. Workspace check
  const workspace = await prisma.workspace.findUnique({
    where: { id: input.workspaceId },
    select: { id: true, ownerId: true },
  });
  if (!workspace) throw new NotFoundError('Workspace');

  const isOwner = workspace.ownerId === user.id;
  if (!isOwner) {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: input.workspaceId, userId: user.id } },
      select: { role: true },
    });
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      throw new ForbiddenError("Bu workspace'e template kurma yetkiniz yok");
    }
  }

  // License zaten baska bir workspace'e bagliysa cakisma kontrolu
  if (license.workspaceId && license.workspaceId !== input.workspaceId) {
    throw new ConflictError('Bu lisans baska bir workspace ile bagli');
  }

  // 3. License'i workspace'e bagla (ilk install ise)
  if (!license.workspaceId) {
    await prisma.templateLicense.update({
      where: { id: license.id },
      data: { workspace: { connect: { id: input.workspaceId } } },
    });
  }

  // 4. Installation row insert
  const installation = await prisma.templateInstallation.create({
    data: {
      license: { connect: { id: license.id } },
      workspace: { connect: { id: input.workspaceId } },
      status: 'pending',
      configSnapshot: input.config
        ? (input.config as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    },
  });

  // 5. Queue job enqueue (fire-and-forget; job handler'i B.2'de eklenecek)
  await queue.add({
    id: `template-install:${installation.id}`,
    name: Jobs.templateInstall,
    data: {
      installationId: installation.id,
      templateId: license.template.id,
      templateSlug: license.template.slug,
      licenseId: license.id,
      workspaceId: input.workspaceId,
      config: input.config ?? {},
      triggeredBy: user.id,
    },
    attempts: 3,
  });

  // Stats: downloads counter
  await prisma.templateListing.update({
    where: { id: license.template.id },
    data: { downloads: { increment: 1 } },
  }).catch((err) => {
    // stats update hata verse bile install kayit kaybolmasin
    logger.warn('Template downloads counter update failed', { err });
  });

  await logAudit({
    userId: user.id,
    userEmail: user.email,
    action: 'CREATE',
    resource: 'TemplateInstallation',
    resourceId: installation.id,
    details: {
      templateSlug: license.template.slug,
      workspaceId: input.workspaceId,
    },
  });

  logger.info('Template installation queued', {
    installationId: installation.id,
    templateId: license.template.id,
    workspaceId: input.workspaceId,
    userId: user.id,
  });

  return installation;
}

/**
 * Bir kurulumun guncel durumunu getirir (polling endpoint'i icin).
 */
export async function getInstallationStatus(installationId: string, user: SessionUserLike) {
  if (!user?.id) throw new UnauthorizedError('Oturum gerekli');

  const installation = await prisma.templateInstallation.findUnique({
    where: { id: installationId },
    include: {
      license: {
        select: {
          licenseKey: true,
          workspaceId: true,
          template: { select: { slug: true, name: true } },
        },
      },
      workspace: { select: { id: true, ownerId: true, name: true } },
    },
  });
  if (!installation) throw new NotFoundError('Installation');

  // Authz: workspace sahibi veya admin
  const isWorkspaceOwner = installation.workspace?.ownerId === user.id;
  const isAdmin = user.role === 'admin';
  if (!isWorkspaceOwner && !isAdmin) {
    // Admin disindaki kullanicilar icin membership kontrolu
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: installation.workspaceId ?? '',
          userId: user.id,
        },
      },
      select: { role: true },
    });
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      throw new ForbiddenError('Bu kurulumu gorme yetkiniz yok');
    }
  }

  return installation;
}
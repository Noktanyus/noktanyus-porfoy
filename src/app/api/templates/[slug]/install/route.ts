/**
 * @file /api/templates/[slug]/install - POST
 * @description Kullanici satin aldigi template'i workspace'e kurar.
 *              Auth zorunlu (NextAuth session).
 *              Body: { licenseKey, config?: { subdomain?, primaryColor? } }
 *              installTemplate service'i cagirir; pending installation doner.
 *
 * Response: { installationId, status, deployedUrl?, errorMessage? }
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { created, withErrorHandling } from '@/lib/apiResponse';
import { logAudit } from '@/lib/audit';
import { UnauthorizedError, ForbiddenError } from '@/modules/shared/errors';
import { InstallTemplateSchema } from '@/modules/marketplace/templateSchemas';
import {
  installTemplate,
  getTemplateBySlug,
} from '@/modules/marketplace/templateService';
import { prisma } from '@/lib/prisma';
import { withRateLimit, RateLimits } from '@/lib/rateLimitMiddleware';

export const dynamic = 'force-dynamic';

async function handler(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');

    const body = await req.json().catch(() => {
      throw new ForbiddenError('Geçersiz JSON gövdesi');
    });
    const data = InstallTemplateSchema.parse(body);

    // Slug'dan templateId cozumle — license service sadece licenseKey ile
    // calistigi icin template slug kontrolunu burada yapiyoruz
    const template = await getTemplateBySlug(params.slug);

    // Lisans gercekten bu template'e mi ait? — install sirasinda validate et
    const license = await prisma.templateLicense.findUnique({
      where: { licenseKey: data.licenseKey },
      select: { templateId: true },
    });
    if (!license || license.templateId !== template.id) {
      throw new ForbiddenError('Bu lisans anahtari bu template ile eslesmiyor');
    }

    const user = {
      id: session.user.id,
      role: (session.user as { role?: string }).role,
      email: session.user.email ?? undefined,
    };

    const installation = await installTemplate(user, data);

    // Audit — fire-and-forget
    logAudit({
      userId: session.user.id,
      userEmail: session.user.email ?? undefined,
      action: 'CREATE',
      resource: 'TemplateInstallation',
      resourceId: installation.id,
      details: {
        templateSlug: template.slug,
        licenseId: installation.licenseId,
        workspaceId: installation.workspaceId,
      },
    }).catch(() => undefined);

    return created({
      installationId: installation.id,
      status: installation.status,
      deployedUrl: installation.deployedUrl ?? undefined,
      templateSlug: template.slug,
    });
  });
}

export const POST = withRateLimit(RateLimits.api, handler);

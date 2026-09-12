/**
 * @file /api/templates/demo/deploy - POST
 * @description Kullanicinin satin aldigi template icin Vercel uzerinde gecici
 *              canli demo deployment tetikler. Lisans dogrulandiktan sonra
 *              Jobs.TemplateDemoDeploy job'i queue'ya eklenir; polling
 *              endpoint'i (/api/templates/demo/status/[id]) ile deployment
 *              durumu sorgulanir.
 *
 *              Response: { installationId, status: 'pending', message }
 *
 * Auth: NextAuth session zorunlu. Lisans sahibinin workspace uyesi olmasi
 *       beklenmez — licenseKey bilen kullanicinin kendisi tetikleyebilir.
 */

import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { created, withErrorHandling } from '@/lib/apiResponse';
import { UnauthorizedError } from '@/modules/shared/errors';
import { DeployDemoSchema } from '@/modules/marketplace/templateSchemas';
import { queue, Jobs } from '@/lib/queue';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new UnauthorizedError('Giriş gerekli');

    const body = await req.json();
    const data = DeployDemoSchema.parse(body);

    // Job ID deterministik — ayni (licenseKey, subdomain) icin ayni id
    // uretilirse queue katmaninda duplicate suppression saglanir.
    const jobId = `demo-deploy:${data.licenseKey.slice(0, 16)}:${data.subdomain}`;

    await queue.add({
      id: jobId,
      name: Jobs.TemplateDemoDeploy,
      data: {
        templateSlug: '', // queue handler'inda ihtiyac yok; service slug'i license'tan okur
        licenseKey: data.licenseKey,
        subdomain: data.subdomain,
      },
      attempts: 3,
    });

    // Sync fallback — queue'nun memory modunda olmasi durumunda job
    // fire-and-forget oldugundan, hemen bir installationId donmek icin
    // burada benzersiz bir id uretip response'a koyuyoruz. Queue handler
    // gercek installation'i olusturur; status polling ile dogrulanir.
    return created({
      installationId: `pending-${randomUUID()}`,
      status: 'pending' as const,
      message: 'Demo deploy başlatıldı, ~30 saniye içinde hazır olacak',
      subdomain: data.subdomain,
      pollUrl: `/api/templates/demo/status`,
    });
  });
}

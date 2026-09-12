/**
 * @file /workspace/[subdomain] — White-label workspace landing.
 * @description
 *   Wildcard subdomain (*.example.com) rewrite ile gelen istekler bu
 *   route'a yonlendirilir. URL icindeki [subdomain] workspace slug'i ile
 *   eslesir; branding bilgisi cekilir ve BrandingProvider ile tema uygulanir.
 *
 *   NOT: Bu sayfa yalnizca SUBDOMAIN_ROUTING_ENABLED env ile aktif olur.
 *   DNS + Vercel/Cloudflare wildcard subdomain konfigurasyonu gerektirir.
 *
 *   Reverse proxy tarafi (Cloudflare Worker / Vercel middleware):
 *     Host: {slug}.noktanyus.com  →  rewrite to /workspace/{slug}
 *   Boylece Next.js tarafinda subdomain'i URL'den okuyabiliriz.
 */

import { notFound } from 'next/navigation';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { prisma } from '@/lib/prisma';
import { brandingService } from '@/modules/workspaces/brandingService';
import { BrandingProvider } from '@/components/BrandingProvider';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { subdomain: string };
}

async function loadWorkspaceBySlug(slug: string) {
  const ws = await prisma.workspace.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      brandColor: true,
      brandLogo: true,
      brandFavicon: true,
      customDomain: true,
      whiteLabelEnabled: true,
    },
  });
  return ws;
}

export default async function WorkspaceSubdomainPage({ params }: PageProps) {
  const subdomain = params.subdomain?.toLowerCase();
  if (!subdomain) notFound();

  // 'www' veya 'app' gibi sistem subdomainlerini kabul etme
  if (['www', 'app', 'api', 'admin', 'static', 'cdn'].includes(subdomain)) {
    notFound();
  }

  const ws = await loadWorkspaceBySlug(subdomain);
  if (!ws) notFound();
  if (!ws.whiteLabelEnabled) {
    // White-label kapali workspace'lere subdomain ile erisim yok
    notFound();
  }

  const branding = await brandingService.getBranding(ws.id);

  return (
    <BrandingProvider branding={branding}>
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
        style={{ backgroundColor: 'var(--brand-bg)', color: 'var(--brand-text)' }}
      >
        <div className="max-w-2xl w-full text-center space-y-6">
          {branding.brandLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.brandLogo}
              alt={ws.name}
              className="h-16 w-auto mx-auto"
            />
          )}
          <h1
            className="text-4xl font-bold"
            style={{ color: 'var(--brand-primary)' }}
          >
            {ws.name}
          </h1>
          <p className="text-lg opacity-80">
            Bu workspace white-label olarak yayında. İçerik ve ayarlar
            workspace sahibi tarafından yönetilir.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <a
              href="/"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg px-6 font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              Ana Sayfa
            </a>
            {branding.customDomain && (
              <a
                href={`https://${branding.customDomain}`}
                /*
                 * Harici, workspace sahibi tarafından tanımlanan bir alan adı.
                 * `rel="noopener noreferrer"` reverse-tabnabbing'i ve
                 * referrer sızıntısını engeller; `nofollow` ise doğrulanmamış
                 * kullanıcı içeriğine SEO ağırlığı geçmesini önler.
                 */
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-6 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  borderColor: 'var(--brand-primary)',
                  color: 'var(--brand-primary)',
                }}
              >
                {branding.customDomain}
                <FaExternalLinkAlt aria-hidden="true" className="h-3 w-3" />
                <span className="sr-only">(yeni sekmede açılır)</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </BrandingProvider>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const ws = await loadWorkspaceBySlug(params.subdomain?.toLowerCase());
  if (!ws) return {};
  return {
    title: `${ws.name} — White-label Workspace`,
    description: `${ws.name} workspace'inin white-label landing sayfasi.`,
  };
}

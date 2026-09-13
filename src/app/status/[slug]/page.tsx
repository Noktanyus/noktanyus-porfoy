/**
 * @file Public Status Page — /status/[slug]
 * @description Kimlik doğrulaması gerektirmeyen, herkese açık durum sayfası.
 *
 *              Slug çözümleme sırası:
 *              1. Monitor.publicSlug (isPublic = true) → tek monitör sayfası
 *              2. StatusPage.slug (isPublic = true)   → çoklu monitör sayfası
 *              3. Eşleşme yoksa notFound() → 404
 *
 *              Gizlilik: yalnızca isPublic monitörler listelenir. StatusPage
 *              içindeki monitorIds ayrıca sayfanın sahibiyle eşleşme koşuluyla
 *              sorgulanır; başka bir kullanıcının monitör id'si eklenmiş olsa
 *              bile veri sızmaz. Monitör URL'i, hata mesajları ve sahip
 *              bilgisi hiçbir durumda gösterilmez.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { safeMetadata } from '@/lib/pageMetadata';
import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';
import {
  MonitorStatusCard,
  formatDateTime,
  type PublicMonitor,
} from '@/components/status/MonitorStatusCard';

export const dynamic = 'force-dynamic';

const CHECK_HISTORY_LIMIT = 45;
const SLUG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,98}$/;
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

/** Public yüzeye çıkan monitör alanları — bilinçli olarak dar tutulmuştur. */
const monitorSelect = {
  id: true,
  name: true,
  status: true,
  uptimePct30d: true,
  lastCheckedAt: true,
  lastResponseMs: true,
  checks: {
    select: { id: true, timestamp: true, isUp: true, responseMs: true },
    orderBy: { timestamp: 'desc' },
    take: CHECK_HISTORY_LIMIT,
  },
} as const;

interface StatusTarget {
  title: string;
  description: string | null;
  brandColor: string | null;
  monitors: PublicMonitor[];
}

function sanitizeBrandColor(value: string | null | undefined): string | null {
  return value && HEX_COLOR_PATTERN.test(value) ? value : null;
}

/**
 * Slug'ı önce monitöre, sonra status sayfasına çözer.
 * Bulunamazsa veya DB hata verirse null döner — çağıran taraf 404 üretir,
 * böylece public sayfa hiçbir koşulda 500 vermez.
 */
async function resolveStatusTarget(slug: string): Promise<StatusTarget | null> {
  if (!SLUG_PATTERN.test(slug)) return null;

  try {
    const monitor = await prisma.monitor.findFirst({
      where: { publicSlug: slug, isPublic: true },
      select: monitorSelect,
    });

    if (monitor) {
      return {
        title: monitor.name,
        description: null,
        brandColor: null,
        monitors: [monitor],
      };
    }

    const statusPage = await prisma.statusPage.findFirst({
      where: { slug, isPublic: true },
      select: {
        userId: true,
        title: true,
        description: true,
        brandColor: true,
        monitorIds: true,
      },
    });

    if (!statusPage) return null;

    const monitorIds = Array.isArray(statusPage.monitorIds)
      ? statusPage.monitorIds.filter((id): id is string => typeof id === 'string')
      : [];

    const monitors =
      monitorIds.length === 0
        ? []
        : await prisma.monitor.findMany({
            where: {
              id: { in: monitorIds },
              isPublic: true,
              userId: statusPage.userId,
            },
            select: monitorSelect,
          });

    // Sahibinin belirlediği sıra korunur.
    const byId = new Map(monitors.map((m) => [m.id, m]));
    const ordered = monitorIds
      .map((id) => byId.get(id))
      .filter((m): m is (typeof monitors)[number] => Boolean(m));

    return {
      title: statusPage.title,
      description: statusPage.description,
      brandColor: sanitizeBrandColor(statusPage.brandColor),
      monitors: ordered,
    };
  } catch (error) {
    logger.error('[status/[slug]] durum verisi alınamadı', {
      slug,
      message: (error as Error)?.message,
    });
    return null;
  }
}

function summarize(monitors: PublicMonitor[]): { label: string; tone: StatusTone } {
  if (monitors.length === 0) {
    return { label: 'Yayınlanmış servis yok', tone: 'neutral' };
  }

  const downCount = monitors.filter((m) => m.status === 'DOWN').length;
  if (downCount > 0) {
    return {
      label:
        downCount === 1
          ? 'Bir serviste kesinti var'
          : `${downCount} serviste kesinti var`,
      tone: 'danger',
    };
  }

  const active = monitors.filter((m) => m.status !== 'PAUSED');
  if (active.length === 0) {
    return { label: 'Tüm servisler duraklatıldı', tone: 'neutral' };
  }
  if (active.some((m) => m.status === 'PENDING')) {
    return { label: 'Bazı servisler ölçüm bekliyor', tone: 'info' };
  }
  return { label: 'Tüm sistemler çalışıyor', tone: 'success' };
}

function lastUpdatedAt(monitors: PublicMonitor[]): Date | null {
  const timestamps = monitors
    .map((m) => (m.lastCheckedAt ? new Date(m.lastCheckedAt).getTime() : null))
    .filter((t): t is number => t !== null && !Number.isNaN(t));
  return timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null;
}

// =================== METADATA ===================

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  return safeMetadata(
    async () => {
      const target = await resolveStatusTarget(params.slug);
      if (!target) return null;
      const description =
        target.description ?? `${target.title} için canlı servis durumu ve çalışma süresi.`;
      return {
        title: `${target.title} — Sistem Durumu`,
        description,
        alternates: { canonical: `/status/${params.slug}` },
        openGraph: {
          title: `${target.title} — Sistem Durumu`,
          description,
          type: 'website',
          url: `/status/${params.slug}`,
        },
      };
    },
    {
      title: 'Sistem Durumu',
      description: 'Servislerin canlı durumu ve çalışma süresi.',
      path: `/status/${params.slug}`,
    }
  );
}

// =================== PAGE ===================

export default async function PublicStatusPage({
  params,
}: {
  params: { slug: string };
}) {
  const target = await resolveStatusTarget(params.slug);
  if (!target) notFound();

  const summary = summarize(target.monitors);
  const updatedAt = lastUpdatedAt(target.monitors);

  return (
    <div className="container-responsive">
      <div className="max-w-3xl mx-auto space-y-6 py-4">
        <header className="glass-card-premium p-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white break-words">
                {target.title}
              </h1>
              {target.description && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 break-words">
                  {target.description}
                </p>
              )}
            </div>
            {target.brandColor && (
              <span
                aria-hidden="true"
                className="w-3 h-3 rounded-full shrink-0 mt-2"
                style={{ backgroundColor: target.brandColor }}
              />
            )}
          </div>

          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <StatusBadge
              label={summary.label}
              tone={summary.tone}
              dot
              srLabel="Genel durum: "
            />
            <p className="text-xs text-muted-foreground">
              Son güncelleme: {formatDateTime(updatedAt)}
            </p>
          </div>
        </header>

        <section aria-labelledby="services-heading" className="space-y-4">
          <h2 id="services-heading" className="sr-only">
            Servisler
          </h2>
          {target.monitors.length === 0 ? (
            <p className="glass-card-premium p-6 text-sm text-muted-foreground text-center">
              Bu durum sayfasında henüz yayınlanmış bir servis bulunmuyor.
            </p>
          ) : (
            target.monitors.map((monitor) => (
              <MonitorStatusCard key={monitor.id} monitor={monitor} />
            ))
          )}
        </section>

        <footer className="text-center text-xs text-muted-foreground">
          <Link
            href="/"
            className="hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Noktanyus ile izleniyor
          </Link>
        </footer>
      </div>
    </div>
  );
}

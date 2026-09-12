/**
 * @file SaaS Dashboard — Authenticated ana sayfa.
 * @description Server component; session + workspace + kullanım verisi server'da
 *              toplanır, UsageWidget initialData prop'u ile client'a aktarılır.
 *              Hızlı erişim kartları: Üret, Marka Sesi, Toplu İşler, API Keys.
 *
 * Veri dürüstlüğü: bu ekrandaki tüm sayılar (kullanım, iş sayısı, ilerleme,
 * marka sesi örneklem sayısı) doğrudan DB'den gelir. Hiçbir örnek/temsili
 * metrik gösterilmez.
 *
 * Faz D: emoji ikonlar react-icons'e taşındı; başlık `PageHeader`, kartlar
 * `DashboardSection`, boş durumlar `EmptyState`, statü `StatusBadge`,
 * ilerleme `ProgressBar` ortak primitive'leriyle standartlaştırıldı.
 */

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  FaMagic,
  FaPalette,
  FaLayerGroup,
  FaKey,
  FaArrowRight,
} from 'react-icons/fa';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getCurrentMonthUsage,
  getUserPlan,
  getPlanLimits,
} from '@/lib/planGate';
import { UsageWidget, type UsageWidgetData } from '@/components/saas/UsageWidget';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge, resolveJobStatus } from '@/components/ui/StatusBadge';
import { ProgressBar, clampPercent } from '@/components/ui/ProgressBar';
import { formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'SaaS Dashboard · Noktanyus',
  description: 'AI kullanım özeti, hızlı aksiyonlar ve son üretimler',
};

interface QuickLink {
  href: string;
  title: string;
  desc: string;
  icon: ReactNode;
}

const QUICK_LINKS: QuickLink[] = [
  {
    href: '/saas/generate',
    title: 'AI ile Üret',
    desc: 'Tekil ürün veya toplu CSV yükleme',
    icon: <FaMagic />,
  },
  {
    href: '/saas/brand-voice',
    title: 'Marka Sesi',
    desc: 'Ses tonunuzu eğitin veya mevcut sesleri yönetin',
    icon: <FaPalette />,
  },
  {
    href: '/saas/jobs',
    title: 'Toplu İşler',
    desc: 'CSV yüklemelerinin durumunu izleyin',
    icon: <FaLayerGroup />,
  },
  {
    href: '/dashboard/api-keys',
    title: 'API Anahtarları',
    desc: 'Mevcut anahtarlarınızı yönetin veya yeni oluşturun',
    icon: <FaKey />,
  },
];

export default async function SaasDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null; // Layout redirect'i zaten yaptı

  const userId = session.user.id as string;

  // Parallel fetch
  const [planSlug, usage, recentJobs, recentBrandVoices, membership] = await Promise.all([
    getUserPlan(userId),
    getCurrentMonthUsage(userId),
    prisma.generationJob.findMany({
      where: { workspace: { members: { some: { userId } } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        totalRows: true,
        processedRows: true,
        createdAt: true,
      },
    }),
    prisma.brandVoice.findMany({
      where: { workspace: { members: { some: { userId } } } },
      orderBy: { updatedAt: 'desc' },
      take: 3,
      select: { id: true, name: true, sampleCount: true, updatedAt: true },
    }),
    prisma.workspaceMember.count({ where: { userId } }),
  ]);

  const realLimits = await getPlanLimits(planSlug);
  const tokenLimit = realLimits?.aiTokensPerMonth ?? 0;
  const requestLimit = realLimits?.aiRequestsPerMonth ?? 0;
  const isUnlimited = planSlug === 'enterprise';

  const usageData: UsageWidgetData = {
    planSlug,
    isUnlimited,
    month: new Date().toISOString().slice(0, 7),
    tokensUsed: usage.tokensUsed,
    requestsUsed: usage.requestsUsed,
    tokensLimit: Number.isFinite(tokenLimit) ? tokenLimit : null,
    requestsLimit: Number.isFinite(requestLimit) ? requestLimit : null,
    tokensRemaining: !isUnlimited && Number.isFinite(tokenLimit)
      ? Math.max(0, tokenLimit - usage.tokensUsed)
      : null,
    requestsRemaining: !isUnlimited && Number.isFinite(requestLimit)
      ? Math.max(0, requestLimit - usage.requestsUsed)
      : null,
  };

  const firstName = session.user.name?.split(' ')[0] ?? 'kullanıcı';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hoş geldin, ${firstName}`}
        description={
          membership > 0
            ? `${membership} workspace erişiminiz var`
            : 'Henüz workspace üyeliğiniz yok — üretimler workspace bazlı saklanır'
        }
        breadcrumb={<span>SaaS / Dashboard</span>}
        actions={
          <Link href="/saas/generate" className="admin-btn admin-btn-primary">
            <FaMagic aria-hidden="true" className="w-3.5 h-3.5" />
            Yeni Üret
          </Link>
        }
      />

      {/* Üst grid: kullanım + hızlı bağlantı */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <UsageWidget initialData={usageData} />
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-brand-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span
                aria-hidden="true"
                className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-lg text-brand-primary"
              >
                {link.icon}
              </span>
              <h3 className="font-bold text-foreground transition-colors group-hover:text-brand-primary">
                {link.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{link.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Alt grid: son işler + marka sesleri */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection
          title="Son Toplu İşler"
          meta={
            <Link
              href="/saas/jobs"
              className="inline-flex items-center gap-1 text-brand-primary hover:underline"
            >
              Tümü
              <FaArrowRight aria-hidden="true" className="w-2.5 h-2.5" />
            </Link>
          }
        >
          {recentJobs.length === 0 ? (
            <EmptyState
              variant="inline"
              icon="box"
              title="Henüz toplu iş yok"
              description="CSV yükleyerek ilk toplu üretiminizi başlatın."
              action={{ label: 'CSV Yükle', href: '/saas/generate' }}
            />
          ) : (
            <ul className="space-y-1">
              {recentJobs.map((job) => {
                const pct = clampPercent(
                  job.totalRows > 0 ? (job.processedRows / job.totalRows) * 100 : 0,
                );
                return (
                  <li key={job.id}>
                    <Link
                      href={`/saas/jobs/${job.id}`}
                      className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-mono text-xs text-muted-foreground">
                          {job.id.slice(0, 12)}…
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatDateTime(job.createdAt)}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between gap-3 text-sm">
                        <StatusBadge size="sm" {...resolveJobStatus(job.status)} />
                        <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                          {job.processedRows} / {job.totalRows}
                        </span>
                      </div>
                      <ProgressBar
                        className="mt-1.5"
                        size="sm"
                        value={pct}
                        label={`${job.id} işi ilerlemesi`}
                        tone={
                          job.status === 'failed'
                            ? 'danger'
                            : job.status === 'completed'
                              ? 'success'
                              : 'brand'
                        }
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </DashboardSection>

        <DashboardSection
          title="Marka Sesleriniz"
          meta={
            <Link
              href="/saas/brand-voice"
              className="inline-flex items-center gap-1 text-brand-primary hover:underline"
            >
              Tümü
              <FaArrowRight aria-hidden="true" className="w-2.5 h-2.5" />
            </Link>
          }
        >
          {recentBrandVoices.length === 0 ? (
            <EmptyState
              variant="inline"
              icon="file"
              title="Henüz marka sesi yok"
              description="En az 3 örneklem girerek kendi ses tonunuzu eğitin."
              action={{ label: 'Marka Sesi Oluştur', href: '/saas/brand-voice' }}
            />
          ) : (
            <ul className="space-y-1">
              {recentBrandVoices.map((v) => (
                <li key={v.id}>
                  <Link
                    href="/saas/brand-voice"
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {v.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {v.sampleCount} örneklem · {formatDateTime(v.updatedAt)}
                      </span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-brand-primary">
                      Yönet
                      <FaArrowRight aria-hidden="true" className="w-2.5 h-2.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>
      </div>

      {/* Upgrade CTA */}
      <section
        id="upgrade"
        aria-labelledby="upgrade-heading"
        className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-brand-primary to-purple-600 p-6 text-white sm:flex-row sm:items-center sm:p-8"
      >
        <div>
          <h2 id="upgrade-heading" className="mb-1 text-lg font-bold sm:text-xl">
            Daha fazlasına mı ihtiyacınız var?
          </h2>
          <p className="text-sm opacity-90">
            {isUnlimited
              ? 'Enterprise planınız sınırsız — iyi kullanımlar!'
              : 'Pro plana geçerek marka sesi ve toplu CSV özelliklerini açın.'}
          </p>
        </div>
        <Link
          href="/saas#pricing"
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-white px-5 text-sm font-bold text-brand-primary transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
        >
          {isUnlimited ? 'Plan Detayları' : 'Planları Karşılaştır'}
        </Link>
      </section>
    </div>
  );
}

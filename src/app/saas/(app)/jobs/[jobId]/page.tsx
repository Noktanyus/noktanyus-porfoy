/**
 * @file SaaS Job Detail — Toplu iş detayı + sonuç önizleme + CSV export.
 * @description Server component; tek bir GenerationJob kaydını + sonuçlarını
 *              (ilk 50) yükler. CSV export linki /api/saas-ui/jobs/[jobId]/export
 *              endpoint'ini çağırır.
 *
 * Veri dürüstlüğü: tüm sayılar (satır sayıları, token, ilerleme) DB'den gelir.
 *
 * Faz D: `PageHeader` (breadcrumb + geri linki), `StatCard` (dl semantiği),
 * `DashboardSection`, `EmptyState`, `StatusBadge`, `ProgressBar` ve
 * `ErrorBanner` ortak primitive'leri kullanıldı.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaDownload } from 'react-icons/fa';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { StatCard, StatCardGrid } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge, resolveJobStatus } from '@/components/ui/StatusBadge';
import { ProgressBar, clampPercent } from '@/components/ui/ProgressBar';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { jobId: string };
}

export default async function JobDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const userId = session.user.id as string;

  const job = await prisma.generationJob.findFirst({
    where: {
      id: params.jobId,
      workspace: { members: { some: { userId } } },
    },
    select: {
      id: true,
      status: true,
      totalRows: true,
      processedRows: true,
      successfulRows: true,
      failedRows: true,
      csvOriginalName: true,
      outputCsvPath: true,
      options: true,
      completedAt: true,
      errorMessage: true,
      createdAt: true,
      brandVoice: { select: { id: true, name: true } },
      workspace: { select: { id: true, name: true } },
      results: {
        orderBy: { rowIndex: 'asc' },
        take: 50,
        select: {
          id: true,
          rowIndex: true,
          inputTitle: true,
          inputFeatures: true,
          shortDescription: true,
          description: true,
          tags: true,
          errorMessage: true,
          inputTokens: true,
          outputTokens: true,
        },
      },
      _count: { select: { results: true } },
    },
  });

  if (!job) notFound();

  const pct = clampPercent(
    job.totalRows > 0 ? (job.processedRows / job.totalRows) * 100 : 0,
  );

  const options = (job.options ?? {}) as {
    language?: string;
    length?: string;
    keywords?: string[];
  };

  const jobTitle = job.csvOriginalName ?? job.id;
  const isRunning = job.status === 'pending' || job.status === 'processing';

  return (
    <div className="space-y-6">
      <PageHeader
        title={jobTitle}
        description={
          <span className="font-mono text-xs break-all">{job.id}</span>
        }
        backHref="/saas/jobs"
        backLabel="Toplu İşler"
        breadcrumb={<span>SaaS / Toplu İşler / Detay</span>}
        actions={
          <>
            <StatusBadge {...resolveJobStatus(job.status)} />
            {job.status === 'completed' && (
              <a
                href={`/api/saas-ui/jobs/${job.id}/export`}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-btn admin-btn-primary"
              >
                <FaDownload aria-hidden="true" className="w-3 h-3" />
                CSV İndir
              </a>
            )}
          </>
        }
      />

      {/* Meta özet — tanım listesi semantiği */}
      <StatCardGrid as="dl" columns={4}>
        <StatCard definition label="Toplam satır" value={job.totalRows} />
        <StatCard definition label="İşlenen" value={`${job.processedRows} (%${pct})`} />
        <StatCard
          definition
          label="Başarılı"
          value={job.successfulRows}
          tone={job.successfulRows > 0 ? 'success' : 'default'}
        />
        <StatCard
          definition
          label="Başarısız"
          value={job.failedRows}
          tone={job.failedRows > 0 ? 'danger' : 'default'}
        />
        <StatCard definition label="Marka sesi" value={job.brandVoice?.name ?? 'Seçilmedi'} />
        <StatCard definition label="Dil" value={(options.language ?? 'tr').toUpperCase()} />
        <StatCard definition label="Uzunluk" value={options.length ?? 'medium'} />
        <StatCard definition label="Oluşturuldu" value={formatDateTime(job.createdAt)} />
      </StatCardGrid>

      {/* İlerleme */}
      <DashboardSection title="İlerleme" meta={`${job.processedRows} / ${job.totalRows}`}>
        <ProgressBar
          size="lg"
          value={pct}
          showValue
          label={`${jobTitle} işi ilerlemesi`}
          tone={
            job.status === 'failed'
              ? 'danger'
              : job.status === 'completed'
                ? 'success'
                : 'brand'
          }
        />
        {job.completedAt && (
          <p className="mt-2 text-xs text-muted-foreground">
            Tamamlandı: {formatDateTime(job.completedAt)}
          </p>
        )}
        {isRunning && (
          <p className="mt-2 text-xs text-muted-foreground">
            İşlem arka planda sürüyor. Bu sayfa kendi kendine yenilenmez — güncel
            durumu görmek için sayfayı yenileyin.
          </p>
        )}
        {job.errorMessage && (
          <div
            role="alert"
            className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300"
          >
            <strong className="font-semibold">Hata:</strong> {job.errorMessage}
          </div>
        )}
      </DashboardSection>

      {/* Sonuç önizleme */}
      <DashboardSection
        title="Sonuçlar"
        meta={
          job._count.results > 0
            ? `İlk ${job.results.length} / ${job._count.results}`
            : undefined
        }
        padding="none"
        contained
      >
        {job.results.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState
              variant="inline"
              icon={isRunning ? 'question' : 'inbox'}
              title={isRunning ? 'Sonuçlar hazırlanıyor' : 'Sonuç bulunamadı'}
              description={
                isRunning
                  ? 'İşlem devam ediyor. Satırlar tamamlandıkça burada listelenecek.'
                  : 'Bu iş için kayıtlı üretim sonucu yok. CSV dosyasının biçimini kontrol edip yeniden yükleyebilirsiniz.'
              }
              action={
                isRunning
                  ? undefined
                  : { label: 'Yeni Toplu İş', href: '/saas/generate' }
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-border/40 border-t border-border/40">
            {job.results.map((r) => {
              const tags = Array.isArray(r.tags) ? (r.tags as string[]) : [];
              const features = r.inputFeatures
                ? r.inputFeatures.split(',').map((f) => f.trim()).filter(Boolean)
                : [];
              return (
                <li key={r.id} className="p-5">
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-xs tabular-nums text-muted-foreground">
                        Satır #{r.rowIndex + 1}
                      </p>
                      <h3 className="break-words font-semibold text-foreground">
                        {r.inputTitle}
                      </h3>
                    </div>
                    <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {r.inputTokens + r.outputTokens} token
                    </p>
                  </div>

                  {features.length > 0 && (
                    <ul className="mb-2 flex flex-wrap gap-1">
                      {features.slice(0, 6).map((f, i) => (
                        <li key={`${r.id}-f-${i}`}>
                          <StatusBadge size="sm" tone="neutral" label={f} />
                        </li>
                      ))}
                    </ul>
                  )}

                  {r.errorMessage ? (
                    <p
                      role="alert"
                      className="rounded px-3 py-2 text-sm bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                    >
                      {r.errorMessage}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {r.shortDescription && (
                        <p className="text-sm leading-relaxed text-foreground/90">
                          <strong className="mr-2 text-xs uppercase text-muted-foreground">
                            Kısa
                          </strong>
                          {r.shortDescription}
                        </p>
                      )}
                      {r.description && (
                        <details className="text-sm text-foreground/90">
                          <summary className="cursor-pointer text-xs text-brand-primary hover:underline">
                            Uzun açıklamayı göster
                          </summary>
                          <p className="mt-2 whitespace-pre-line leading-relaxed">
                            {r.description}
                          </p>
                        </details>
                      )}
                      {tags.length > 0 && (
                        <ul className="flex flex-wrap gap-1">
                          {tags.map((t) => (
                            <li key={t}>
                              <StatusBadge size="sm" tone="brand" label={`#${t}`} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </DashboardSection>

      <p className="text-center text-xs text-muted-foreground">
        Workspace: <strong className="font-semibold">{job.workspace.name}</strong>
        {job.outputCsvPath && (
          <>
            {' · '}Çıktı dosyası: <code className="font-mono">{job.outputCsvPath}</code>
          </>
        )}
      </p>
    </div>
  );
}

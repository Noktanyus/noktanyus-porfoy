/**
 * @file SaaS Jobs — Toplu üretim işlerinin listesi.
 * @description Server component; workspace üyeliği olan tüm GenerationJob
 *              kayıtlarını tablo halinde listeler. Status badge + ilerleme
 *              yüzdesi + detaya link.
 *
 * Veri dürüstlüğü: özet sayılar (toplam/tamamlanan/işleniyor/başarısız)
 * doğrudan çekilen kayıtlardan hesaplanır; sabit/örnek değer yoktur.
 *
 * Faz D: `PageHeader`, `StatCard`, `DashboardSection`, `ResponsiveTable`,
 * `EmptyState`, `StatusBadge` ve `ProgressBar` ortak primitive'leri kullanıldı.
 */

import Link from 'next/link';
import { FaPlus } from 'react-icons/fa';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatDateTime } from '@/lib/utils';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { StatCard, StatCardGrid } from '@/components/ui/StatCard';
import { ResponsiveTable } from '@/components/ui/ResponsiveTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge, resolveJobStatus } from '@/components/ui/StatusBadge';
import { ProgressBar, clampPercent } from '@/components/ui/ProgressBar';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Toplu İşler · Noktanyus SaaS',
  description: 'CSV toplu üretim işlerinin durumunu izleyin',
};

export default async function JobsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const userId = session.user.id as string;

  const jobs = await prisma.generationJob.findMany({
    where: {
      workspace: { members: { some: { userId } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      status: true,
      totalRows: true,
      processedRows: true,
      successfulRows: true,
      failedRows: true,
      csvOriginalName: true,
      createdAt: true,
      brandVoice: { select: { name: true } },
    },
  });

  const stats = {
    total: jobs.length,
    completed: jobs.filter((j) => j.status === 'completed').length,
    processing: jobs.filter((j) => j.status === 'processing').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Toplu İşler"
        description="CSV yüklemelerinin durumu ve sonuçları."
        breadcrumb={<span>SaaS / Toplu İşler</span>}
        actions={
          <Link href="/saas/generate" className="admin-btn admin-btn-primary">
            <FaPlus aria-hidden="true" className="w-3 h-3" />
            Yeni Toplu İş
          </Link>
        }
      />

      {/* Özet — yalnızca listelenen kayıtlardan hesaplanır */}
      <StatCardGrid columns={4}>
        <StatCard label="Toplam" value={stats.total} />
        <StatCard label="Tamamlanan" value={stats.completed} tone="success" />
        <StatCard label="İşleniyor" value={stats.processing} tone="warning" />
        <StatCard
          label="Başarısız"
          value={stats.failed}
          tone={stats.failed > 0 ? 'danger' : 'default'}
        />
      </StatCardGrid>

      <DashboardSection
        padding="none"
        contained
        title="İş Geçmişi"
        description={
          jobs.length > 0
            ? `En son ${jobs.length} kayıt gösteriliyor`
            : undefined
        }
      >
        {jobs.length === 0 ? (
          <div className="p-5 pt-0">
            <EmptyState
              variant="inline"
              icon="box"
              title="Henüz toplu iş yok"
              description="CSV yükleyerek ilk toplu üretiminizi başlatın. İşlem arka planda çalışır, bu sayfadan durumunu izleyebilirsiniz."
              action={{ label: 'Şimdi Başla', href: '/saas/generate' }}
            />
          </div>
        ) : (
          <ResponsiveTable
            minWidth="720px"
            caption="Toplu üretim işleri: iş kimliği, marka sesi, durum, ilerleme ve tarih"
            className="rounded-none border-x-0 border-b-0 border-t border-border/40"
          >
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold">İş</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Marka Sesi</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Durum</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">İlerleme</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const pct = clampPercent(
                  job.totalRows > 0 ? (job.processedRows / job.totalRows) * 100 : 0,
                );
                return (
                  <tr
                    key={job.id}
                    className="border-t border-border/40 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 max-w-xs">
                      <Link
                        href={`/saas/jobs/${job.id}`}
                        className="font-mono text-xs text-brand-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      >
                        {job.id}
                      </Link>
                      {job.csvOriginalName && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {job.csvOriginalName}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {job.brandVoice?.name ? (
                        <StatusBadge size="sm" tone="brand" label={job.brandVoice.name} />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">Marka sesi seçilmemiş</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge size="sm" {...resolveJobStatus(job.status)} />
                    </td>
                    <td className="px-4 py-3 min-w-[160px]">
                      <ProgressBar
                        value={pct}
                        showValue
                        label={`${job.csvOriginalName ?? job.id} işi ilerlemesi`}
                        tone={
                          job.status === 'failed'
                            ? 'danger'
                            : job.status === 'completed'
                              ? 'success'
                              : 'brand'
                        }
                      />
                      <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                        {job.processedRows}/{job.totalRows} satır · {job.successfulRows} başarılı
                        {job.failedRows > 0 && ` · ${job.failedRows} hatalı`}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {formatDateTime(job.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </ResponsiveTable>
        )}
      </DashboardSection>
    </div>
  );
}

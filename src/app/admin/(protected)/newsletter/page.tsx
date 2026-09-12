/**
 * Admin — Newsletter Yönetim Sayfası
 *
 * Abone istatistikleri ve son N abone listesi.
 * Server component — Prisma üzerinden doğrudan sorgu.
 *
 * Veri dürüstlüğü: tüm sayılar `newsletterService.getStats()` çıktısıdır.
 *
 * Faz D: yerel `StatCard` kopyası kaldırıldı; ortak `StatCard`, `PageHeader`,
 * `DashboardSection`, `ResponsiveTable`, `EmptyState` ve `StatusBadge`
 * primitive'leri kullanılıyor.
 */

import Link from 'next/link';
import { FaPaperPlane, FaCheck } from 'react-icons/fa';
import { newsletterService } from '@/modules/newsletter';
import { NewsletterSubscriber } from '@prisma/client';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { ResponsiveTable } from '@/components/ui/ResponsiveTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard, StatCardGrid } from '@/components/ui/StatCard';
import { StatusBadge, resolveActiveStatus } from '@/components/ui/StatusBadge';

export const dynamic = 'force-dynamic';

export default async function AdminNewsletterPage() {
  const [stats, subscribers] = await Promise.all([
    newsletterService.getStats(),
    newsletterService.listSubscribers(50),
  ]);

  return (
    <div className="admin-content-spacing">
      <PageHeader
        title="Newsletter Aboneleri"
        description="Blog email abone sistemi — istatistikler ve abone listesi"
        breadcrumb={<span>Admin / Newsletter</span>}
        actions={
          <Link href="/admin/newsletter/broadcast" className="admin-btn admin-btn-primary">
            <FaPaperPlane aria-hidden="true" className="w-3 h-3" />
            Broadcast Gönder
          </Link>
        }
      />

      {/* İstatistik Kartları — canlı DB sayıları */}
      <StatCardGrid columns={3}>
        <StatCard label="Toplam Abone" value={stats.total} />
        <StatCard label="Aktif" value={stats.active} tone="success" />
        <StatCard label="Doğrulanmış" value={stats.verified} tone="info" />
      </StatCardGrid>

      {/* Abone Listesi */}
      <DashboardSection
        title="Son Aboneler"
        description={
          subscribers.length > 0
            ? `En son ${subscribers.length} kayıt gösteriliyor`
            : undefined
        }
        padding="none"
        contained
      >
        {subscribers.length === 0 ? (
          <div className="p-5 pt-0">
            <EmptyState
              variant="inline"
              icon="inbox"
              title="Henüz abone yok"
              description="Footer veya blog üzerinden ilk abone kaydolduğunda burada görünecek."
            />
          </div>
        ) : (
          <ResponsiveTable
            minWidth="720px"
            caption="Newsletter aboneleri: email, isim, kaynak, durum ve kayıt tarihi"
            className="rounded-none border-x-0 border-b-0 border-t border-border/40"
          >
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Email</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">İsim</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Kaynak</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Durum</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Kayıt Tarihi</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((sub) => (
                <SubscriberRow key={sub.id} sub={sub} />
              ))}
            </tbody>
          </ResponsiveTable>
        )}
      </DashboardSection>
    </div>
  );
}

function SubscriberRow({ sub }: { sub: NewsletterSubscriber }) {
  const isActive = sub.active && !sub.unsubscribedAt;

  return (
    <tr className="border-t border-border/40 transition-colors hover:bg-muted/40">
      <td className="px-4 py-3 font-mono text-sm text-foreground">{sub.email}</td>
      <td className="px-4 py-3 text-muted-foreground">
        {sub.name ?? (
          <span className="italic">
            <span aria-hidden="true">—</span>
            <span className="sr-only">İsim girilmemiş</span>
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {sub.source ?? (
          <span className="italic">
            <span aria-hidden="true">—</span>
            <span className="sr-only">Kaynak bilinmiyor</span>
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge size="sm" {...resolveActiveStatus(isActive)} />
          {sub.verifiedAt && (
            <StatusBadge
              size="sm"
              tone="info"
              label="Doğrulandı"
              icon={<FaCheck className="w-2.5 h-2.5" />}
            />
          )}
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
        {new Date(sub.createdAt).toLocaleString('tr-TR')}
      </td>
    </tr>
  );
}

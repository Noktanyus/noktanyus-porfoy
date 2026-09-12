/**
 * @file Admin — Kupon Yönetimi sayfası (sunucu tarafı).
 * @description Tüm kuponları listeler; indirim kampanyalarının durumunu izlemek
 *              için salt-okunur bir görünüm sunar.
 *
 * Faz D:
 *  - "+ Yeni Kupon" CTA'sı KALDIRILDI. `/admin/coupons/new` route'u projede
 *    yok ve kupon oluşturan bir admin API endpoint'i de yok; buton kullanıcıyı
 *    doğrudan 404'e götürüyordu. Bunun yerine sayfanın salt-okunur olduğu
 *    açıkça yazıldı (yeni özellik eklenmedi, yalnızca kırık CTA temizlendi).
 *  - Tablo/boş durum/rozet ortak primitive'lere taşındı.
 */

import { couponService } from '@/modules/commerce/couponService';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { ResponsiveTable } from '@/components/ui/ResponsiveTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard, StatCardGrid } from '@/components/ui/StatCard';
import { StatusBadge, resolveActiveStatus } from '@/components/ui/StatusBadge';

// Her istekte yeniden render — DB'den canlı veri çekmek için
export const dynamic = 'force-dynamic';

type CouponListItem = Awaited<ReturnType<typeof couponService.list>>[number];

function formatDiscount(coupon: CouponListItem): string {
  if (coupon.discountType === 'PERCENTAGE') {
    return `%${coupon.discountValue}`;
  }
  return `${(coupon.discountValue / 100).toFixed(2)} TL`;
}

function formatUsage(coupon: CouponListItem): string {
  return coupon.maxUses ? `${coupon.currentUses}/${coupon.maxUses}` : `${coupon.currentUses}`;
}

/** Kuponun süresi geçmiş mi? */
function isExpired(coupon: CouponListItem): boolean {
  return Boolean(coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now());
}

export default async function AdminCouponsPage() {
  let coupons: CouponListItem[] = [];
  let error: string | null = null;

  try {
    coupons = await couponService.list();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Kuponlar yüklenemedi';
  }

  const header = (
    <PageHeader
      title="Kuponlar"
      description="İndirim kuponlarının durumu ve kullanım sayıları (salt-okunur görünüm)."
      breadcrumb={<span>Admin / Kuponlar</span>}
    />
  );

  if (error) {
    return (
      <div className="admin-content-spacing">
        {header}
        <ErrorDisplay
          variant="card"
          title="Kuponlar yüklenemedi"
          message={error}
          showHomeLink={false}
        />
      </div>
    );
  }

  const activeCount = coupons.filter((c) => c.active && !isExpired(c)).length;
  const expiredCount = coupons.filter(isExpired).length;

  return (
    <div className="admin-content-spacing">
      {header}

      {coupons.length > 0 && (
        <StatCardGrid columns={3}>
          <StatCard label="Toplam kupon" value={coupons.length} />
          <StatCard label="Kullanılabilir" value={activeCount} tone="success" />
          <StatCard
            label="Süresi geçmiş"
            value={expiredCount}
            tone={expiredCount > 0 ? 'warning' : 'default'}
          />
        </StatCardGrid>
      )}

      <DashboardSection padding={coupons.length === 0 ? 'md' : 'none'} contained>
        {coupons.length === 0 ? (
          <EmptyState
            variant="inline"
            icon="inbox"
            title="Henüz kupon yok"
            description="Bu ekran mevcut kuponları listeler. Kupon oluşturma arayüzü bu sürümde bulunmuyor; kuponlar seed/servis katmanı üzerinden tanımlanır."
          />
        ) : (
          <ResponsiveTable
            minWidth="680px"
            caption="Kuponlar: kod, indirim, kullanım, bitiş tarihi ve durum"
            className="rounded-none border-0"
          >
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Kod</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">İndirim</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Kullanım</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Bitiş</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Durum</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const expired = isExpired(c);
                return (
                  <tr
                    key={c.id}
                    className="border-t border-border/40 transition-colors hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-mono font-medium text-foreground">{c.code}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {formatDiscount(c)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {formatUsage(c)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {c.expiresAt
                        ? new Date(c.expiresAt).toLocaleDateString('tr-TR')
                        : 'Süresiz'}
                    </td>
                    <td className="px-4 py-3">
                      {expired ? (
                        <StatusBadge size="sm" tone="warning" dot label="Süresi geçti" />
                      ) : (
                        <StatusBadge size="sm" {...resolveActiveStatus(c.active)} />
                      )}
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

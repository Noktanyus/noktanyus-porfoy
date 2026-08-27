/**
 * @file Admin — Kupon Yönetimi sayfası (sunucu tarafı).
 * @description Tüm kuponları listeler; admin tarafından oluşturulan indirim
 *              kampanyalarını yönetmek için giriş noktasıdır.
 */

import Link from 'next/link';
import { couponService } from '@/modules/commerce/couponService';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';

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

export default async function AdminCouponsPage() {
  let coupons: CouponListItem[] = [];
  let error: string | null = null;

  try {
    coupons = await couponService.list();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Kuponlar yüklenemedi';
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Kuponlar Yüklenemedi"
        message={error}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Kuponlar
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Toplam {coupons.length} kupon
          </p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold bg-brand-primary text-white hover:bg-brand-primary/90 shadow-lg transition-all duration-300"
        >
          + Yeni Kupon
        </Link>
      </div>

      <div className="glass-card-premium overflow-hidden">
        {coupons.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-5xl mb-3" aria-hidden="true">🎟️</p>
            <p>Henüz kupon yok. İlk kuponu oluşturun.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                  <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">
                    Kod
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">
                    İndirim
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">
                    Kullanım
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">
                    Bitiş
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="p-4 font-mono font-medium text-gray-900 dark:text-white">
                      {c.code}
                    </td>
                    <td className="p-4 text-gray-700 dark:text-gray-300">
                      {formatDiscount(c)}
                    </td>
                    <td className="p-4 text-gray-700 dark:text-gray-300">
                      {formatUsage(c)}
                    </td>
                    <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                      {c.expiresAt
                        ? new Date(c.expiresAt).toLocaleDateString('tr-TR')
                        : 'Süresiz'}
                    </td>
                    <td className="p-4">
                      {c.active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" aria-hidden="true" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" aria-hidden="true" />
                          Pasif
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

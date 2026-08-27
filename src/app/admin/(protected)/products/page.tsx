/**
 * @file Admin — Dijital Ürünler yönetim sayfası (sunucu tarafı).
 * @description Aktif ve pasif tüm dijital ürünleri listeler. Ürün ekleme/düzenleme
 *              linkleri sağlar (CRUD işlemleri sonraki sprintte tamamlanacak).
 */

import Link from 'next/link';
import { productRepository } from '@/modules/commerce';
import { formatCurrency } from '@/lib/utils';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';

// Her istekte yeniden render — DB'den canlı veri çekmek için
export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  let products: Awaited<ReturnType<typeof productRepository.findMany>> = [];
  let error: string | null = null;

  try {
    products = await productRepository.findMany({
      orderBy: { createdAt: 'desc' },
    });
  } catch (e) {
    error = e instanceof Error ? e.message : 'Ürünler yüklenemedi';
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Ürünler Yüklenemedi"
        message={error}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Ürünler
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Toplam {products.length} ürün
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold bg-brand-primary text-white hover:bg-brand-primary/90 shadow-lg transition-all duration-300"
        >
          + Yeni Ürün
        </Link>
      </div>

      <div className="glass-card-premium overflow-hidden">
        {products.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-5xl mb-3" aria-hidden="true">📦</p>
            <p>Henüz ürün yok. İlk ürünü ekleyin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                  <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">
                    Ürün
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">
                    Kategori
                  </th>
                  <th className="text-right p-4 font-semibold text-gray-700 dark:text-gray-300">
                    Fiyat
                  </th>
                  <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="p-4">
                      <Link
                        href={`/admin/products/${p.slug}`}
                        className="font-medium text-gray-900 dark:text-white hover:text-brand-primary transition-colors"
                      >
                        {p.title}
                      </Link>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        /{p.slug}
                      </p>
                    </td>
                    <td className="p-4 text-gray-700 dark:text-gray-300">
                      {p.category}
                    </td>
                    <td className="p-4 text-right font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(p.priceCents, p.currency)}
                    </td>
                    <td className="p-4">
                      {p.active ? (
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
                      {p.featured && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          ⭐ Öne Çıkan
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

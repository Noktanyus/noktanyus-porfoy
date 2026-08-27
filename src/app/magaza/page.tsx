import { Metadata } from 'next';
import { commerceService } from '@/modules/commerce';
import nextDynamic from 'next/dynamic';
import { EmptyState } from '@/components/ui/ErrorDisplay';

export const metadata: Metadata = {
  title: 'Mağaza',
  description:
    'Dijital ürünler, yazılım şablonları ve çevrimiçi hizmetler. Hemen indir, kullanmaya başla.',
};

export const dynamic = 'force-dynamic';

// Lazy-load ProductGrid (which pulls in next/image + Link + commerce utils)
// to reduce the initial JS bundle for the /magaza entry chunk.
const ProductGrid = nextDynamic(
  () => import('@/components/commerce/ProductGrid').then((m) => m.ProductGrid),
  {
    loading: () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-80 animate-pulse bg-gray-100/40 dark:bg-gray-800/40 rounded-2xl"
          />
        ))}
      </div>
    ),
  }
);

export default async function MagazaPage() {
  let products: Awaited<ReturnType<typeof commerceService.listProducts>> = [];
  let error: string | null = null;

  try {
    products = await commerceService.listProducts({ take: 50 });
  } catch (e) {
    error = e instanceof Error ? e.message : 'Ürünler yüklenemedi';
  }

  return (
    <div className="container-responsive bg-blob-decoration">
      <div className="relative z-10 space-responsive">
        <div className="mb-12 text-center">
          <h1 className="text-responsive-display font-bold mb-4 text-gray-900 dark:text-white">
            Mağaza
          </h1>
          <p className="text-body-responsive-md text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Dijital ürünler, yazılım şablonları ve hizmetler. Hemen indir, kullanmaya başla.
          </p>
        </div>

        {error && (
          <div className="text-center text-red-600 dark:text-red-400 py-12">
            <p>{error}</p>
          </div>
        )}

        {!error && products.length === 0 && (
          <EmptyState
            title="Henüz ürün yok"
            message="Yakında yeni dijital ürünler eklenecek."
            icon={<span className="text-3xl" aria-hidden="true">🛒</span>}
          />
        )}

        {!error && products.length > 0 && <ProductGrid products={products} />}
      </div>
    </div>
  );
}

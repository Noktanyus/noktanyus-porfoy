/**
 * /magaza/urunler — Sanal ürün kataloğu (template, script, paket).
 * Yalnızca admin tarafından yayınlanan DigitalProduct kayıtları.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { commerceService } from '@/modules/commerce';
import nextDynamic from 'next/dynamic';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { productCategoryLabel } from '@/lib/storeCatalog';

export const metadata: Metadata = {
  title: 'Hazır Paketler',
  description: 'Template, script ve dijital paketler — bir kez satın al, indir, kullan.',
};

export const dynamic = 'force-dynamic';

const ProductGrid = nextDynamic(
  () => import('@/components/commerce/ProductGrid').then((m) => m.ProductGrid),
  {
    loading: () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-80 animate-pulse bg-muted/40 rounded-2xl"
          />
        ))}
      </div>
    ),
  }
);

export default async function MagazaUrunlerPage({
  searchParams,
}: {
  searchParams?: { kategori?: string };
}) {
  let products: Awaited<ReturnType<typeof commerceService.listProducts>> = [];
  let error: string | null = null;

  try {
    products = await commerceService.listProducts({ take: 100 });
  } catch (e) {
    error = e instanceof Error ? e.message : 'Ürünler yüklenemedi';
  }

  const category = searchParams?.kategori?.toLowerCase();
  const filtered = category
    ? products.filter((p) => p.category?.toLowerCase() === category)
    : products;

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  ).sort();

  return (
    <div className="container-responsive space-responsive">
      <PageHeader
        title="Hazır paketler"
        description="Template’ler, script’ler ve indirmeli dijital paketler. Tek seferlik ödeme — hemen kullan."
        backHref="/magaza"
        backLabel="Mağaza"
        breadcrumb={
          <span>
            <Link href="/magaza" className="hover:text-foreground">
              Mağaza
            </Link>
            <span className="mx-1.5 opacity-60">/</span>
            <span className="text-foreground">Hazır paketler</span>
          </span>
        }
      />

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2" role="navigation" aria-label="Kategoriler">
          <Link
            href="/magaza/urunler"
            className={`min-h-[40px] px-4 rounded-xl text-sm font-medium border transition-colors inline-flex items-center ${
              !category
                ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                : 'border-border text-muted-foreground hover:border-brand-primary/40'
            }`}
          >
            Tümü
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/magaza/urunler?kategori=${encodeURIComponent(cat)}`}
              className={`min-h-[40px] px-4 rounded-xl text-sm font-medium border transition-colors inline-flex items-center ${
                category === cat.toLowerCase()
                  ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                  : 'border-border text-muted-foreground hover:border-brand-primary/40'
              }`}
            >
              {productCategoryLabel(cat)}
            </Link>
          ))}
        </div>
      )}

      {error && (
        <p className="text-center text-rose-600 dark:text-rose-400 py-12" role="alert">
          {error}
        </p>
      )}

      {!error && filtered.length === 0 && (
        <EmptyState
          title="Bu kategoride ürün yok"
          description="Yakında yeni template ve script’ler eklenecek."
          icon="box"
          action={{ label: 'Mağazaya dön', href: '/magaza' }}
        />
      )}

      {!error && filtered.length > 0 && <ProductGrid products={filtered} />}
    </div>
  );
}

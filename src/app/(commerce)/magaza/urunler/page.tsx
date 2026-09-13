/**
 * /magaza/urunler — İkincil kanal: hazır dijital paketler (template, script, metin seti).
 * Ana teklif API planı + kredidir; burada yalnızca tek seferlik indirmeli paketler listelenir.
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
  description:
    'Tek seferlik indirmeli şablon ve script paketleri. API kullanımı için aylık plan veya kredi tercih edin.',
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
        description="Küçük, tek seferlik indirmeli paketler: şablon, script ve hazır metin setleri. API erişimi içermez."
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

      <div className="rounded-2xl border border-border/60 bg-muted/20 px-5 py-4 mb-8 text-sm text-muted-foreground max-w-3xl">
        <p>
          Bu sayfa ikincil kanaldır. TR yardımcı API’yi kullanmak istiyorsan{' '}
          <Link href="/magaza/abonelikler" className="text-brand-primary font-medium hover:underline">
            aylık plan
          </Link>{' '}
          veya{' '}
          <Link href="/magaza/krediler" className="text-brand-primary font-medium hover:underline">
            API kredisi
          </Link>{' '}
          al — buradaki paketler API kotası içermez.
        </p>
      </div>

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
          title="Bu kategoride paket yok"
          description="Hazır paket kanalı sınırlı tutuluyor. Ana teklif TR yardımcı API planları ve kredilerdir."
          icon="box"
          action={{ label: 'API planları', href: '/magaza/abonelikler' }}
          secondaryAction={{ label: 'API kredisi', href: '/magaza/krediler' }}
        />
      )}

      {!error && filtered.length > 0 && <ProductGrid products={filtered} />}
    </div>
  );
}

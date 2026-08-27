/**
 * BundleList - Kullanıcının sahip olduğu bundle ürünlerini listeler.
 *
 * Glassmorphism kart tasarımı, modern admin-btn stili ile uyumlu.
 */

'use client';

import Link from 'next/link';
import { FaBoxOpen, FaEdit, FaShoppingBag, FaTag } from 'react-icons/fa';
import { formatCurrency, formatDate } from '@/lib/utils';

interface BundleRow {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  thumbnail: string | null;
  priceCents: number;
  originalPriceCents: number;
  currency: string;
  totalSales: number;
  active: boolean;
  featured: boolean;
  productIds: unknown;
  createdAt: Date | string;
}

interface BundleListProps {
  bundles: BundleRow[];
}

function readProductIds(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  return 0;
}

function discountPercent(original: number, discounted: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - discounted) / original) * 100);
}

export function BundleList({ bundles }: BundleListProps) {
  if (bundles.length === 0) {
    return (
      <div className="glass-card-premium p-12 text-center">
        <FaBoxOpen className="mx-auto w-12 h-12 text-muted-foreground mb-4" aria-hidden="true" />
        <h2 className="text-xl font-semibold mb-2">Henüz bundle oluşturmadınız</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Birden fazla dijital ürünü paketleyip indirimli satışa sunabilirsiniz.
        </p>
        <Link href="/dashboard/bundles/new" className="admin-btn admin-btn-primary inline-block">
          İlk Bundle'ı Oluştur
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {bundles.map((bundle) => {
        const productCount = readProductIds(bundle.productIds);
        const discount = discountPercent(bundle.originalPriceCents, bundle.priceCents);

        return (
          <article
            key={bundle.id}
            className="glass-card-premium p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow"
          >
            <header className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold truncate">{bundle.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {bundle.shortDescription}
                </p>
              </div>
              {bundle.featured && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary whitespace-nowrap">
                  Öne Çıkan
                </span>
              )}
            </header>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <FaBoxOpen className="w-3 h-3" />
                {productCount} ürün
              </span>
              <span className="inline-flex items-center gap-1">
                <FaShoppingBag className="w-3 h-3" />
                {bundle.totalSales} satış
              </span>
              <span className="inline-flex items-center gap-1">
                <FaTag className="w-3 h-3" />
                {bundle.active ? 'Aktif' : 'Pasif'}
              </span>
            </div>

            <div className="border-t border-border/50 pt-3 flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground line-through tabular-nums">
                  {formatCurrency(bundle.originalPriceCents, bundle.currency)}
                </p>
                <p className="text-lg font-bold text-brand-primary tabular-nums">
                  {formatCurrency(bundle.priceCents, bundle.currency)}
                </p>
              </div>
              {discount > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                  %{discount} indirim
                </span>
              )}
            </div>

            <footer className="text-xs text-muted-foreground flex items-center justify-between pt-2 border-t border-border/50">
              <span>{formatDate(bundle.createdAt)}</span>
              <Link
                href={`/dashboard/bundles/${bundle.id}`}
                className="inline-flex items-center gap-1 text-brand-primary hover:underline"
                aria-label={`${bundle.name} bundle'ını düzenle`}
              >
                <FaEdit className="w-3 h-3" />
                Düzenle
              </Link>
            </footer>
          </article>
        );
      })}
    </div>
  );
}

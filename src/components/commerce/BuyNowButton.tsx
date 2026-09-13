'use client';

import Link from 'next/link';
import type { DigitalProduct } from '@prisma/client';

/**
 * Sepet yok — doğrudan ödeme sayfasına gider.
 */
export function BuyNowButton({ product }: { product: DigitalProduct }) {
  return (
    <Link
      href={`/odeme?slug=${encodeURIComponent(product.slug)}`}
      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-bold bg-brand-primary text-white hover:bg-brand-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 min-h-[44px]"
    >
      Satın al
    </Link>
  );
}

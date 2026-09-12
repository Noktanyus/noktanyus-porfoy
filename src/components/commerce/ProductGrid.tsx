'use client';

import { memo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { AnimatedGrid } from '@/components/ui/AnimatedCard';
import type { DigitalProduct } from '@prisma/client';

interface ProductGridProps {
  products: DigitalProduct[];
}

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <AnimatedGrid
      staggerMs={80}
      delayMs={50}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </AnimatedGrid>
  );
}

const ProductCard = memo(function ProductCard({ product }: { product: DigitalProduct }) {
  const techs = Array.isArray(product.technologies)
    ? (product.technologies as unknown[]).map((t) => String(t))
    : [];
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(product.thumbnail) && !imgFailed;

  return (
    <Link
      href={`/magaza/${product.slug}`}
      className="group h-full min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-2xl"
    >
      <article className="h-full card-professional overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl flex flex-col">
        <div className="relative w-full aspect-video bg-muted overflow-hidden">
          {showImage ? (
            <Image
              src={product.thumbnail!}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br from-slate-800 via-brand-primary/80 to-sky-700 flex items-end p-4"
              aria-hidden="true"
            >
              <span className="text-white/90 text-sm font-semibold line-clamp-2">
                {product.title}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 p-5 flex flex-col min-w-0">
          <h3 className="text-lg font-semibold mb-2 line-clamp-2 break-words text-gray-900 dark:text-white">
            {product.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 break-words flex-1">
            {product.shortDescription}
          </p>
          {techs.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {techs.slice(0, 3).map((tech) => (
                <span
                  key={tech}
                  className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 max-w-full truncate"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-gray-200/60 dark:border-gray-700/60">
            <span className="text-lg font-bold text-brand-primary break-words min-w-0">
              {formatCurrency(product.priceCents, product.currency)}
            </span>
            <span className="text-sm text-brand-primary font-medium shrink-0">Detaylar →</span>
          </div>
        </div>
      </article>
    </Link>
  );
});

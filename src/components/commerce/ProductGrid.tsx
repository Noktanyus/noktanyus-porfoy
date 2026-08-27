import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import type { DigitalProduct } from '@prisma/client';

interface ProductGridProps {
  products: DigitalProduct[];
}

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

const ProductCard = memo(function ProductCard({ product }: { product: DigitalProduct }) {
  const techs = Array.isArray(product.technologies)
    ? (product.technologies as unknown[]).map((t) => String(t))
    : [];

  return (
    <Link
      href={`/magaza/${product.slug}`}
      className="group h-full focus:outline-none focus:ring-2 focus:ring-brand-primary rounded-2xl"
    >
      <article className="h-full card-professional overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
        {product.thumbnail && (
          <div className="relative w-full aspect-video bg-muted overflow-hidden">
            <Image
              src={product.thumbnail}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <div className="flex-1 p-5 flex flex-col">
          <h3 className="text-lg font-semibold mb-2 line-clamp-2 text-gray-900 dark:text-white">
            {product.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 flex-1">
            {product.shortDescription}
          </p>
          {techs.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {techs.slice(0, 3).map((tech) => (
                <span
                  key={tech}
                  className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-200/60 dark:border-gray-700/60">
            <span className="text-lg font-bold text-brand-primary">
              {formatCurrency(product.priceCents, product.currency)}
            </span>
            <span className="text-sm text-brand-primary font-medium">Detaylar →</span>
          </div>
        </div>
      </article>
    </Link>
  );
});

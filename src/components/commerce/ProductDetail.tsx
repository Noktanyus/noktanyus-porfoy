import Image from 'next/image';
import { AddToCartButton } from './AddToCartButton';
import { formatCurrency } from '@/lib/utils';
import type { DigitalProduct } from '@prisma/client';

export function ProductDetail({ product }: { product: DigitalProduct }) {
  const techs = Array.isArray(product.technologies)
    ? (product.technologies as unknown[]).map((t) => String(t))
    : [];
  const requirements = Array.isArray(product.requirements)
    ? (product.requirements as unknown[]).map((r) => String(r))
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Image */}
      <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden border border-gray-200/60 dark:border-gray-700/60">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Görsel yok
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <div className="flex flex-wrap gap-1 mb-3">
          <span className="text-xs px-2 py-1 rounded-full bg-brand-primary/10 text-brand-primary font-medium">
            {product.category}
          </span>
          {product.version && (
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              v{product.version}
            </span>
          )}
          {product.featured && (
            <span className="text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">
              ⭐ Öne Çıkan
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
          {product.title}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          {product.shortDescription}
        </p>

        <div className="flex items-baseline gap-3 mb-6">
          <span className="text-3xl font-bold text-brand-primary">
            {formatCurrency(product.priceCents, product.currency)}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">KDV dahil</span>
        </div>

        <AddToCartButton product={product} />

        <div className="mt-6 space-y-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <span aria-hidden="true">📦</span>
            <span>Anında teslim ({product.ttlHours} saat indirme bağlantısı)</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <span aria-hidden="true">🔄</span>
            <span>En fazla {product.downloadCountMax} kez indirebilirsiniz</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <span aria-hidden="true">🔒</span>
            <span>Güvenli ödeme (Stripe)</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="lg:col-span-2 mt-8">
        <div className="glass-card-premium p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Açıklama
          </h2>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
              {product.description}
            </p>
          </div>

          {techs.length > 0 && (
            <>
              <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-900 dark:text-white">
                Teknolojiler
              </h3>
              <div className="flex flex-wrap gap-2">
                {techs.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </>
          )}

          {requirements.length > 0 && (
            <>
              <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-900 dark:text-white">
                Gereksinimler
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {requirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/stores/cartStore';
import { formatCurrency } from '@/lib/utils';

export function CartDrawer({ onClose }: { onClose: () => void }) {
  const items = useCart((s) => s.items);
  const removeItem = useCart((s) => s.removeItem);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const total = useCart((s) => s.total());

  return (
    <div
      className="fixed inset-0 z-[60] flex"
      role="dialog"
      aria-modal="true"
      aria-label="Alışveriş sepeti"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative ml-auto w-full max-w-md bg-white dark:bg-gray-900 h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sepetim ({items.length})
          </h2>
          <button
            onClick={onClose}
            className="text-2xl w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Kapat"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <p className="text-5xl mb-3" aria-hidden="true">
                🛒
              </p>
              <p>Sepetiniz boş</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  {item.thumbnail && (
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                      <Image
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium line-clamp-2 text-gray-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm font-semibold text-brand-primary mt-1">
                      {formatCurrency(item.priceCents)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        className="w-7 h-7 rounded border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Adet azalt"
                      >
                        −
                      </button>
                      <span className="text-sm w-8 text-center text-gray-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        className="w-7 h-7 rounded border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Adet artır"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="ml-auto text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <div className="flex justify-between text-lg font-semibold text-gray-900 dark:text-white">
              <span>Toplam:</span>
              <span className="text-brand-primary">{formatCurrency(total)}</span>
            </div>
            <Link
              href="/odeme"
              onClick={onClose}
              className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl text-base font-bold bg-brand-primary text-white hover:bg-brand-primary/90 shadow-lg transition-all duration-300"
            >
              Ödemeye Geç
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

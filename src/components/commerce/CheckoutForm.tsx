'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useCart } from '@/stores/cartStore';
import { formatCurrency } from '@/lib/utils';

export function CheckoutForm() {
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const clear = useCart((s) => s.clear);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedCayma, setAcceptedCayma] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedCayma) {
      toast.error('Cayma hakkı istisnasını onaylamalısınız');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/checkout/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            priceCents: i.priceCents,
          })),
          customerEmail: email,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message ?? 'Ödeme başlatılamadı');
      }

      // Sepeti temizle ve Stripe'a yönlendir
      clear();
      window.location.href = result.data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-5xl mb-4" aria-hidden="true">
          🛒
        </p>
        <p className="text-lg mb-6 text-gray-700 dark:text-gray-300">
          Sepetiniz boş
        </p>
        <Link
          href="/magaza"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-base font-bold bg-brand-primary text-white hover:bg-brand-primary/90 shadow-lg transition-all duration-300"
        >
          Alışverişe Başla
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
      <div className="glass-card-premium p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
          Ürünler
        </h2>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex justify-between text-sm text-gray-700 dark:text-gray-300"
            >
              <span className="line-clamp-2">
                {item.title} x{item.quantity}
              </span>
              <span className="font-semibold ml-4 whitespace-nowrap">
                {formatCurrency(item.priceCents * item.quantity)}
              </span>
            </div>
          ))}
          <hr className="my-3 border-gray-200 dark:border-gray-700" />
          <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
            <span>Toplam:</span>
            <span className="text-brand-primary">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <div className="glass-card-premium p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
          E-posta
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
            >
              E-posta adresi *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="ornek@email.com"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Lisans ve fatura bu adrese gönderilecek
            </p>
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedCayma}
              onChange={(e) => setAcceptedCayma(e.target.checked)}
              className="mt-1"
              required
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              <a
                href="/yasal/mesafeli-satis"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary hover:underline"
              >
                Mesafeli Satış Sözleşmesi
              </a>
              &apos;ni ve{' '}
              <a
                href="/yasal/cayma-hakki"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary hover:underline"
              >
                Cayma Hakkı
              </a>
              &apos;nın dijital ürünler için{' '}
              <strong>uygulanmadığını</strong> okudum, kabul ediyorum.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl text-base font-bold bg-brand-primary text-white hover:bg-brand-primary/90 shadow-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Yönlendiriliyor...'
              : `🔒 Stripe ile Güvenli Ödeme - ${formatCurrency(total)}`}
          </button>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
            🔒 256-bit SSL şifreleme. Ödeme bilgileriniz sitemizde saklanmaz.
          </p>
        </form>
      </div>
    </div>
  );
}

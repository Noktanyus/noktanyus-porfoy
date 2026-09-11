'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useCart } from '@/stores/cartStore';
import { formatCurrency } from '@/lib/utils';

type PaymentProvider = 'stripe' | 'iyzico';

export function CheckoutForm() {
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const clear = useCart((s) => s.clear);
  const removeItem = useCart((s) => s.removeItem);
  const updateQuantity = useCart((s) => s.updateQuantity);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>('iyzico');
  const [loading, setLoading] = useState(false);
  const [acceptedCayma, setAcceptedCayma] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [discountCents, setDiscountCents] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const payable = Math.max(0, total - discountCents);

  const applyCoupon = async () => {
    if (!email) {
      toast.error('Kupon için önce e-posta girin');
      return;
    }
    if (!couponCode.trim()) {
      toast.error('Kupon kodu girin');
      return;
    }
    setCouponLoading(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          customerEmail: email,
          subtotalCents: total,
          productIds: items.map((i) => i.productId),
        }),
      });
      const result = await res.json();
      if (!result.success || !result.data?.valid) {
        setDiscountCents(0);
        setAppliedCoupon(null);
        throw new Error(result.data?.reason ?? result.error?.message ?? 'Kupon geçersiz');
      }
      setDiscountCents(result.data.discountCents ?? 0);
      setAppliedCoupon(result.data.coupon?.code ?? couponCode.trim().toUpperCase());
      toast.success('Kupon uygulandı');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Kupon doğrulanamadı');
    } finally {
      setCouponLoading(false);
    }
  };

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
          customerName: name || undefined,
          customerPhone: phone || undefined,
          paymentProvider,
          couponCode: appliedCoupon || undefined,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message ?? 'Ödeme başlatılamadı');
      }

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
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex flex-col gap-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 pb-3"
            >
              <div className="flex justify-between gap-3">
                <span className="line-clamp-2 font-medium text-gray-900 dark:text-white">
                  {item.title}
                </span>
                <span className="font-semibold whitespace-nowrap">
                  {formatCurrency(item.priceCents * item.quantity)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="w-7 h-7 rounded border border-gray-300 dark:border-gray-600"
                  aria-label="Adet azalt"
                >
                  −
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="w-7 h-7 rounded border border-gray-300 dark:border-gray-600"
                  aria-label="Adet artır"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeItem(item.productId);
                    setDiscountCents(0);
                    setAppliedCoupon(null);
                  }}
                  className="ml-auto text-xs text-red-600"
                >
                  Kaldır
                </button>
              </div>
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Kupon kodu"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              aria-label="Kupon kodu"
            />
            <button
              type="button"
              onClick={applyCoupon}
              disabled={couponLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white dark:bg-white dark:text-gray-900 disabled:opacity-50"
            >
              {couponLoading ? '...' : 'Uygula'}
            </button>
          </div>
          {appliedCoupon && (
            <p className="text-xs text-green-700 dark:text-green-400">
              {appliedCoupon} uygulandı (−{formatCurrency(discountCents)})
            </p>
          )}

          <hr className="my-3 border-gray-200 dark:border-gray-700" />
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Ara toplam</span>
            <span>{formatCurrency(total)}</span>
          </div>
          {discountCents > 0 && (
            <div className="flex justify-between text-sm text-green-700 dark:text-green-400">
              <span>İndirim</span>
              <span>−{formatCurrency(discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
            <span>Toplam:</span>
            <span className="text-brand-primary">{formatCurrency(payable)}</span>
          </div>
        </div>
      </div>

      <div className="glass-card-premium p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
          Ödeme Bilgileri
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
              onChange={(e) => {
                setEmail(e.target.value);
                setDiscountCents(0);
                setAppliedCoupon(null);
              }}
              required
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="ornek@email.com"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Lisans ve fatura bu adrese gönderilecek
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
              >
                Ad Soyad
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                placeholder="Ad Soyad"
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
              >
                Telefon
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                placeholder="+90 5xx xxx xx xx"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Ödeme Yöntemi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentProvider('iyzico')}
                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  paymentProvider === 'iyzico'
                    ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                }`}
              >
                💳 iyzico (Türkiye)
              </button>
              <button
                type="button"
                onClick={() => setPaymentProvider('stripe')}
                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  paymentProvider === 'stripe'
                    ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                }`}
              >
                🌐 Stripe (Kart)
              </button>
            </div>
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
              : `🔒 ${paymentProvider === 'iyzico' ? 'iyzico' : 'Stripe'} ile Güvenli Ödeme - ${formatCurrency(payable)}`}
          </button>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
            🔒 256-bit SSL şifreleme. Ödeme bilgileriniz sitemizde saklanmaz.
          </p>
        </form>
      </div>
    </div>
  );
}

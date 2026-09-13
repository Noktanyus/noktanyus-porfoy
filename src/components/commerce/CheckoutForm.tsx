'use client';

/**
 * Tek ürün ödemesi — sepet yok; ?slug= ile ürün yüklenir.
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatCurrency, getButtonClass, cn } from '@/lib/utils';
import { PaytrCardForm, type PaytrFormPayload } from '@/components/commerce/PaytrCardForm';

interface PublicProduct {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  priceCents: number;
  currency: string;
  thumbnail: string | null;
  active: boolean;
}

export function CheckoutForm() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');

  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedCayma, setAcceptedCayma] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discountCents, setDiscountCents] = useState(0);
  const [couponLabel, setCouponLabel] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paytrPayload, setPaytrPayload] = useState<PaytrFormPayload | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('Ürün belirtilmedi');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(slug)}`, {
          cache: 'no-store',
        });
        const result = await res.json();
        if (cancelled) return;

        if (!res.ok || !result.success) {
          throw new Error(result.error?.message ?? 'Ürün yüklenemedi');
        }
        const data = result.data as PublicProduct;
        if (!data.active) {
          throw new Error('Bu ürün satışta değil');
        }
        setProduct(data);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Ürün yüklenemedi');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const total = product?.priceCents ?? 0;
  const payable = Math.max(0, total - discountCents);

  const applyCoupon = async () => {
    if (!product) return;
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
          productIds: [product.id],
        }),
      });
      const json = await res.json();
      const data = json.data ?? json;
      if (!json.success && json.error) {
        throw new Error(json.error.message ?? 'Kupon doğrulanamadı');
      }
      if (!data.valid) {
        setDiscountCents(0);
        setCouponLabel(null);
        toast.error(data.reason ?? 'Kupon geçersiz');
        return;
      }
      setDiscountCents(data.discountCents ?? 0);
      setCouponLabel(data.coupon?.code ?? couponCode.toUpperCase());
      toast.success(`Kupon uygulandı (−${formatCurrency(data.discountCents ?? 0)})`);
    } catch (err) {
      setDiscountCents(0);
      setCouponLabel(null);
      toast.error(err instanceof Error ? err.message : 'Kupon hatası');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
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
          items: [
            {
              productId: product.id,
              quantity: 1,
              priceCents: product.priceCents,
            },
          ],
          customerEmail: email,
          customerName: name || undefined,
          customerPhone: phone || undefined,
          paymentProvider: 'paytr',
          couponCode: couponLabel || couponCode.trim() || undefined,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message ?? 'Ödeme başlatılamadı');
      }

      const data = result.data;

      if (data.url && (data.mock || !data.fields)) {
        window.location.href = data.url;
        return;
      }

      if (data.fields && data.formAction) {
        setPaytrPayload({
          formAction: data.formAction,
          fields: data.fields,
          orderNumber: data.orderNumber,
        });
        setLoading(false);
        return;
      }

      throw new Error('PayTR form yanıtı eksik');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu');
      setLoading(false);
    }
  };

  if (error && !paytrPayload) {
    return (
      <div className="text-center py-12">
        <p className="text-lg mb-6 text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
        <Link href="/magaza/urunler" className={getButtonClass('primary', 'lg')}>
          Hazır paketlere dön
        </Link>
      </div>
    );
  }

  if (paytrPayload) {
    return (
      <div className="max-w-lg mx-auto">
        <PaytrCardForm payload={paytrPayload} onCancel={() => setPaytrPayload(null)} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12 text-muted-foreground">Ürün yükleniyor…</div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Link
        href={`/magaza/${product.slug}`}
        className={cn(getButtonClass('ghost', 'sm'), 'mb-4 -ml-2')}
      >
        ← Ürüne dön
      </Link>

      <div className="grid grid-cols-1 gap-6">
        <div className="glass-card-premium p-6">
          <h2 className="text-xl font-semibold mb-2 text-foreground">{product.title}</h2>
          <p className="text-sm text-muted-foreground mb-4">{product.shortDescription}</p>
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>Ara toplam</span>
            <span>{formatCurrency(total, product.currency)}</span>
          </div>
          {discountCents > 0 && (
            <div className="flex justify-between text-sm text-emerald-600 mb-1">
              <span>İndirim {couponLabel ? `(${couponLabel})` : ''}</span>
              <span>−{formatCurrency(discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
            <span>Toplam</span>
            <span className="text-brand-primary">
              {formatCurrency(payable, product.currency)}
            </span>
          </div>
        </div>

        <div className="glass-card-premium p-6">
          <h2 className="text-xl font-semibold mb-2">Ödeme bilgileri</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Ödeme: <strong>PayTR</strong>
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block">E-posta *</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                placeholder="ornek@email.com"
              />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="mb-1 block">Ad Soyad</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block">Telefon</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                  placeholder="05xx xxx xx xx"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm mb-1">Kupon kodu</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-2 rounded-xl border border-border bg-background uppercase"
                  placeholder="HOSGELDIN20"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={couponLoading}
                  className="px-4 py-2 rounded-xl border border-brand-primary text-brand-primary text-sm font-semibold min-h-[44px]"
                >
                  Uygula
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
              <span className="text-xs text-muted-foreground">
                Mesafeli satış ve cayma hakkı metinlerini okudum; dijital ürünlerde cayma
                hakkının uygulanmadığını kabul ediyorum.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl text-base font-bold bg-brand-primary text-white disabled:opacity-60 min-h-[44px]"
            >
              {loading ? 'Hazırlanıyor…' : `PayTR ile öde · ${formatCurrency(payable, product.currency)}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

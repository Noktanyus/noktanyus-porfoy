'use client';

/**
 * Tek ürün ödemesi — sepet yok; ?slug= ile ürün yüklenir.
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatCurrency, getButtonClass, cn } from '@/lib/utils';
import {
  PaytrCheckoutView,
  extractPaytrClientPayload,
  type PaytrCheckoutClientPayload,
} from '@/components/commerce/PaytrIframe';
import {
  CheckoutIdentityFields,
  useCheckoutIdentity,
} from '@/hooks/useCheckoutIdentity';
import type { LicensePricingTier } from '@/modules/commerce/types';

interface PublicProduct {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  priceCents: number;
  currency: string;
  thumbnail: string | null;
  active: boolean;
  category?: string;
  requirements?: unknown;
}

export function CheckoutForm() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');
  const tierParam = searchParams.get('tier');
  const daysParam = searchParams.get('days');
  const identity = useCheckoutIdentity();

  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [availableTiers, setAvailableTiers] = useState<LicensePricingTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<LicensePricingTier | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptedCayma, setAcceptedCayma] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discountCents, setDiscountCents] = useState(0);
  const [couponLabel, setCouponLabel] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paytrPayload, setPaytrPayload] = useState<PaytrCheckoutClientPayload | null>(null);

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

        // Parse requirements for pricing tiers
        const reqObj =
          data.requirements &&
          typeof data.requirements === 'object' &&
          !Array.isArray(data.requirements)
            ? (data.requirements as Record<string, unknown>)
            : null;

        const tiers: LicensePricingTier[] = Array.isArray(reqObj?.pricingTiers)
          ? (reqObj?.pricingTiers as LicensePricingTier[])
          : [];

        setAvailableTiers(tiers);

        if (tiers.length > 0) {
          const matched =
            tiers.find(
              (t) =>
                t.id === tierParam ||
                (daysParam && String(t.days) === daysParam) ||
                (tierParam && String(t.days) === tierParam)
            ) ||
            tiers.find((t) => t.isPopular) ||
            tiers[0];
          setSelectedTier(matched);
        }

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
  }, [slug, tierParam, daysParam]);

  const total = selectedTier ? selectedTier.priceCents : (product?.priceCents ?? 0);
  const payable = Math.max(0, total - discountCents);

  const applyCoupon = async () => {
    if (!product) return;
    if (!identity.email) {
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
          customerEmail: identity.email,
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
              priceCents: total,
              tierDays: selectedTier ? selectedTier.days : undefined,
              tierLabel: selectedTier ? selectedTier.label : undefined,
            },
          ],
          customerEmail: identity.email,
          customerName: identity.name || undefined,
          customerPhone: identity.phone || undefined,
          paymentProvider: 'paytr',
          couponCode: couponLabel || couponCode.trim() || undefined,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message ?? 'Ödeme başlatılamadı');
      }

      const data = result.data;

      if (data.url && (data.mock || (!data.fields && !data.iframeUrl))) {
        window.location.href = data.url;
        return;
      }

      const paytr = extractPaytrClientPayload(data as Record<string, unknown>);
      if (paytr) {
        setPaytrPayload(paytr);
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
        <PaytrCheckoutView
          data={paytrPayload as unknown as Record<string, unknown>}
          onCancel={() => setPaytrPayload(null)}
        />
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

          {process.env.NEXT_PUBLIC_PAYTR_TEST_MODE === '1' && (
            <div className="mb-4 flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-700 dark:text-amber-300 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>PayTR Test / Simülasyon Modu Aktif</span>
            </div>
          )}

          {/* Pricing Tiers Selection (if product has tiers) */}
          {availableTiers.length > 0 && (
            <div className="mb-4 pt-3 border-t border-border/60">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Lisans Süresi Paketi
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableTiers.map((tier) => {
                  const isSel = selectedTier?.id === tier.id;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => {
                        setSelectedTier(tier);
                        if (discountCents > 0) {
                          setDiscountCents(0);
                          setCouponLabel(null);
                        }
                      }}
                      className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                        isSel
                          ? 'border-brand-primary bg-brand-primary/10 ring-1 ring-brand-primary font-medium'
                          : 'border-border/70 hover:border-brand-primary/40 bg-muted/20'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-foreground">{tier.label}</span>
                        <span className="font-bold text-brand-primary">
                          {formatCurrency(tier.priceCents, product.currency)}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {tier.days === 0 ? '♾️ Süresiz' : `⏱️ ${tier.days} gün`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>
              Ara toplam {selectedTier ? `(${selectedTier.label})` : ''}
            </span>
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
            <CheckoutIdentityFields identity={identity} />

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
              disabled={loading || !identity.email}
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

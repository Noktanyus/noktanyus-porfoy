'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useCart } from '@/stores/cartStore';
import { formatCurrency } from '@/lib/utils';
import { PaytrCardForm, type PaytrFormPayload } from '@/components/commerce/PaytrCardForm';

export function CheckoutForm() {
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const clear = useCart((s) => s.clear);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedCayma, setAcceptedCayma] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discountCents, setDiscountCents] = useState(0);
  const [couponLabel, setCouponLabel] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [paytrPayload, setPaytrPayload] = useState<PaytrFormPayload | null>(null);

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
          paymentProvider: 'paytr',
          couponCode: couponLabel || couponCode.trim() || undefined,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message ?? 'Ödeme başlatılamadı');
      }

      const data = result.data;
      clear();

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

  if (items.length === 0 && !paytrPayload) {
    return (
      <div className="text-center py-12">
        <p className="text-lg mb-6 text-gray-700 dark:text-gray-300">Sepetiniz boş</p>
        <Link
          href="/magaza"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-base font-bold bg-brand-primary text-white hover:bg-brand-primary/90"
        >
          Alışverişe Başla
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
      <div className="glass-card-premium p-6">
        <h2 className="text-xl font-semibold mb-6">Ürünler</h2>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between text-sm">
              <span className="line-clamp-2">
                {item.title} x{item.quantity}
              </span>
              <span className="font-semibold ml-4 whitespace-nowrap">
                {formatCurrency(item.priceCents * item.quantity)}
              </span>
            </div>
          ))}
          <hr className="my-3 border-border" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Ara toplam</span>
            <span>{formatCurrency(total)}</span>
          </div>
          {discountCents > 0 && (
            <div className="flex justify-between text-sm text-emerald-600">
              <span>İndirim {couponLabel ? `(${couponLabel})` : ''}</span>
              <span>−{formatCurrency(discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold">
            <span>Toplam</span>
            <span className="text-brand-primary">{formatCurrency(payable)}</span>
          </div>
        </div>
      </div>

      <div className="glass-card-premium p-6">
        <h2 className="text-xl font-semibold mb-2">Ödeme Bilgileri</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Ödeme sağlayıcısı: <strong>PayTR</strong> (Türkiye)
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
            {loading ? 'Hazırlanıyor…' : `PayTR ile Devam · ${formatCurrency(payable)}`}
          </button>
        </form>
      </div>
    </div>
  );
}

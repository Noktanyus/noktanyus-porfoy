'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatCurrency, getButtonClass, cn } from '@/lib/utils';
import { PaytrCardForm, type PaytrFormPayload } from '@/components/commerce/PaytrCardForm';

interface PublicPlan {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  interval: string;
  features: string[] | unknown;
}

export function PlanCheckoutForm() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');

  const [plan, setPlan] = useState<PublicPlan | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptedCayma, setAcceptedCayma] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paytrPayload, setPaytrPayload] = useState<PaytrFormPayload | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('Plan belirtilmedi');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/plans/${encodeURIComponent(slug)}`, {
          cache: 'no-store',
        });
        const result = await res.json();
        if (cancelled) return;

        if (!res.ok || !result.success) {
          throw new Error(result.error?.message ?? 'Plan yüklenemedi');
        }
        setPlan(result.data as PublicPlan);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Plan yüklenemedi');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !slug) return;

    if (!acceptedCayma) {
      toast.error('Cayma hakkı istisnasını onaylamalısınız');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/checkout/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug: slug,
          customerEmail: email,
          customerName: name || undefined,
          customerPhone: phone || undefined,
          paymentProvider: 'paytr',
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
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

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-lg mb-6 text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
        <Link href="/fiyatlandirma" className={getButtonClass('primary', 'lg')}>
          Planlara Dön
        </Link>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
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
    <div className="max-w-md mx-auto">
      <Link href="/fiyatlandirma" className={cn(getButtonClass('ghost', 'sm'), 'mb-4 -ml-2')}>
        Planlara Dön
      </Link>

      <div className="glass-card-premium p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2 text-foreground">{plan.name}</h2>
        <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
        <div className="text-3xl font-bold text-brand-primary">
          {formatCurrency(plan.priceCents, plan.currency)}
          <span className="text-base text-muted-foreground font-normal ml-2">
            /{plan.interval.toLowerCase()}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Ödeme: PayTR. Dönem ücreti tek çekimdir; otomatik yenileme yoktur.
        </p>
      </div>

      <div className="glass-card-premium p-6">
        <h2 className="text-xl font-semibold mb-6 text-foreground">Ödeme Bilgileri</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block">E-posta *</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedCayma}
              onChange={(e) => setAcceptedCayma(e.target.checked)}
              className="mt-1"
              required
            />
            <span className="text-xs text-muted-foreground">
              <a
                href="/yasal/mesafeli-satis"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary hover:underline"
              >
                Mesafeli Satış Sözleşmesi
              </a>
              &apos;ni okudum, kabul ediyorum.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl text-base font-bold bg-brand-primary text-white disabled:opacity-60 min-h-[44px]"
          >
            {loading ? 'Hazırlanıyor…' : `PayTR ile Devam · ${formatCurrency(plan.priceCents, plan.currency)}`}
          </button>
        </form>
      </div>
    </div>
  );
}

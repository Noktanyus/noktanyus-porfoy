'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatCurrency, getButtonClass, cn } from '@/lib/utils';
import { intervalLabel } from '@/lib/individualPlans';
import {
  PaytrCheckoutView,
  extractPaytrClientPayload,
  type PaytrCheckoutClientPayload,
} from '@/components/commerce/PaytrIframe';
import {
  CheckoutIdentityFields,
  useCheckoutIdentity,
} from '@/hooks/useCheckoutIdentity';

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
  const identity = useCheckoutIdentity();

  const [plan, setPlan] = useState<PublicPlan | null>(null);
  const [acceptedCayma, setAcceptedCayma] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paytrPayload, setPaytrPayload] = useState<PaytrCheckoutClientPayload | null>(null);

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
    if (!identity.email.trim()) {
      toast.error('E-posta gerekli');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/checkout/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug: slug,
          customerEmail: identity.email,
          customerName: identity.name || undefined,
          customerPhone: identity.phone || undefined,
          paymentProvider: 'paytr',
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
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

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-lg mb-6 text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
        <Link href="/magaza/abonelikler" className={getButtonClass('primary', 'lg')}>
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
        <PaytrCheckoutView
          data={paytrPayload as unknown as Record<string, unknown>}
          onCancel={() => setPaytrPayload(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Link href="/magaza/abonelikler" className={cn(getButtonClass('ghost', 'sm'), 'mb-4 -ml-2')}>
        ← Aylık hizmetlere dön
      </Link>

      <div className="glass-card-premium p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2 text-foreground">{plan.name}</h2>
        <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
        <div className="text-3xl font-bold text-brand-primary">
          {formatCurrency(plan.priceCents, plan.currency)}
          <span className="text-base text-muted-foreground font-normal ml-2">
            / {intervalLabel(plan.interval)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Ödeme: PayTR. Dönem ücreti tek çekimdir; otomatik yenileme yoktur.
        </p>
      </div>

      <div className="glass-card-premium p-6">
        <h2 className="text-xl font-semibold mb-6 text-foreground">Ödeme Bilgileri</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <CheckoutIdentityFields identity={identity} />

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
            disabled={loading || !identity.email}
            className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl text-base font-bold bg-brand-primary text-white disabled:opacity-60 min-h-[44px]"
          >
            {loading
              ? 'Hazırlanıyor…'
              : `PayTR ile Devam · ${formatCurrency(plan.priceCents, plan.currency)}`}
          </button>
        </form>
      </div>
    </div>
  );
}

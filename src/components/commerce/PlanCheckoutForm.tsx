'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { commerceService } from '@/modules/commerce';
import type { Plan } from '@prisma/client';
import { formatCurrency } from '@/lib/utils';

export function PlanCheckoutForm() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');

  const [plan, setPlan] = useState<Plan | null>(null);
  const [email, setEmail] = useState('');
  const [acceptedCayma, setAcceptedCayma] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('Plan belirtilmedi');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const p = await commerceService.getPlan(slug);
        if (!cancelled) setPlan(p);
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
        body: JSON.stringify({ planSlug: slug, customerEmail: email }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message ?? 'Ödeme başlatılamadı');
      }

      window.location.href = result.data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu');
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-5xl mb-4" aria-hidden="true">
          ⚠️
        </p>
        <p className="text-lg mb-6 text-red-600 dark:text-red-400">{error}</p>
        <Link
          href="/fiyatlandirma"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-base font-bold bg-brand-primary text-white hover:bg-brand-primary/90 shadow-lg transition-all duration-300"
        >
          Planlara Dön
        </Link>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="glass-card-premium p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
          {plan.name}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {plan.description}
        </p>
        <div className="text-3xl font-bold text-brand-primary">
          {formatCurrency(plan.priceCents, plan.currency)}
          <span className="text-base text-gray-500 dark:text-gray-400 font-normal ml-2">
            /{plan.interval.toLowerCase()}
          </span>
        </div>
      </div>

      <div className="glass-card-premium p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
          E-posta
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="plan-email"
              className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
            >
              E-posta adresi *
            </label>
            <input
              id="plan-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="ornek@email.com"
            />
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
              &apos;ni okudum, kabul ediyorum.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl text-base font-bold bg-brand-primary text-white hover:bg-brand-primary/90 shadow-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Yönlendiriliyor...' : '🔒 Aboneliği Başlat'}
          </button>
        </form>
      </div>
    </div>
  );
}

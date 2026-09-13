'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatCurrency, getButtonClass } from '@/lib/utils';
import { API_CREDIT_PACKS, type ApiCreditPackSlug } from '@/lib/apiCredits';
import { PaytrCardForm, type PaytrFormPayload } from '@/components/commerce/PaytrCardForm';

export function CreditCheckoutForm() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') as ApiCreditPackSlug | null;
  const pack = API_CREDIT_PACKS.find((p) => p.slug === slug) ?? null;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [paytrPayload, setPaytrPayload] = useState<PaytrFormPayload | null>(null);

  useEffect(() => {
    if (!slug || !pack) setError('Kredi paketi belirtilmedi');
  }, [slug, pack]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pack || !slug) return;
    if (!accepted) {
      toast.error('Dijital hizmet onayını işaretleyin');
      return;
    }

    setSubmitError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/checkout/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packSlug: slug,
          customerName: name || undefined,
          customerPhone: phone || undefined,
          paymentProvider: 'paytr',
        }),
      });
      const result = await response.json();
      if (response.status === 401) {
        toast.error('Kredi yüklemek için giriş yapın');
        const callbackUrl = encodeURIComponent(`/odeme/kredi?slug=${slug}`);
        window.location.href = `/giris?callbackUrl=${callbackUrl}`;
        return;
      }
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? 'PayTR ödemesi başlatılamadı');
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
      throw new Error('PayTR ödeme formu alınamadı. Lütfen tekrar deneyin.');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Ödeme başlatılırken bir hata oluştu';
      setSubmitError(message);
      toast.error(message);
      setLoading(false);
    }
  };

  if (error || !pack) {
    return (
      <div className="text-center py-12">
        <p className="text-lg mb-6 text-red-600" role="alert">
          {error ?? 'Paket bulunamadı'}
        </p>
        <Link href="/magaza/krediler" className={getButtonClass('primary', 'lg')}>
          Kredilere dön
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
    <form onSubmit={handleSubmit} className="glass-card-premium p-6 space-y-5 max-w-lg mx-auto">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">
          Kullandığın kadar öde
        </p>
        <h2 className="text-xl font-bold">{pack.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {pack.credits.toLocaleString('tr-TR')} kredi · {formatCurrency(pack.priceCents, pack.currency)}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Ödeme: <strong>PayTR</strong>. Kart bilgileriniz sitemizde saklanmaz.
        </p>
      </div>

      <label className="block text-sm">
        Ad Soyad
        <input
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      </label>
      <label className="block text-sm">
        Telefon
        <input
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
        />
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-1"
        />
        <span>
          Dijital hizmet / anında erişim olduğunu ve cayma istisnasını kabul ediyorum.
        </span>
      </label>

      {submitError && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`${getButtonClass('primary', 'lg')} w-full disabled:opacity-60`}
      >
        {loading
          ? 'Hazırlanıyor…'
          : `PayTR ile öde · ${formatCurrency(pack.priceCents, pack.currency)}`}
      </button>

      <p className="text-xs text-center text-muted-foreground">
        Ödeme PayTR güvenli altyapısı üzerinden alınır; 3D Secure doğrulaması bankanız
        tarafından istenebilir.
      </p>
    </form>
  );
}

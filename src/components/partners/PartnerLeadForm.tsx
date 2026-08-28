/**
 * PartnerLeadForm — Public landing page'deki lead formu.
 *
 * Partner slug'i prop olarak alir, POST /api/partners/lead'e submit eder.
 * Iyimser UI: success/error inline gosterilir, sayfa yenilenmez.
 */

'use client';

import { useState } from 'react';

interface PartnerLeadFormProps {
  partnerSlug: string;
  partnerName: string;
  source?: string;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export function PartnerLeadForm({
  partnerSlug,
  partnerName,
  source = 'landing_page',
}: PartnerLeadFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.includes('@')) {
      setErrorMsg('Geçerli bir e-posta adresi girin');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/partners/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerSlug,
          customerEmail: email,
          customerName: name || undefined,
          source,
          metadata: { submittedAt: new Date().toISOString() },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error ?? 'Form gönderilemedi, lütfen tekrar deneyin');
        setStatus('error');
        return;
      }
      setStatus('success');
      setEmail('');
      setName('');
    } catch (err) {
      setErrorMsg('Bağlantı hatası, lütfen tekrar deneyin');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div
        className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-900/20"
        role="status"
        aria-live="polite"
      >
        <div className="mb-2 text-2xl">✓</div>
        <h3 className="mb-1 text-lg font-semibold text-green-900 dark:text-green-100">
          Teşekkürler!
        </h3>
        <p className="text-sm text-green-800 dark:text-green-200">
          {partnerName} ekibi sizinle iletişime geçecek.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      noValidate
    >
      <div>
        <label htmlFor="lead-name" className="mb-1 block text-sm font-medium">
          İsim <span className="text-slate-400">(opsiyonel)</span>
        </label>
        <input
          id="lead-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700"
          placeholder="Adınız Soyadınız"
          disabled={status === 'submitting'}
        />
      </div>

      <div>
        <label htmlFor="lead-email" className="mb-1 block text-sm font-medium">
          E-posta <span className="text-red-500">*</span>
        </label>
        <input
          id="lead-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={254}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700"
          placeholder="ornek@firma.com"
          disabled={status === 'submitting'}
        />
      </div>

      {status === 'error' && errorMsg && (
        <div
          role="alert"
          className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
        >
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === 'submitting' ? 'Gönderiliyor...' : 'İletişime Geç'}
      </button>

      <p className="text-center text-xs text-slate-500">
        Bilgileriniz {partnerName} ile paylaşılacaktır.
      </p>
    </form>
  );
}
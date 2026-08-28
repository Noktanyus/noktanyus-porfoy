/**
 * PartnerOnboardingForm — Partner kaydi olusturma formu.
 * POST /api/user/partner endpoint'ine submit eder.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Status = 'idle' | 'submitting' | 'error';

export function PartnerOnboardingForm() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (companyName.length < 2) {
      setErrorMsg('Şirket adı en az 2 karakter olmalı');
      setStatus('error');
      return;
    }
    if (!contactEmail.includes('@')) {
      setErrorMsg('Geçerli bir e-posta girin');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/user/partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          contactEmail,
          website: website || undefined,
          description: description || undefined,
          webhookUrl: webhookUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error ?? 'Kayıt oluşturulamadı');
        setStatus('error');
        return;
      }
      router.refresh();
    } catch (err) {
      setErrorMsg('Bağlantı hatası, lütfen tekrar deneyin');
      setStatus('error');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
      noValidate
    >
      <div>
        <label htmlFor="companyName" className="mb-1 block text-sm font-medium">
          Şirket Adı <span className="text-red-500">*</span>
        </label>
        <input
          id="companyName"
          type="text"
          required
          minLength={2}
          maxLength={120}
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
        />
      </div>

      <div>
        <label htmlFor="contactEmail" className="mb-1 block text-sm font-medium">
          İletişim E-posta <span className="text-red-500">*</span>
        </label>
        <input
          id="contactEmail"
          type="email"
          required
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
        />
      </div>

      <div>
        <label htmlFor="website" className="mb-1 block text-sm font-medium">
          Web Sitesi <span className="text-slate-400">(opsiyonel)</span>
        </label>
        <input
          id="website"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://firma.com"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
        />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium">
          Açıklama <span className="text-slate-400">(opsiyonel)</span>
        </label>
        <textarea
          id="description"
          rows={3}
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
        />
      </div>

      <div>
        <label htmlFor="webhookUrl" className="mb-1 block text-sm font-medium">
          Webhook URL <span className="text-slate-400">(opsiyonel)</span>
        </label>
        <input
          id="webhookUrl"
          type="url"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://api.firma.com/noktanyus-webhook"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700"
        />
        <p className="mt-1 text-xs text-slate-500">
          Lead geldiğinde ve conversion olduğunda imzalı POST bildirimi alırsınız.
        </p>
      </div>

      {status === 'error' && errorMsg && (
        <div role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {status === 'submitting' ? 'Oluşturuluyor...' : 'İş Ortağı Olarak Kayıt Ol'}
      </button>
    </form>
  );
}
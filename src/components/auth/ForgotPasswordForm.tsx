/**
 * ForgotPasswordForm — Phase D.2
 * Email gir → POST /api/auth/forgot-password → success mesajı göster.
 * Email enumeration koruması için her zaman "gönderildi" mesajı gösterir.
 */

'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import Link from 'next/link';
import { DS } from '@/lib/design-system';
import { FormField } from '@/components/ui/FormField';
import { FormSubmitButton } from '@/components/ui/FormSubmitButton';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus first input (a11y + UX)
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage('');

    // Client-side validation
    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMessage('E-posta adresi gerekli');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMessage('Geçerli bir e-posta girin');
      return;
    }

    setStatus('submitting');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      // API her zaman { sent: true } döner — UI tarafında hata göstermiyoruz
      // (email enumeration koruması için başarı/başarısızlık ayrımı yapılmaz).
      void res.json().catch(() => ({}));
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }

  if (status === 'success') {
    return (
      <div className="glass-card-premium p-8 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <svg className="h-7 w-7 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
          E-posta gönderildi
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Eğer <strong>{email}</strong> adresine kayıtlı bir hesap varsa,
          şifre sıfırlama linki gönderdik. Lütfen gelen kutunuzu kontrol edin.
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Link 1 saat geçerlidir.
        </p>
        <Link
          href="/giris"
          className={`${DS.button.secondary} mt-6 inline-flex`}
        >
          ← Giriş sayfasına dön
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="glass-card-premium p-8 space-y-4"
      noValidate
      aria-busy={status === 'submitting'}
    >
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Şifrenizi mi unuttunuz?
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          E-posta adresinizi girin. Size şifre sıfırlama linki gönderelim.
        </p>
      </header>

      <FormField
        id="forgot-email"
        label="E-posta"
        required
        error={errorMessage || undefined}
      >
        {(inputProps) => (
          <input
            {...inputProps}
            ref={emailInputRef}
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            disabled={status === 'submitting'}
            placeholder="ornek@email.com"
            className={DS.input}
          />
        )}
      </FormField>

      <FormSubmitButton
        type="submit"
        loading={status === 'submitting'}
        loadingText="Gönderiliyor..."
        fullWidth
        className="mt-2"
      >
        Sıfırlama linki gönder
      </FormSubmitButton>

      <p className="pt-1 text-center text-sm text-slate-500 dark:text-slate-400">
        <Link href="/giris" className="text-indigo-600 dark:text-indigo-400 hover:underline">
          Giriş sayfasına dön
        </Link>
      </p>
    </form>
  );
}

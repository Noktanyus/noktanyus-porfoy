/**
 * ResetPasswordForm — Phase D.2
 * Email'den gelen ?token= ile yeni şifre belirle.
 */

'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DS } from '@/lib/design-system';
import { FormField } from '@/components/ui/FormField';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { FormSubmitButton } from '@/components/ui/FormSubmitButton';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus first input (a11y + UX)
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  if (!token) {
    return (
      <div className="glass-card-premium p-8 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
          <svg className="h-7 w-7 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
          Geçersiz Link
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Şifre sıfırlama tokeni bulunamadı.
        </p>
        <Link
          href="/sifremi-unuttum"
          className={`${DS.button.primary} mt-6 inline-flex`}
        >
          Yeni link talep et
        </Link>
      </div>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirm) {
      setErrorMessage('Şifreler eşleşmiyor');
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setErrorMessage('Şifre en az 8 karakter, 1 harf ve 1 rakam içermeli');
      return;
    }

    setStatus('submitting');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Şifre sıfırlama başarısız');
      }
      setStatus('success');
      setTimeout(() => router.push('/giris?reset=success'), 2000);
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Bir hata oluştu');
    }
  }

  if (status === 'success') {
    return (
      <div className="glass-card-premium p-8 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <svg className="h-7 w-7 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
          Şifre Güncellendi ✓
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Yeni şifreniz başarıyla kaydedildi. Giriş sayfasına yönlendiriliyorsunuz...
        </p>
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
          Yeni Şifre Belirle
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Hesabınız için yeni bir şifre belirleyin.
        </p>
      </header>

      {errorMessage && (
        <div
          className={DS.formErrorBanner}
          role="alert"
          aria-live="assertive"
          id="reset-error"
        >
          {errorMessage}
        </div>
      )}

      <FormField
        id="reset-password"
        label="Yeni Şifre"
        required
        helperText="En az 8 karakter, 1 harf ve 1 rakam içermeli"
      >
        {(inputProps) => (
          <PasswordInput
            {...(inputProps as React.ComponentProps<typeof PasswordInput>)}
            hideLabel
            ref={firstInputRef}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            disabled={status === 'submitting'}
            autoComplete="new-password"
            placeholder="En az 8 karakter"
          />
        )}
      </FormField>

      <FormField
        id="reset-confirm"
        label="Yeni Şifre (Tekrar)"
        required
      >
        {(inputProps) => (
          <PasswordInput
            {...(inputProps as React.ComponentProps<typeof PasswordInput>)}
            hideLabel
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            disabled={status === 'submitting'}
            autoComplete="new-password"
            placeholder="Tekrar girin"
          />
        )}
      </FormField>

      <FormSubmitButton
        type="submit"
        loading={status === 'submitting'}
        loadingText="Kaydediliyor..."
        fullWidth
        className="mt-2"
      >
        Şifreyi Güncelle
      </FormSubmitButton>
    </form>
  );
}

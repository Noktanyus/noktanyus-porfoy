/**
 * TwoFactorVerifyForm — Phase D.5
 * Password auth sonrası 2FA aktif kullanıcılar için 6 haneli TOTP kodu
 * veya yedek kod alır. sessionStorage'da tutulan userId ile
 * /api/auth/2fa/verify-login'e gönderir, başarılıysa /dashboard'a redirect.
 */

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { DS } from '@/lib/design-system';
import { FormField } from '@/components/ui/FormField';
import { FormSubmitButton } from '@/components/ui/FormSubmitButton';

type Status = 'idle' | 'submitting' | 'error';

export default function TwoFactorVerifyForm() {
  const router = useRouter();
  const [mode, setMode] = useState<'totp' | 'backup'>('totp');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage('');

    if (typeof window === 'undefined') return;
    const pendingUserId = sessionStorage.getItem('2fa:pending-user-id');
    if (!pendingUserId) {
      setErrorMessage('Önce e-posta ve şifre ile giriş yapmalısınız.');
      setStatus('error');
      return;
    }

    if (mode === 'totp' && !/^[0-9]{6}$/.test(code)) {
      setErrorMessage('6 haneli kod girin');
      return;
    }
    if (mode === 'backup' && code.length < 4) {
      setErrorMessage('Yedek kodu girin');
      return;
    }

    setStatus('submitting');

    try {
      const res = await fetch('/api/auth/2fa/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: pendingUserId,
          code: mode === 'totp' ? code : undefined,
          backupCode: mode === 'backup' ? code : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || '2FA doğrulama başarısız');
      }
      sessionStorage.removeItem('2fa:pending-user-id');
      router.push('/dashboard?2fa=verified');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Bir hata oluştu');
      setCode('');
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="glass-card-premium p-8 space-y-4"
      noValidate
      aria-busy={status === 'submitting'}
    >
      <div className="text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <svg className="h-7 w-7 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">
          İki Faktörlü Doğrulama
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {mode === 'totp'
            ? 'Authenticator uygulamanızdaki 6 haneli kodu girin'
            : 'Yedek kodunuzu girin (tek kullanımlık)'}
        </p>
      </div>

      {errorMessage && (
        <div
          className={`${DS.formErrorBanner} mt-6`}
          role="alert"
          aria-live="assertive"
        >
          {errorMessage}
        </div>
      )}

      <FormField
        id="2fa-code"
        label={mode === 'totp' ? '6 Haneli Kod' : 'Yedek Kod'}
        className="mt-2"
      >
        {(inputProps) => (
          <input
            {...inputProps}
            type="text"
            inputMode={mode === 'totp' ? 'numeric' : 'text'}
            autoComplete={mode === 'totp' ? 'one-time-code' : 'off'}
            maxLength={mode === 'totp' ? 6 : 16}
            value={code}
            onChange={(e) => {
              const v = mode === 'totp' ? e.target.value.replace(/\D/g, '') : e.target.value;
              setCode(v);
            }}
            placeholder={mode === 'totp' ? '123456' : 'XXXX-XXXX'}
            autoFocus
            className="w-full text-center text-3xl tracking-widest font-mono rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 min-h-[44px] text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition disabled:opacity-50"
          />
        )}
      </FormField>

      <FormSubmitButton
        type="submit"
        loading={status === 'submitting'}
        loadingText="Doğrulanıyor..."
        disabled={!code}
        fullWidth
        className="mt-6"
        variant="primary"
      >
        Doğrula
      </FormSubmitButton>

      <button
        type="button"
        onClick={() => {
          setMode((m) => (m === 'totp' ? 'backup' : 'totp'));
          setCode('');
          setErrorMessage('');
        }}
        className="mt-4 w-full text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 min-h-[44px] inline-flex items-center justify-center"
      >
        {mode === 'totp' ? 'Yedek kod kullan →' : '← Authenticator koduna dön'}
      </button>
    </form>
  );
}

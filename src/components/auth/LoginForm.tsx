'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import toast from 'react-hot-toast';
import { DS } from '@/lib/design-system';
import { FormField } from '@/components/ui/FormField';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { FormSubmitButton } from '@/components/ui/FormSubmitButton';
import { postLoginRedirect } from '@/lib/appRole';
import { AuthDivider, SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import CloudflareTurnstile from '@/components/CloudflareTurnstile';
import type { SocialProviderId } from '@/lib/authProviders';

export function LoginForm({
  socialProviders = ['google'],
}: {
  socialProviders?: SocialProviderId[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (urlError) {
      if (urlError === 'OAuthSignin' || urlError === 'OAuthCallback') {
        setError('Google ile giriş sırasında bir sorun oluştu. Lütfen tekrar deneyin veya e-posta ile giriş yapın.');
      } else if (urlError === 'OAuthAccountNotLinked') {
        setError('Bu e-posta adresi başka bir yöntemle kayıtlı. Lütfen şifrenizle giriş yapın.');
      } else if (urlError === 'Callback') {
        setError('Kimlik doğrulama geri çağrısında hata oluştu.');
      } else if (urlError === 'AccessDenied') {
        setError('Google hesabı erişimi reddedildi.');
      } else {
        setError(`Kimlik doğrulama hatası (${urlError}).`);
      }
    }
  }, [urlError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError(null);

    // Client-side validation
    if (!email.trim()) {
      setEmailError('E-posta adresi gerekli');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Geçerli bir e-posta girin');
      return;
    }
    if (!password) {
      setError('Şifre gerekli');
      return;
    }

    const hasTurnstileKey = Boolean(
      process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ||
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    );

    if (hasTurnstileKey && !turnstileToken) {
      setError('Lütfen güvenlik doğrulamasını tamamlayın.');
      return;
    }

    setLoading(true);

    try {
      if (hasTurnstileKey && turnstileToken) {
        const verifyRes = await fetch('/api/verify-turnstile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: turnstileToken }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success) {
          setError('Güvenlik doğrulaması başarısız. Lütfen tekrar deneyin.');
          setTurnstileToken('');
          setLoading(false);
          return;
        }
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError('Email veya şifre hatalı');
        toast.error('Giriş başarısız. Bilgilerinizi kontrol edin.');
        return;
      }

      toast.success('Başarıyla giriş yaptınız!');
      const destination = postLoginRedirect(undefined, callbackUrl);
      if (typeof window !== 'undefined') {
        window.location.assign(destination);
      } else {
        router.push(destination);
        router.refresh();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Giriş başarısız';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {socialProviders.length > 0 && (
        <>
          <SocialAuthButtons
            callbackUrl={callbackUrl}
            mode="login"
            providers={socialProviders}
          />
          <AuthDivider label="veya e-posta ile giriş yap" />
        </>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        noValidate
        aria-busy={loading}
        aria-describedby={error ? 'login-error' : undefined}
      >
        {error && (
          <div
            id="login-error"
            className={DS.formErrorBanner}
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        <FormField
          id="email"
          label="E-posta"
          required
          error={emailError ?? undefined}
        >
          {(inputProps) => (
            <input
              {...inputProps}
              ref={firstInputRef}
              name="email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              required
              disabled={loading}
              className={DS.input}
              placeholder="ornek@email.com"
              autoComplete="email"
            />
          )}
        </FormField>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="password" className={DS.label}>
              Şifre
            </label>
            <Link
              href="/sifremi-unuttum"
              className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded min-h-[44px] inline-flex items-center"
            >
              Şifremi unuttum
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            hideLabel
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'login-error' : undefined}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        <div className="py-1 flex justify-center">
          <CloudflareTurnstile
            onVerify={(token) => {
              setTurnstileToken(token);
              setError(null);
            }}
            onError={() => setTurnstileToken('')}
            onExpire={() => setTurnstileToken('')}
          />
        </div>

        <FormSubmitButton
          type="submit"
          loading={loading}
          loadingText="Giriş yapılıyor..."
          fullWidth
          className="mt-2"
        >
          Giriş Yap
        </FormSubmitButton>
      </form>
    </div>
  );
}

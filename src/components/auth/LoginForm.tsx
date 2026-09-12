'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { DS } from '@/lib/design-system';
import { FormField } from '@/components/ui/FormField';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { FormSubmitButton } from '@/components/ui/FormSubmitButton';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus first input (a11y + UX)
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

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

    setLoading(true);

    try {
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

      // Session'ı yeniden oku çünkü signIn callback'inde JWT yeni oluşmuş olabilir.
      const session = await getSession();
      const role = (session?.user as { role?: string } | undefined)?.role;

      toast.success('Başarıyla giriş yaptınız!');

      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push(callbackUrl);
      }
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Giriş başarısız';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );
}

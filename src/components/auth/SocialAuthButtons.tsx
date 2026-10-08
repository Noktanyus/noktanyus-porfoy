'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import toast from 'react-hot-toast';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { DS } from '@/lib/design-system';
import { cn } from '@/lib/utils';

type SocialProvider = 'google' | 'github';

interface SocialAuthButtonsProps {
  /** OAuth sonrası yönlendirme (varsayılan: /dashboard) */
  callbackUrl?: string;
  /** Buton metni bağlamı */
  mode?: 'login' | 'register';
  /** Hangi sağlayıcılar gösterilsin */
  providers?: SocialProvider[];
  className?: string;
}

function GoogleIcon({ className }: { className?: string }) {
  return <FaGoogle className={className} aria-hidden="true" />;
}

function GitHubIcon({ className }: { className?: string }) {
  return <FaGithub className={className} aria-hidden="true" />;
}

const PROVIDER_META: Record<
  SocialProvider,
  { labelLogin: string; labelRegister: string; Icon: typeof GoogleIcon; className: string }
> = {
  google: {
    labelLogin: 'Google ile giriş yap',
    labelRegister: 'Google ile kayıt ol',
    Icon: GoogleIcon,
    className:
      'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800',
  },
  github: {
    labelLogin: 'GitHub ile giriş yap',
    labelRegister: 'GitHub ile kayıt ol',
    Icon: GitHubIcon,
    className:
      'border-slate-800 dark:border-slate-600 bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700',
  },
};

export function SocialAuthButtons({
  callbackUrl = '/dashboard',
  mode = 'login',
  providers = ['google'],
  className,
}: SocialAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);

  const handleSocial = async (provider: SocialProvider) => {
    setLoadingProvider(provider);
    try {
      await signIn(provider, { callbackUrl });
    } catch {
      toast.error(
        provider === 'google'
          ? 'Google ile giriş başlatılamadı. Lütfen tekrar deneyin.'
          : 'GitHub ile giriş başlatılamadı. Lütfen tekrar deneyin.'
      );
      setLoadingProvider(null);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {providers.map((provider) => {
        const meta = PROVIDER_META[provider];
        const Icon = meta.Icon;
        const label = mode === 'register' ? meta.labelRegister : meta.labelLogin;
        const isLoading = loadingProvider === provider;

        return (
          <button
            key={provider}
            type="button"
            onClick={() => handleSocial(provider)}
            disabled={loadingProvider !== null}
            className={cn(
              DS.button.secondary,
              'w-full border font-semibold',
              meta.className,
              'disabled:opacity-60 disabled:cursor-not-allowed'
            )}
            aria-label={label}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden="true"
                />
                Yönlendiriliyor…
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function AuthDivider({ label = 'veya e-posta ile devam et' }: { label?: string }) {
  return (
    <div className="relative my-6" role="separator" aria-label={label}>
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-slate-200 dark:border-slate-700" />
      </div>
      <div className="relative flex justify-center text-xs uppercase tracking-wide">
        <span className="bg-card px-3 text-slate-500 dark:text-slate-400">
          {label}
        </span>
      </div>
    </div>
  );
}

export default SocialAuthButtons;

'use client';

/**
 * Checkout kimlik ön doldurma — oturum + (varsa) Customer kaydı.
 * Eksik alanları UI'da gösterir; dolu olanları gizler.
 */

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

export interface CheckoutIdentity {
  email: string;
  name: string;
  phone: string;
  /** Oturum yüklendi mi */
  ready: boolean;
  /** Giriş yapılmış mı */
  authenticated: boolean;
  missing: {
    email: boolean;
    name: boolean;
    phone: boolean;
  };
  /** Hepsi doluysa true — sadece sözleşme + öde yeterli */
  canPayFast: boolean;
  setEmail: (v: string) => void;
  setName: (v: string) => void;
  setPhone: (v: string) => void;
}

function looksLikePhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10;
}

export function useCheckoutIdentity(): CheckoutIdentity {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    let cancelled = false;

    (async () => {
      const sessionEmail = session?.user?.email?.trim() ?? '';
      const sessionName = session?.user?.name?.trim() ?? '';

      if (sessionEmail) setEmail((prev) => prev || sessionEmail);
      if (sessionName) setName((prev) => prev || sessionName);

      if (status === 'authenticated') {
        try {
          const res = await fetch('/api/user/profile', { cache: 'no-store' });
          if (res.ok) {
            const json = await res.json();
            const data = json.data ?? json;
            if (!cancelled) {
              if (typeof data?.email === 'string' && data.email.trim()) {
                setEmail(data.email.trim());
              }
              if (typeof data?.name === 'string' && data.name.trim()) {
                setName(data.name.trim());
              }
              if (typeof data?.phone === 'string' && data.phone.trim()) {
                setPhone(data.phone.trim());
              }
            }
          }
        } catch {
          // profil yoksa session yeterli
        }
      }

      if (!cancelled) setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [session, status]);

  const missing = useMemo(
    () => ({
      email: !email.trim(),
      name: name.trim().length < 2,
      phone: false,
    }),
    [email, name]
  );

  const canPayFast =
    hydrated &&
    status === 'authenticated' &&
    Boolean(email.trim()) &&
    name.trim().length >= 2;

  return {
    email,
    name,
    phone,
    ready: hydrated && status !== 'loading',
    authenticated: status === 'authenticated',
    missing,
    canPayFast,
    setEmail,
    setName,
    setPhone,
  };
}

/** Checkout formlarında ortak kimlik alanları — sadece eksikleri render eder. */
export function CheckoutIdentityFields({
  identity,
  requirePhone = false,
}: {
  identity: CheckoutIdentity;
  requirePhone?: boolean;
}) {
  const showEmail = !identity.authenticated || identity.missing.email;
  const showName = !identity.authenticated || identity.missing.name;
  const showPhone =
    requirePhone || (!identity.authenticated && !looksLikePhone(identity.phone));

  // Hepsi doluysa özet satırı
  if (identity.authenticated && !showEmail && !showName && !showPhone) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm space-y-1">
        <p className="font-medium text-foreground">{identity.name}</p>
        <p className="text-muted-foreground">{identity.email}</p>
        <p className="text-xs text-muted-foreground">
          Hesap bilgileriniz kullanılıyor. Eksik bir şey yok — sözleşmeyi onaylayıp ödeyebilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showEmail && (
        <label className="block text-sm">
          <span className="mb-1 block">E-posta *</span>
          <input
            type="email"
            required
            value={identity.email}
            onChange={(e) => identity.setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-border bg-background"
            placeholder="ornek@email.com"
            autoComplete="email"
          />
        </label>
      )}
      {(showName || showPhone) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {showName && (
            <label className="block text-sm">
              <span className="mb-1 block">Ad Soyad{identity.authenticated ? '' : ''}</span>
              <input
                type="text"
                value={identity.name}
                onChange={(e) => identity.setName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                autoComplete="name"
                required={identity.authenticated}
              />
            </label>
          )}
          {showPhone && (
            <label className="block text-sm">
              <span className="mb-1 block">Telefon</span>
              <input
                type="tel"
                value={identity.phone}
                onChange={(e) => identity.setPhone(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                placeholder="05xx xxx xx xx"
                autoComplete="tel"
              />
            </label>
          )}
        </div>
      )}
      {identity.authenticated && (showEmail || showName) && (
        <p className="text-xs text-muted-foreground">
          Yalnızca eksik hesap bilgileri isteniyor.
        </p>
      )}
    </div>
  );
}

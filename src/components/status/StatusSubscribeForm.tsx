'use client';

/**
 * /durum — kesinti / olay e-posta aboneliği.
 * Newsletter API + `incidents` kategorisi (double opt-in).
 */

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { FaBell, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import {
  STATUS_INCIDENT_CATEGORY,
  STATUS_SUBSCRIBE_SOURCE,
} from '@/lib/statusSubscribe';

interface SubscribeResponse {
  success: boolean;
  data?: {
    message: string;
    alreadySubscribed: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

export function StatusSubscribeForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!email.trim()) {
        toast.error('Lütfen e-posta adresinizi girin');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/newsletter/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            source: STATUS_SUBSCRIBE_SOURCE,
            categories: [STATUS_INCIDENT_CATEGORY],
          }),
        });

        const data: SubscribeResponse = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(
            data.error?.message ?? 'Abonelik işlemi başarısız oldu'
          );
        }

        if (data.data?.alreadySubscribed) {
          toast.success('Bu e-posta zaten kayıtlı — teşekkürler!');
        } else {
          toast.success(
            data.data?.message ??
              "Doğrulama e-postası gönderildi. Lütfen kutunuzu kontrol edin."
          );
          setSubscribed(true);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [email]
  );

  if (subscribed) {
    return (
      <div
        className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-5 py-5 text-center"
        role="status"
        aria-live="polite"
      >
        <FaCheckCircle
          className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3"
          aria-hidden="true"
        />
        <h3 className="text-lg font-bold text-foreground mb-2">
          Onay e-postası yolda
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          <span className="font-mono">{email}</span> adresine doğrulama linki
          gönderdik. Onayladıktan sonra kesinti ve olay güncellemelerini
          alırsınız.
        </p>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="status-subscribe-heading"
      className="rounded-2xl border border-border bg-card/50 dark:bg-slate-900/40 px-5 py-5 space-y-4"
    >
      <div className="flex items-start gap-3">
        <FaBell
          className="w-5 h-5 text-brand-primary shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <h2
            id="status-subscribe-heading"
            className="text-lg font-bold text-foreground"
          >
            Kesinti bildirimi al
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            Olay ve bakım duyurularını e-posta ile alın. Double opt-in: önce
            doğrulama, sonra bildirim.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2" noValidate>
        <label htmlFor="status-subscribe-email" className="sr-only">
          E-posta adresi
        </label>
        <input
          id="status-subscribe-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="ornek@email.com"
          className="admin-input flex-1 min-h-[44px]"
          maxLength={200}
          autoComplete="email"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="admin-btn admin-btn-primary whitespace-nowrap flex items-center justify-center gap-2 min-h-[44px]"
          aria-busy={loading}
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" aria-hidden="true" />
              <span>Gönderiliyor…</span>
            </>
          ) : (
            <span>Abone ol</span>
          )}
        </button>
      </form>
    </section>
  );
}

export default StatusSubscribeForm;

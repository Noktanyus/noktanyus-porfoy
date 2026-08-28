'use client';

/**
 * Newsletter Abone Formu
 *
 * Blog/Footer/Landing page için ortak email abone component'i.
 * POST /api/newsletter/subscribe endpoint'ine bağlanır.
 * Double opt-in: doğrulama email'i gönderilir.
 */

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { FaEnvelope, FaCheckCircle, FaSpinner } from 'react-icons/fa';

interface NewsletterFormProps {
  source?: string;
  variant?: 'default' | 'compact';
}

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

export function NewsletterForm({
  source = 'footer',
  variant = 'default',
}: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
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
            name: name.trim() || undefined,
            source,
          }),
        });

        const data: SubscribeResponse = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(
            data.error?.message ?? 'Abonelik işlemi başarısız oldu'
          );
        }

        if (data.data?.alreadySubscribed) {
          toast.success('Bu e-posta zaten kayıtlı, teşekkürler!');
        } else {
          toast.success(
            data.data?.message ??
              'Doğrulama email\'i gönderildi! Lütfen e-posta kutunuzu kontrol edin.'
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
    [email, name, source]
  );

  // Başarı ekranı
  if (subscribed) {
    return (
      <div
        className="glass-card-premium p-6 text-center"
        role="status"
        aria-live="polite"
      >
        <FaCheckCircle
          className="w-12 h-12 text-green-500 mx-auto mb-3"
          aria-hidden="true"
        />
        <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
          Abonelik Onayı Bekleniyor
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-mono">{email}</span> adresine doğrulama email&apos;i
          gönderdik. Lütfen e-postanızı kontrol edin ve onaylayın.
        </p>
      </div>
    );
  }

  const isCompact = variant === 'compact';

  return (
    <div className="glass-card-premium p-6">
      <div className="flex items-center gap-2 mb-3">
        <FaEnvelope className="text-brand-primary text-lg" aria-hidden="true" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Blog&apos;a Abone Ol
        </h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Yeni yazılardan ve güncellemelerden haberdar olmak için abone olun.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        {!isCompact && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="İsim (opsiyonel)"
            className="admin-input"
            maxLength={100}
            autoComplete="name"
            disabled={loading}
          />
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="ornek@email.com"
            className="admin-input flex-1"
            maxLength={200}
            autoComplete="email"
            disabled={loading}
            aria-label="E-posta adresi"
          />
          <button
            type="submit"
            disabled={loading}
            className="admin-btn admin-btn-primary whitespace-nowrap flex items-center justify-center gap-2"
            aria-busy={loading}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" aria-hidden="true" />
                <span>Gönderiliyor...</span>
              </>
            ) : (
              <span>Abone Ol</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewsletterForm;
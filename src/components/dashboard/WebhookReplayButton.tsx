'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaRedo } from 'react-icons/fa';

export function WebhookReplayButton({ deliveryId }: { deliveryId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/webhooks/deliveries/${deliveryId}/replay`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error?.message ?? 'Replay başarısız');
        return;
      }
      router.refresh();
    } catch {
      setError('Ağ hatası');
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline disabled:opacity-50 min-h-[36px]"
      >
        <FaRedo className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
        {loading ? 'Gönderiliyor…' : 'Yeniden gönder'}
      </button>
      {error && (
        <span className="text-[10px] text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}

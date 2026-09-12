/**
 * @file OAuth Client Revoke Button Bileşeni
 * @description DELETE /api/oauth/clients/[id] çağrısını yapan confirm-butonu.
 *              Soft revoke — geri alınamaz (kullanıcıya confirm modalı gösterilir).
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaBan, FaSpinner } from 'react-icons/fa';

interface Props {
  id: string;
  name: string;
}

export function RevokeClientButton({ id, name }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleRevoke = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/oauth/clients/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message ?? 'İptal başarısız');
      }
      const revokedTokens = data.data?.revokedTokens ?? 0;
      toast.success(
        `"${name}" iptal edildi${
          revokedTokens > 0 ? ` (${revokedTokens} token cascade iptal)` : ''
        }`
      );
      setConfirming(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'İptal başarısız');
    } finally {
      setBusy(false);
    }
  };

  if (confirming) {
    return (
      <div className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={handleRevoke}
          disabled={busy}
          className="admin-btn admin-btn-primary text-xs disabled:opacity-50"
          aria-label={`${name} iptalini onayla`}
        >
          {busy ? (
            <FaSpinner className="w-3 h-3 animate-spin" />
          ) : (
            <FaBan className="w-3 h-3" />
          )}
          Onayla
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={busy}
          className="admin-btn admin-btn-secondary text-xs"
          aria-label="Vazgeç"
        >
          Vazgeç
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-destructive/10 text-destructive transition-colors"
      aria-label={`${name} OAuth client'ını iptal et`}
      title="İptal et (geri alınamaz)"
    >
      <FaBan className="w-3 h-3" />
      İptal
    </button>
  );
}

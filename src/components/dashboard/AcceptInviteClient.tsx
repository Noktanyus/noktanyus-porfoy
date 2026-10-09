'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DS } from '@/lib/design-system';

export function AcceptInviteClient({
  token,
  workspaceId,
}: {
  token: string;
  workspaceId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const accept = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/workspaces/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message ?? 'Davet kabul edilemedi');
      }
      toast.success('Davet kabul edildi');
      router.push(`/dashboard/workspaces/${workspaceId}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={accept}
      disabled={loading}
      className={`${DS.button.primary} px-6 min-h-[44px]`}
    >
      {loading ? 'Kabul ediliyor…' : 'Daveti kabul et'}
    </button>
  );
}

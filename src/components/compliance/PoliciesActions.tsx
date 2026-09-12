/**
 * PoliciesActions — Approve / Publish butonları.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaCheck, FaRocket, FaEdit } from 'react-icons/fa';

interface PoliciesActionsProps {
  policy: {
    id: string;
    approvedAt: string | null;
    publishedAt: string | null;
  };
}

export function PoliciesActions({ policy }: PoliciesActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleApprove = async () => {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/compliance/policies/${policy.id}/approve`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Onaylanamadı');
      toast.success('Policy onaylandı');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async () => {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/compliance/policies/${policy.id}/publish`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({}),
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Yayınlanamadı');
      toast.success('Policy yayınlandı');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  };

  if (policy.publishedAt) {
    return (
      <span className="text-xs text-green-600 inline-flex items-center gap-1">
        <FaRocket className="w-3 h-3" /> Yayında
      </span>
    );
  }

  return (
    <div className="flex gap-2">
      {!policy.approvedAt && (
        <button
          type="button"
          onClick={handleApprove}
          disabled={busy}
          className="admin-btn text-xs"
        >
          <FaCheck className="w-3 h-3" />
          Onayla
        </button>
      )}
      <button
        type="button"
        onClick={handlePublish}
        disabled={busy}
        className="admin-btn admin-btn-primary text-xs"
      >
        <FaRocket className="w-3 h-3" />
        Yayınla
      </button>
    </div>
  );
}

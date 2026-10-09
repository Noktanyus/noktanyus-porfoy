'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaCheck } from 'react-icons/fa';

export function MarkAllReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    try {
      await fetch('/api/user/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ all: true }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="admin-btn admin-btn-primary inline-flex items-center gap-2"
    >
      <FaCheck className="w-3 h-3" aria-hidden="true" />
      {loading ? 'İşleniyor…' : 'Tümünü okundu işaretle'}
    </button>
  );
}

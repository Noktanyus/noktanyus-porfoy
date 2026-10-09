'use client';

import { useState } from 'react';
import { FaCopy, FaCheck } from 'react-icons/fa';

export function ReferralShareClient({
  inviteUrl,
  referralCode,
}: {
  inviteUrl: string;
  referralCode: string;
}) {
  const [copied, setCopied] = useState<'url' | 'code' | null>(null);

  const copy = async (value: string, kind: 'url' | 'code') => {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-4">
      <div>
        <p className="text-sm font-semibold mb-2">Davet linki</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            readOnly
            value={inviteUrl}
            className="flex-1 rounded-xl border border-border bg-background px-3 py-3 text-sm font-mono min-h-[48px]"
          />
          <button
            type="button"
            onClick={() => copy(inviteUrl, 'url')}
            className="admin-btn admin-btn-primary inline-flex items-center justify-center gap-2 min-h-[48px]"
          >
            {copied === 'url' ? <FaCheck /> : <FaCopy />}
            {copied === 'url' ? 'Kopyalandı' : 'Kopyala'}
          </button>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold mb-2">Kod</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            readOnly
            value={referralCode}
            className="flex-1 rounded-xl border border-border bg-background px-3 py-3 text-sm font-mono min-h-[48px]"
          />
          <button
            type="button"
            onClick={() => copy(referralCode, 'code')}
            className="admin-btn admin-btn-secondary inline-flex items-center justify-center gap-2 min-h-[48px]"
          >
            {copied === 'code' ? <FaCheck /> : <FaCopy />}
            Kod
          </button>
        </div>
      </div>
    </div>
  );
}

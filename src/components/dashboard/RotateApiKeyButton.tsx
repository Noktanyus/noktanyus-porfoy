'use client';

import { useState } from 'react';
import { FaSync, FaCopy, FaCheck } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export function RotateApiKeyButton({ keyId }: { keyId: string }) {
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const rotate = async () => {
    if (
      !window.confirm(
        'Secret yenilenecek. Eski anahtar anında geçersiz olur. Devam?'
      )
    ) {
      return;
    }
    setLoading(true);
    setNewKey(null);
    try {
      const res = await fetch(`/api/user/api-keys/${keyId}/rotate`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json?.error?.message ?? 'Döndürme başarısız');
        return;
      }
      setNewKey(json.data.key as string);
      toast.success('Yeni anahtar oluşturuldu — bir kez kopyalayın');
    } catch {
      toast.error('Ağ hatası');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-sm">Secret döndür</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Aynı isim/scope/kota — yeni secret yalnızca bir kez gösterilir.
          </p>
        </div>
        <button
          type="button"
          onClick={rotate}
          disabled={loading}
          className="admin-btn admin-btn-secondary inline-flex items-center gap-2 min-h-[44px]"
        >
          <FaSync className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Yenileniyor…' : 'Döndür'}
        </button>
      </div>
      {newKey && (
        <div className="flex flex-col sm:flex-row gap-2">
          <code className="flex-1 rounded-xl border border-border bg-background px-3 py-3 text-xs font-mono break-all">
            {newKey}
          </code>
          <button
            type="button"
            onClick={copy}
            className="admin-btn admin-btn-primary inline-flex items-center justify-center gap-2 min-h-[44px]"
          >
            {copied ? <FaCheck /> : <FaCopy />}
            {copied ? 'Kopyalandı' : 'Kopyala'}
          </button>
        </div>
      )}
    </div>
  );
}

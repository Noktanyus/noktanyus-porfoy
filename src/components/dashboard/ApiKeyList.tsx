/**
 * @file API Anahtarları List Bileşeni
 * @description Aktif API anahtarlarını listeler, iptal/sil aksiyonları sunar.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaCopy, FaTrash, FaEye, FaSync } from 'react-icons/fa';
import { formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';

export interface ApiKeyRow {
  id: string;
  name: string;
  key: string;
  prefix: string;
  scopes: string[];
  rateLimit: number;
  monthlyQuota: number | null;
  totalRequests: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export function ApiKeyList({
  keys: initialKeysProp,
  initialKeys,
}: {
  keys?: ApiKeyRow[];
  initialKeys?: ApiKeyRow[];
}) {
  const router = useRouter();
  const sourceKeys = initialKeys ?? initialKeysProp ?? [];
  const [keyList, setKeyList] = useState<ApiKeyRow[]>(sourceKeys);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const next = initialKeys ?? initialKeysProp;
    if (next) {
      setKeyList(next);
    }
  }, [initialKeys, initialKeysProp]);

  const refreshKeys = async (showToast = true) => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/user/api-keys', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message ?? 'Liste yenilenemedi');
      }
      setKeyList(data.data || []);
      if (showToast) {
        toast.success('API anahtarları listesi güncellendi');
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Yenileme başarısız');
    } finally {
      setIsRefreshing(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Kopyalandı');
  };

  const handleRevoke = async (id: string, name: string) => {
    if (
      !confirm(
        `"${name}" anahtarını iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
      )
    )
      return;

    setBusyId(id);
    try {
      const res = await fetch(`/api/user/api-keys/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message ?? 'İptal başarısız');
      }
      // Optimistic update: anında listeden çıkar
      setKeyList((prev) => prev.filter((k) => k.id !== id));
      toast.success('API anahtarı iptal edildi');
      router.refresh();
      // Arka planda listeyi doğrula
      refreshKeys(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'İptal başarısız');
    } finally {
      setBusyId(null);
    }
  };

  if (keyList.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => refreshKeys(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted transition-colors disabled:opacity-60"
            title="Listeyi Yenile"
          >
            <FaSync className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Yenileniyor...' : 'Listeyi Yenile'}</span>
          </button>
        </div>
        <EmptyState
          title="Henüz API anahtarı yok"
          description="İlk anahtarını oluşturarak başla. Anahtar sadece oluşturulduğunda gösterilir."
          icon="🔑"
          action={{ label: 'Yeni API Anahtarı', href: '/dashboard/api-keys/new' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-muted-foreground">
          Toplam <strong>{keyList.length}</strong> aktif API anahtarı
        </p>
        <button
          type="button"
          onClick={() => refreshKeys(true)}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted transition-colors disabled:opacity-60 shadow-xs"
          title="Listeyi Yenile"
        >
          <FaSync className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-brand-primary' : ''}`} />
          <span>{isRefreshing ? 'Yenileniyor...' : 'Yenile'}</span>
        </button>
      </div>

      {keyList.map((key) => (
        <div key={key.id} className="glass-card-premium p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate">{key.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs px-2 py-1 rounded bg-muted font-mono">
                  {key.key}
                </code>
                <button
                  type="button"
                  onClick={() => copy(key.key)}
                  className="text-muted-foreground hover:text-foreground p-1"
                  aria-label="Kopyala"
                >
                  <FaCopy className="w-3 h-3" />
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRevoke(key.id, key.name)}
              disabled={busyId === key.id}
              className="p-2 hover:bg-destructive/10 text-destructive rounded transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
              aria-label={`${key.name} API anahtarını iptal et`}
              title="İptal et"
            >
              <FaTrash className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground mb-1">İzinler</p>
              <div className="flex flex-wrap gap-1">
                {(key.scopes ?? []).slice(0, 2).map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-mono"
                  >
                    {s}
                  </span>
                ))}
                {(key.scopes ?? []).length > 2 && (
                  <span className="text-muted-foreground self-center">
                    +{(key.scopes ?? []).length - 2}
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Rate Limit</p>
              <p className="font-medium">{key.rateLimit}/dk</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Toplam İstek</p>
              <p className="font-medium">
                {key.totalRequests.toLocaleString('tr-TR')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Son Kullanım</p>
              <p className="font-medium">
                {key.lastUsedAt ? formatDate(key.lastUsedAt) : (
                  <span className="text-muted-foreground italic">
                    Hiç kullanılmadı
                  </span>
                )}
              </p>
            </div>
          </div>

          {key.monthlyQuota && (
            <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
              <FaEye className="inline w-3 h-3 mr-1" />
              Aylık kota: {key.monthlyQuota.toLocaleString('tr-TR')} istek
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
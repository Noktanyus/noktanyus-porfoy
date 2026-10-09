'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  API_SCOPES_CATALOG,
  API_SCOPE_CATEGORIES,
  type ApiScopeCategoryKey,
} from '@/modules/api-keys/apiScopesCatalog';

type Initial = {
  name: string;
  scopes: string[];
  rateLimit: number;
  monthlyQuota: number | null;
};

export function EditApiKeyForm({
  keyId,
  initial,
}: {
  keyId: string;
  initial: Initial;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [scopes, setScopes] = useState<string[]>(initial.scopes);
  const [rateLimit, setRateLimit] = useState(initial.rateLimit);
  const [monthlyQuota, setMonthlyQuota] = useState(
    initial.monthlyQuota != null ? String(initial.monthlyQuota) : ''
  );
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState<string>('all');

  const filtered = useMemo(() => {
    if (category === 'all') return API_SCOPES_CATALOG;
    return API_SCOPES_CATALOG.filter((s) => s.category === category);
  }, [category]);

  const toggle = (id: string) => {
    setScopes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const save = async () => {
    if (!name.trim() || scopes.length === 0) {
      toast.error('İsim ve en az bir izin gerekli');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/user/api-keys/${keyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          scopes,
          rateLimit,
          monthlyQuota: monthlyQuota ? Number(monthlyQuota) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error?.message || 'Kaydedilemedi');
        return;
      }
      toast.success('Anahtar güncellendi');
      router.push('/dashboard/api-keys');
      router.refresh();
    } catch {
      toast.error('Ağ hatası');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-card-premium p-5 space-y-4">
        <label className="block text-sm font-semibold">
          İsim
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="admin-input mt-1"
          />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block text-sm font-semibold">
            Rate limit / dk
            <input
              type="number"
              min={1}
              max={10000}
              value={rateLimit}
              onChange={(e) => setRateLimit(Number(e.target.value) || 60)}
              className="admin-input mt-1"
            />
          </label>
          <label className="block text-sm font-semibold">
            Aylık kota (opsiyonel)
            <input
              type="number"
              min={1}
              value={monthlyQuota}
              onChange={(e) => setMonthlyQuota(e.target.value)}
              className="admin-input mt-1"
              placeholder="Boş = sınırsız"
            />
          </label>
        </div>
      </section>

      <section className="glass-card-premium p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold">İzinler ({scopes.length})</h2>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="admin-input w-auto text-sm"
          >
            <option value="all">Tüm kategoriler</option>
            {(Object.keys(API_SCOPE_CATEGORIES) as ApiScopeCategoryKey[]).map((k) => (
              <option key={k} value={k}>
                {API_SCOPE_CATEGORIES[k].name}
              </option>
            ))}
          </select>
        </div>
        <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {filtered.map((scope) => {
            const on = scopes.includes(scope.id);
            return (
              <li key={scope.id}>
                <button
                  type="button"
                  onClick={() => toggle(scope.id)}
                  className={`w-full text-left rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                    on
                      ? 'border-brand-primary/50 bg-brand-primary/10'
                      : 'border-border hover:border-brand-primary/30'
                  }`}
                >
                  <p className="font-semibold">{scope.label}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{scope.id}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="admin-btn admin-btn-primary"
        >
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard/api-keys')}
          className="admin-btn admin-btn-secondary"
        >
          İptal
        </button>
      </div>
    </div>
  );
}

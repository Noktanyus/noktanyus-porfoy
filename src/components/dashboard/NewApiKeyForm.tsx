/**
 * @file Yeni API Anahtarı Form Bileşeni
 * @description Scope seçimi, rate limit ayarı, isim verme. Oluşturulan full key sadece 1 kez gösterilir.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaCopy } from 'react-icons/fa';

interface ScopeOption {
  value: string;
  label: string;
  description: string;
  dangerous?: boolean;
}

const SCOPES: ScopeOption[] = [
  {
    value: 'read:monitor',
    label: 'Monitör Okuma',
    description: 'GET /api/monitors',
  },
  {
    value: 'write:monitor',
    label: 'Monitör Yazma',
    description: 'POST/PATCH /api/monitors',
  },
  {
    value: 'delete:monitor',
    label: 'Monitör Silme',
    description: 'DELETE /api/monitors/:id',
  },
  {
    value: 'read:profile',
    label: 'Profil Okuma',
    description: 'GET /api/user/profile',
  },
  {
    value: 'admin',
    label: 'Tam Erişim',
    description: 'Tüm API endpointleri (önerilmez)',
    dangerous: true,
  },
];

interface CreatedKeyResponse {
  id: string;
  name: string;
  key: string;
  prefix: string;
  warning: string;
}

export function NewApiKeyForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreatedKeyResponse | null>(null);
  const [form, setForm] = useState({
    name: '',
    scopes: ['read:monitor'] as string[],
    rateLimit: 60,
    monthlyQuota: '' as string | number,
  });

  const toggleScope = (scope: string) => {
    setForm((prev) => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter((s) => s !== scope)
        : [...prev.scopes, scope],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.scopes.length === 0) {
      toast.error('En az 1 izin seçmelisiniz');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        scopes: form.scopes,
        rateLimit: form.rateLimit,
        ...(form.monthlyQuota
          ? { monthlyQuota: Number(form.monthlyQuota) }
          : {}),
      };

      const res = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message ?? 'Oluşturma başarısız');
      }
      setCreatedKey(data.data);
      toast.success('API anahtarı oluşturuldu');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (createdKey) {
    return (
      <div className="space-y-4">
        <div className="glass-card-premium p-6 border-2 border-green-500 bg-green-50 dark:bg-green-900/20">
          <h2 className="text-lg font-bold text-green-800 dark:text-green-200 mb-2">
            ✅ API Anahtarı Oluşturuldu
          </h2>
          <p className="text-sm text-green-700 dark:text-green-300 mb-4">
            <strong>Bu anahtarı şimdi kopyalayın.</strong> Bir daha
            gösterilmeyecek — güvenlik nedeniyle sadece bu sefer tam halini
            görüyorsunuz.
          </p>
          <div className="flex items-center gap-2 p-3 bg-background rounded-lg border">
            <code className="text-xs flex-1 overflow-x-auto font-mono break-all">
              {createdKey.key}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(createdKey.key);
                toast.success('Kopyalandı');
              }}
              className="admin-btn admin-btn-primary flex-shrink-0"
            >
              <FaCopy className="w-3 h-3" />
              Kopyala
            </button>
          </div>
          <div className="mt-4 text-xs text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 p-3 rounded">
            <strong>Örnek kullanım:</strong>
            <pre className="mt-1 font-mono text-[10px] overflow-x-auto">
{`curl -H "Authorization: Bearer ${createdKey.key}" \\
  https://yourdomain.com/api/monitors`}
            </pre>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard/api-keys')}
            className="admin-btn admin-btn-secondary"
          >
            Listeye Dön
          </button>
          <button
            type="button"
            onClick={() => {
              setCreatedKey(null);
              setForm({
                name: '',
                scopes: ['read:monitor'],
                rateLimit: 60,
                monthlyQuota: '',
              });
            }}
            className="admin-btn admin-btn-secondary"
          >
            Yeni Oluştur
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card-premium p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium mb-2">
          İsim <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          minLength={2}
          maxLength={100}
          className="admin-input"
          placeholder="Production Server, Mobile App, vb."
        />
        <p className="text-xs text-muted-foreground mt-1">
          Anahtarı tanımlamanız için bir isim (gösterim amaçlı)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          İzinler <span className="text-destructive">*</span>
        </label>
        <div className="space-y-2">
          {SCOPES.map((scope) => (
            <label
              key={scope.value}
              className={`flex items-start gap-3 p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors ${
                form.scopes.includes(scope.value)
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              }`}
            >
              <input
                type="checkbox"
                checked={form.scopes.includes(scope.value)}
                onChange={() => toggleScope(scope.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <p
                  className={`font-medium text-sm ${
                    scope.dangerous ? 'text-destructive' : ''
                  }`}
                >
                  {scope.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {scope.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Rate Limit (istek/dk)
          </label>
          <input
            type="number"
            value={form.rateLimit}
            onChange={(e) =>
              setForm({ ...form, rateLimit: parseInt(e.target.value) || 60 })
            }
            min="1"
            max="10000"
            className="admin-input"
          />
          <p className="text-xs text-muted-foreground mt-1">1-10000 arası</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Aylık Kota <span className="text-xs text-muted-foreground">(opsiyonel)</span>
          </label>
          <input
            type="number"
            value={form.monthlyQuota}
            onChange={(e) =>
              setForm({ ...form, monthlyQuota: e.target.value })
            }
            min="1"
            className="admin-input"
            placeholder="Limitsiz"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Boş bırakırsanız limitsiz
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || form.scopes.length === 0 || !form.name.trim()}
        className="admin-btn admin-btn-primary w-full justify-center"
      >
        {loading ? 'Oluşturuluyor...' : 'API Anahtarı Oluştur'}
      </button>
    </form>
  );
}
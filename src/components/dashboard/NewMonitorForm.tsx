'use client';

/**
 * Dashboard — Yeni Monitör Formu
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

const INTERVALS = [
  { value: 60, label: '1 dakika' },
  { value: 300, label: '5 dakika' },
  { value: 600, label: '10 dakika' },
  { value: 1800, label: '30 dakika' },
  { value: 3600, label: '1 saat' },
];

interface AlertChannelOption {
  id: string;
  name: string;
  type: string;
}

export function NewMonitorForm({ alertChannels = [] }: { alertChannels?: AlertChannelOption[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    url: 'https://',
    type: 'HTTPS',
    intervalSec: 300,
    timeoutSec: 30,
    expectedStatus: 200 as number | null,
    keywordValue: '',
    isPublic: false,
    publicSlug: '',
    alertChannelIds: [] as string[],
  });

  const update = (key: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleAlertChannel = (id: string) => {
    setForm((prev) => ({
      ...prev,
      alertChannelIds: prev.alertChannelIds.includes(id)
        ? prev.alertChannelIds.filter((x) => x !== id)
        : [...prev.alertChannelIds, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        url: form.url,
        type: form.type,
        intervalSec: form.intervalSec,
        timeoutSec: form.timeoutSec,
        expectedStatus: form.expectedStatus ?? null,
        keywordValue: form.keywordValue || null,
        isPublic: form.isPublic,
        alertChannelIds: form.alertChannelIds,
        region: 'auto',
        tags: [],
      };
      if (form.isPublic && form.publicSlug) payload.publicSlug = form.publicSlug;

      const res = await fetch('/api/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Oluşturulamadı');
      toast.success('Monitör oluşturuldu');
      router.push('/dashboard/monitors');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card-premium p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium mb-2">İsim</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          required
          maxLength={100}
          className="admin-input"
          placeholder="Ana Sayfa"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">URL / Host</label>
        <input
          type="text"
          value={form.url}
          onChange={(e) => update('url', e.target.value)}
          required
          maxLength={500}
          className="admin-input"
          placeholder={
            form.type === 'PORT'
              ? 'example.com:80'
              : form.type === 'PING'
              ? 'example.com'
              : 'https://example.com'
          }
        />
        <p className="text-xs text-muted-foreground mt-1">
          {form.type === 'PING' && 'Sadece hostname (port yok)'}
          {form.type === 'PORT' && 'host:port formatında (örn: example.com:80)'}
          {(form.type === 'HTTP' || form.type === 'HTTPS' || form.type === 'KEYWORD' || form.type === 'JSON') &&
            'Tam URL (https://...)'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Tip</label>
          <select
            value={form.type}
            onChange={(e) => update('type', e.target.value)}
            className="admin-input"
          >
            <option value="HTTPS">HTTPS</option>
            <option value="HTTP">HTTP</option>
            <option value="PING">Ping</option>
            <option value="PORT">Port</option>
            <option value="KEYWORD">Keyword</option>
            <option value="JSON">JSON</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Kontrol Aralığı</label>
          <select
            value={form.intervalSec}
            onChange={(e) => update('intervalSec', parseInt(e.target.value, 10))}
            className="admin-input"
          >
            {INTERVALS.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(form.type === 'KEYWORD' || form.type === 'JSON') && (
        <div>
          <label className="block text-sm font-medium mb-2">
            {form.type === 'KEYWORD' ? 'Aranacak Kelime' : 'JSON Path'}
          </label>
          <input
            type="text"
            value={form.keywordValue}
            onChange={(e) => update('keywordValue', e.target.value)}
            maxLength={200}
            className="admin-input"
            placeholder={form.type === 'JSON' ? '$.status' : 'success'}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Beklenen Status (opsiyonel)</label>
          <input
            type="number"
            value={form.expectedStatus ?? ''}
            onChange={(e) =>
              update('expectedStatus', e.target.value ? parseInt(e.target.value, 10) : null)
            }
            min={100}
            max={599}
            className="admin-input"
            placeholder="200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Timeout (saniye)</label>
          <input
            type="number"
            value={form.timeoutSec}
            onChange={(e) => update('timeoutSec', parseInt(e.target.value, 10))}
            min={1}
            max={60}
            className="admin-input"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isPublic}
            onChange={(e) => update('isPublic', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium">Public status page&apos;de göster</span>
        </label>
        {form.isPublic && (
          <input
            type="text"
            value={form.publicSlug}
            onChange={(e) => update('publicSlug', e.target.value)}
            maxLength={60}
            className="admin-input"
            placeholder="public-slug (küçük harf, rakam, tire)"
            pattern="^[a-z0-9-]+$"
          />
        )}
      </div>

      {alertChannels.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">Alert Kanalları</label>
          <div className="space-y-2">
            {alertChannels.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/40 hover:bg-muted cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={form.alertChannelIds.includes(c.id)}
                  onChange={() => toggleAlertChannel(c.id)}
                />
                <span className="text-sm">{c.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">{c.type}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <button type="submit" disabled={loading} className="admin-btn admin-btn-primary w-full">
        {loading ? 'Oluşturuluyor...' : 'Monitör Oluştur'}
      </button>
    </form>
  );
}

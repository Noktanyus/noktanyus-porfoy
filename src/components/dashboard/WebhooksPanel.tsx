'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaPaperPlane, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';

const EVENT_OPTIONS = [
  'order.created',
  'order.paid',
  'order.refunded',
  'subscription.created',
  'subscription.cancelled',
  'monitor.down',
  'monitor.up',
  'user.created',
] as const;

export type WebhookRow = {
  id: string;
  url: string;
  description: string | null;
  events: string[];
  active: boolean;
  secret: string;
  createdAt: string;
  successCount?: number;
  failureCount?: number;
};

export default function WebhooksPanel({ initial }: { initial: WebhookRow[] }) {
  const [items, setItems] = useState(initial);
  const [url, setUrl] = useState('https://webhook.site/');
  const [description, setDescription] = useState('');
  const [events, setEvents] = useState<string[]>(['order.paid']);
  const [creating, setCreating] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [freshSecret, setFreshSecret] = useState<string | null>(null);

  const eventSet = useMemo(() => new Set(events), [events]);

  const toggleEvent = (ev: string) => {
    setEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]
    );
  };

  const create = async () => {
    if (!url.trim() || events.length === 0) {
      toast.error('URL ve en az bir olay gerekli');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/user/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          description: description.trim() || undefined,
          events,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error?.message || 'Oluşturulamadı');
        return;
      }
      const wh = json.data?.webhook ?? json.webhook;
      if (wh?.secret) setFreshSecret(wh.secret);
      const listRes = await fetch('/api/user/webhooks');
      const listJson = await listRes.json();
      const list = listJson.data?.webhooks ?? listJson.webhooks ?? [];
      setItems(list);
      toast.success('Webhook eklendi — secret’ı kaydet');
      setDescription('');
    } catch {
      toast.error('Ağ hatası');
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Bu webhook silinsin mi?')) return;
    try {
      const res = await fetch(`/api/user/webhooks/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        toast.error('Silinemedi');
        return;
      }
      setItems((prev) => prev.filter((w) => w.id !== id));
      toast.success('Silindi');
    } catch {
      toast.error('Ağ hatası');
    }
  };

  const toggleActive = async (row: WebhookRow) => {
    try {
      const res = await fetch(`/api/user/webhooks/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !row.active }),
      });
      if (!res.ok) {
        toast.error('Güncellenemedi');
        return;
      }
      setItems((prev) =>
        prev.map((w) => (w.id === row.id ? { ...w, active: !w.active } : w))
      );
    } catch {
      toast.error('Ağ hatası');
    }
  };

  const testSend = async (id: string) => {
    setTestingId(id);
    try {
      const res = await fetch(`/api/user/webhooks/${id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error?.message || 'Test başarısız');
        return;
      }
      const delivery = json.data?.delivery ?? json.delivery;
      toast.success(
        delivery?.status
          ? `Test gönderildi · ${delivery.status}`
          : 'Test gönderildi'
      );
    } catch {
      toast.error('Ağ hatası');
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {freshSecret && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <p className="font-bold text-amber-900 dark:text-amber-100 mb-1">
            Webhook secret (bir kez gösterilir)
          </p>
          <code className="block break-all font-mono text-xs sm:text-sm">{freshSecret}</code>
          <button
            type="button"
            className="mt-2 text-xs font-semibold underline"
            onClick={() => {
              void navigator.clipboard.writeText(freshSecret);
              toast.success('Kopyalandı');
            }}
          >
            Kopyala
          </button>
        </div>
      )}

      <section className="rounded-2xl border border-border bg-card/50 p-5 space-y-4">
        <h2 className="text-base font-bold flex items-center gap-2">
          <FaPlus className="h-3.5 w-3.5 text-brand-primary" aria-hidden="true" />
          Yeni webhook
        </h2>
        <label className="block text-sm font-semibold">
          Endpoint URL
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono"
            placeholder="https://example.com/webhooks/noktanyus"
          />
        </label>
        <label className="block text-sm font-semibold">
          Açıklama (opsiyonel)
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
          />
        </label>
        <fieldset>
          <legend className="text-sm font-semibold mb-2">Olaylar</legend>
          <div className="flex flex-wrap gap-2">
            {EVENT_OPTIONS.map((ev) => (
              <button
                key={ev}
                type="button"
                onClick={() => toggleEvent(ev)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold border ${
                  eventSet.has(ev)
                    ? 'bg-brand-primary text-white border-brand-primary'
                    : 'border-border text-foreground hover:border-brand-primary/40'
                }`}
              >
                {ev}
              </button>
            ))}
          </div>
        </fieldset>
        <button
          type="button"
          disabled={creating}
          onClick={() => void create()}
          className="admin-btn admin-btn-primary"
        >
          {creating ? 'Kaydediliyor…' : 'Webhook oluştur'}
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold">Kayıtlı webhook’lar ({items.length})</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-2xl border border-dashed border-border p-6">
            Henüz webhook yok. Üst formdan ekle; Test ile HMAC imzalı örnek olay gönder.
          </p>
        ) : (
          items.map((row) => (
            <article
              key={row.id}
              className="rounded-2xl border border-border bg-card/50 p-4 sm:p-5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm break-all">{row.url}</p>
                  {row.description && (
                    <p className="text-sm text-muted-foreground mt-1">{row.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Secret: <span className="font-mono">{row.secret}</span>
                    {' · '}
                    {row.active ? 'Aktif' : 'Pasif'}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {row.events.map((ev) => (
                      <span
                        key={ev}
                        className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold"
                      >
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void testSend(row.id)}
                    disabled={!row.active || testingId === row.id}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-semibold hover:border-brand-primary/40 disabled:opacity-50"
                  >
                    <FaPaperPlane className="h-3 w-3" aria-hidden="true" />
                    {testingId === row.id ? 'Gönderiliyor…' : 'Test'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleActive(row)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-semibold"
                  >
                    {row.active ? (
                      <FaToggleOn className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <FaToggleOff className="h-3.5 w-3.5" />
                    )}
                    {row.active ? 'Pasifleştir' : 'Aktifleştir'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(row.id)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-rose-500/30 px-3 text-xs font-semibold text-rose-700 dark:text-rose-300"
                  >
                    <FaTrash className="h-3 w-3" aria-hidden="true" />
                    Sil
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

'use client';

/**
 * Dashboard — Alert Kanalları Client (CRUD)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  FaEnvelope,
  FaLink,
  FaSlack,
  FaDiscord,
  FaTelegram,
  FaTrash,
  FaPlus,
} from 'react-icons/fa';

interface AlertChannel {
  id: string;
  name: string;
  type: 'EMAIL' | 'WEBHOOK' | 'SLACK' | 'DISCORD' | 'TELEGRAM';
  config: Record<string, any>;
  events: string[];
  active: boolean;
}

const TYPE_ICON: Record<string, any> = {
  EMAIL: FaEnvelope,
  WEBHOOK: FaLink,
  SLACK: FaSlack,
  DISCORD: FaDiscord,
  TELEGRAM: FaTelegram,
};

export function AlertChannelsClient({ initialChannels }: { initialChannels: AlertChannel[] }) {
  const router = useRouter();
  const [channels] = useState<AlertChannel[]>(initialChannels);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'EMAIL' as AlertChannel['type'],
    config: { email: '', webhookUrl: '', botToken: '', chatId: '' },
    events: ['down', 'up'] as string[],
    active: true,
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Alert kanalını silmek istediğinize emin misiniz?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/alert-channels/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Silinemedi');
      toast.success('Silindi');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      // Tip bazlı config temizle
      const cfg: Record<string, string> = {};
      if (form.type === 'EMAIL') cfg.email = form.config.email;
      else if (form.type === 'WEBHOOK' || form.type === 'SLACK' || form.type === 'DISCORD')
        cfg.webhookUrl = form.config.webhookUrl;
      else if (form.type === 'TELEGRAM') {
        cfg.botToken = form.config.botToken;
        cfg.chatId = form.config.chatId;
      }

      const res = await fetch('/api/alert-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          config: cfg,
          events: form.events,
          active: form.active,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Oluşturulamadı');
      toast.success('Alert kanalı oluşturuldu');
      setShowForm(false);
      setForm({ ...form, name: '' });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  };

  const toggleEvent = (ev: string) => {
    setForm((prev) => ({
      ...prev,
      events: prev.events.includes(ev) ? prev.events.filter((e) => e !== ev) : [...prev.events, ev],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="admin-btn admin-btn-primary"
        >
          <FaPlus className="w-3 h-3" />
          {showForm ? 'İptal' : 'Yeni Alert Kanalı'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass-card-premium p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">İsim</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="admin-input"
              placeholder="Production Email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tip</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as AlertChannel['type'] })}
              className="admin-input"
            >
              <option value="EMAIL">Email</option>
              <option value="WEBHOOK">Webhook (Generic)</option>
              <option value="SLACK">Slack</option>
              <option value="DISCORD">Discord</option>
              <option value="TELEGRAM">Telegram</option>
            </select>
          </div>

          {form.type === 'EMAIL' && (
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={form.config.email}
                onChange={(e) => setForm({ ...form, config: { ...form.config, email: e.target.value } })}
                required
                className="admin-input"
                placeholder="ops@example.com"
              />
            </div>
          )}
          {(form.type === 'WEBHOOK' || form.type === 'SLACK' || form.type === 'DISCORD') && (
            <div>
              <label className="block text-sm font-medium mb-2">Webhook URL</label>
              <input
                type="url"
                value={form.config.webhookUrl}
                onChange={(e) =>
                  setForm({ ...form, config: { ...form.config, webhookUrl: e.target.value } })
                }
                required
                className="admin-input"
                placeholder="https://hooks.slack.com/..."
              />
            </div>
          )}
          {form.type === 'TELEGRAM' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2">Bot Token</label>
                <input
                  type="text"
                  value={form.config.botToken}
                  onChange={(e) =>
                    setForm({ ...form, config: { ...form.config, botToken: e.target.value } })
                  }
                  required
                  className="admin-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Chat ID</label>
                <input
                  type="text"
                  value={form.config.chatId}
                  onChange={(e) =>
                    setForm({ ...form, config: { ...form.config, chatId: e.target.value } })
                  }
                  required
                  className="admin-input"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Olaylar</label>
            <div className="flex gap-3">
              {['down', 'up', 'ssl_expiry'].map((ev) => (
                <label key={ev} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={form.events.includes(ev)}
                    onChange={() => toggleEvent(ev)}
                  />
                  {ev}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={busy} className="admin-btn admin-btn-primary">
            {busy ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </form>
      )}

      {channels.length === 0 ? (
        <div className="glass-card-premium p-12 text-center">
          <p className="text-5xl mb-3">🔔</p>
          <p className="text-lg font-medium">Henüz alert kanalı yok</p>
          <p className="text-sm text-muted-foreground mt-2">
            İlk alert kanalınızı oluşturun
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {channels.map((c) => {
            const Icon = TYPE_ICON[c.type] ?? FaLink;
            return (
              <div
                key={c.id}
                className="glass-card-premium p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Icon className="w-5 h-5 text-brand-primary" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.type} • {Array.isArray(c.events) ? c.events.join(', ') : '-'}
                      {!c.active && ' • Pasif'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={busy}
                  className="p-2 hover:bg-destructive/10 text-destructive rounded"
                  title="Sil"
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

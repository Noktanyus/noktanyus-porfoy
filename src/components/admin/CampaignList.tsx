'use client';

/**
 * CampaignList — Admin paneli e-posta kampanya tablosu.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface CampaignRow {
  id: string;
  name: string;
  campaignType: string;
  status: string;
  subject: string;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  scheduledAt: string | null;
  createdAt: string;
  _count: { executions: number };
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Taslak',
  scheduled: 'Zamanlandı',
  running: 'Çalışıyor',
  completed: 'Tamamlandı',
  paused: 'Duraklatıldı',
};

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  running: 'bg-green-100 text-green-800',
  completed: 'bg-purple-100 text-purple-800',
  paused: 'bg-yellow-100 text-yellow-800',
};

const TYPE_LABEL: Record<string, string> = {
  drip: 'Drip',
  broadcast: 'Toplu gönderim',
  behavioral: 'Davranışsal',
};

export function CampaignList({ campaigns }: { campaigns: CampaignRow[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: '',
    campaignType: 'drip',
    subject: '',
    template: '<p>Merhaba {{name}}, hoş geldiniz!</p>',
  });
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = await fetch('/api/admin/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error?.message ?? 'Kampanya oluşturulamadı');
      return;
    }

    setForm({
      name: '',
      campaignType: 'drip',
      subject: '',
      template: '<p>Merhaba {{name}}</p>',
    });
    setShowForm(false);
    startTransition(() => router.refresh());
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">E-posta Kampanyaları</h1>
          <p className="text-sm text-gray-500">
            Drip, toplu gönderim ve davranışsal e-posta kampanyaları
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {showForm ? 'Kapat' : '+ Yeni Kampanya'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="space-y-3 rounded border bg-white p-4 shadow-sm dark:bg-gray-900"
        >
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="Kampanya adı"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded border px-3 py-2"
            />
            <select
              value={form.campaignType}
              onChange={(e) => setForm({ ...form, campaignType: e.target.value })}
              className="rounded border px-3 py-2"
            >
              <option value="drip">Drip</option>
              <option value="broadcast">Toplu gönderim</option>
              <option value="behavioral">Davranışsal</option>
            </select>
          </div>
          <input
            required
            placeholder="E-posta konusu"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full rounded border px-3 py-2"
          />
          <textarea
            required
            placeholder="HTML şablon"
            value={form.template}
            onChange={(e) => setForm({ ...form, template: e.target.value })}
            rows={4}
            className="w-full rounded border px-3 py-2 font-mono text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isPending ? 'Oluşturuluyor...' : 'Oluştur'}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded border bg-white shadow-sm dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left">Ad</th>
              <th className="px-4 py-3 text-left">Tip</th>
              <th className="px-4 py-3 text-left">Durum</th>
              <th className="px-4 py-3 text-right">Gönderilen</th>
              <th className="px-4 py-3 text-right">Açılma</th>
              <th className="px-4 py-3 text-right">Tıklama</th>
              <th className="px-4 py-3 text-left">Tarih</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Henüz kampanya yok
                </td>
              </tr>
            )}
            {campaigns.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.subject}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
                    {TYPE_LABEL[c.campaignType] ?? c.campaignType}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-1 text-xs ${STATUS_COLOR[c.status] ?? 'bg-gray-100'}`}
                  >
                    {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">{c.totalSent}</td>
                <td className="px-4 py-3 text-right">{c.totalOpened}</td>
                <td className="px-4 py-3 text-right">{c.totalClicked}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(c.createdAt).toLocaleDateString('tr-TR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

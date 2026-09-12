/**
 * BreachIncidentForm — KVKK Madde 12 veri ihlali bildirim formu.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaExclamationTriangle } from 'react-icons/fa';

interface ComplianceSite {
  id: string;
  domain: string;
  name: string;
}

interface BreachIncidentFormProps {
  workspaceId: string;
  sites: ComplianceSite[];
}

const SEVERITY_OPTIONS = [
  { value: 'LOW', label: 'Düşük' },
  { value: 'MEDIUM', label: 'Orta' },
  { value: 'HIGH', label: 'Yüksek' },
  { value: 'CRITICAL', label: 'Kritik' },
];

const DATA_CATEGORIES = [
  'email',
  'phone',
  'tc_kimlik',
  'address',
  'payment_info',
  'password',
  'health_data',
  'biometric',
  'location',
  'ip_address',
];

export function BreachIncidentForm({
  workspaceId,
  sites,
}: BreachIncidentFormProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    siteId: '',
    severity: 'MEDIUM',
    title: '',
    description: '',
    affectedUsers: '',
    dataCategories: [] as string[],
    detectedAt: new Date().toISOString().slice(0, 16),
  });

  const update = (field: string, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (cat: string) => {
    setForm((prev) => ({
      ...prev,
      dataCategories: prev.dataCategories.includes(cat)
        ? prev.dataCategories.filter((c) => c !== cat)
        : [...prev.dataCategories, cat],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/compliance/breach', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          siteId: form.siteId || undefined,
          severity: form.severity,
          title: form.title,
          description: form.description,
          affectedUsers: form.affectedUsers ? parseInt(form.affectedUsers, 10) : undefined,
          dataCategories: form.dataCategories,
          detectedAt: new Date(form.detectedAt).toISOString(),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Bildirilemedi');
      toast.success('Veri ihlali kaydedildi');
      router.refresh();
      setForm({
        siteId: '',
        severity: 'MEDIUM',
        title: '',
        description: '',
        affectedUsers: '',
        dataCategories: [],
        detectedAt: new Date().toISOString().slice(0, 16),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-card space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <FaExclamationTriangle className="w-5 h-5 text-red-500" aria-hidden="true" />
        <h3 className="font-semibold">Veri İhlali Bildirimi</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        KVKK Madde 12 uyarınca 72 saat içinde KVKK'ya bildirim yapılmalıdır.
      </p>

      <div>
        <label className="block text-sm font-medium mb-1">
          Başlık <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          className="admin-input w-full"
          placeholder="Kısa ihlal başlığı"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Önem Derecesi</label>
          <select
            value={form.severity}
            onChange={(e) => update('severity', e.target.value)}
            className="admin-input w-full"
          >
            {SEVERITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tespit Zamanı</label>
          <input
            type="datetime-local"
            value={form.detectedAt}
            onChange={(e) => update('detectedAt', e.target.value)}
            className="admin-input w-full"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">İlişkili Site</label>
        <select
          value={form.siteId}
          onChange={(e) => update('siteId', e.target.value)}
          className="admin-input w-full"
        >
          <option value="">— Workspace geneli —</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.domain})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Etkilenen Kullanıcı Sayısı
        </label>
        <input
          type="number"
          min="0"
          value={form.affectedUsers}
          onChange={(e) => update('affectedUsers', e.target.value)}
          className="admin-input w-full"
          placeholder="0"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Etkilenen Veri Kategorileri
        </label>
        <div className="flex flex-wrap gap-2">
          {DATA_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={`text-xs px-3 py-1 rounded-full border transition ${
                form.dataCategories.includes(cat)
                  ? 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/40 dark:border-red-700 dark:text-red-300'
                  : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Açıklama <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          rows={4}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          className="admin-input w-full"
          placeholder="İhlal nasıl gerçekleşti, hangi sistemler etkilendi, alınan aksiyonlar..."
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="admin-btn admin-btn-primary w-full"
      >
        {busy ? 'Kaydediliyor...' : 'İhlal Bildirimini Kaydet'}
      </button>
    </form>
  );
}

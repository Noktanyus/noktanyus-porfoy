/**
 * AddComplianceSiteDialog — Yeni uyumluluk sitesi ekleme modal'ı.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaPlus } from 'react-icons/fa';

interface Workspace {
  id: string;
  name: string;
}

interface AddComplianceSiteDialogProps {
  workspaces: Workspace[];
  defaultWorkspaceId?: string;
}

export function AddComplianceSiteDialog({
  workspaces,
  defaultWorkspaceId,
}: AddComplianceSiteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    workspaceId: defaultWorkspaceId ?? workspaces[0]?.id ?? '',
    domain: '',
    name: '',
    contactEmail: '',
    country: 'TR',
    language: 'tr',
    scanInterval: 'weekly',
    notes: '',
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/compliance/sites', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Eklenemedi');
      toast.success('Site eklendi');
      setOpen(false);
      router.refresh();
      setForm({
        workspaceId: defaultWorkspaceId ?? workspaces[0]?.id ?? '',
        domain: '',
        name: '',
        contactEmail: '',
        country: 'TR',
        language: 'tr',
        scanInterval: 'weekly',
        notes: '',
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="admin-btn admin-btn-primary"
      >
        <FaPlus className="w-3 h-3" />
        Yeni Site Ekle
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !busy && setOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Yeni Uyumluluk Sitesi</h2>

              {workspaces.length > 1 && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Workspace
                  </label>
                  <select
                    value={form.workspaceId}
                    onChange={(e) => update('workspaceId', e.target.value)}
                    className="admin-input w-full"
                    required
                  >
                    {workspaces.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Domain <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="example.com"
                  value={form.domain}
                  onChange={(e) => update('domain', e.target.value.toLowerCase())}
                  className="admin-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Site Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ana Şirket Sitesi"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  className="admin-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  İletişim Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="dpo@example.com"
                  value={form.contactEmail}
                  onChange={(e) => update('contactEmail', e.target.value)}
                  className="admin-input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Ülke (ISO-2)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={form.country}
                    onChange={(e) => update('country', e.target.value.toUpperCase())}
                    className="admin-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Dil</label>
                  <select
                    value={form.language}
                    onChange={(e) => update('language', e.target.value)}
                    className="admin-input w-full"
                  >
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tarama Sıklığı
                </label>
                <select
                  value={form.scanInterval}
                  onChange={(e) => update('scanInterval', e.target.value)}
                  className="admin-input w-full"
                >
                  <option value="daily">Günlük</option>
                  <option value="weekly">Haftalık</option>
                  <option value="monthly">Aylık</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notlar</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  className="admin-input w-full"
                  placeholder="Opsiyonel not..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={busy}
                  className="admin-btn flex-1"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="admin-btn admin-btn-primary flex-1"
                >
                  {busy ? 'Ekleniyor...' : 'Site Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function NewWorkspacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Oluşturulamadı');
      toast.success('Workspace oluşturuldu');
      router.push(`/admin/workspaces/${data.data.workspace.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <h1 className="text-3xl font-bold mb-2">Yeni Workspace</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">Ekip çalışma alanı oluşturun</p>
      <form onSubmit={handleSubmit} className="glass-card-premium p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">İsim *</label>
          <input
            required
            minLength={2}
            value={form.name}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                name: e.target.value,
                slug: p.slug || generateSlug(e.target.value),
              }))
            }
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug *</label>
          <input
            required
            pattern="^[a-z0-9-]+$"
            value={form.slug}
            onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 font-mono text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Açıklama</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-brand-primary text-white disabled:opacity-50"
          >
            {loading ? 'Oluşturuluyor...' : 'Oluştur'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/workspaces')}
            className="px-5 py-2.5 rounded-xl text-sm border"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  );
}

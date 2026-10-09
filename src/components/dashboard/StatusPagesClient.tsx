'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { DS } from '@/lib/design-system';
import { EmptyState } from '@/components/ui/EmptyState';

interface StatusPageRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  monitorIds: string[];
}

interface MonitorOption {
  id: string;
  name: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ğ]/g, 'g')
    .replace(/[ü]/g, 'u')
    .replace(/[ş]/g, 's')
    .replace(/[ı]/g, 'i')
    .replace(/[ö]/g, 'o')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function StatusPagesClient({
  initialPages,
  monitors,
}: {
  initialPages: StatusPageRow[];
  monitors: MonitorOption[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [monitorIds, setMonitorIds] = useState<string[]>([]);

  const toggleMonitor = (id: string) => {
    setMonitorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/status-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim() || slugify(title),
          description: description.trim() || undefined,
          monitorIds,
          isPublic: true,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? 'Oluşturulamadı');
      toast.success('Status page oluşturuldu');
      setShowForm(false);
      setTitle('');
      setSlug('');
      setDescription('');
      setMonitorIds([]);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Status page silinsin mi?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/status-pages/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? 'Silinemedi');
      toast.success('Silindi');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="admin-btn admin-btn-primary"
        >
          {showForm ? 'İptal' : 'Yeni status page'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-border bg-card/50 p-5 space-y-4 max-w-xl">
          <label className="block text-sm">
            <span className="font-medium mb-1.5 block">Başlık *</span>
            <input
              className={DS.input}
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium mb-1.5 block">Slug *</span>
            <input
              className={DS.input}
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
              }}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium mb-1.5 block">Açıklama</span>
            <textarea
              className={DS.input}
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          {monitors.length > 0 && (
            <fieldset>
              <legend className="text-sm font-medium mb-2">Monitörler</legend>
              <ul className="space-y-2">
                {monitors.map((m) => (
                  <li key={m.id}>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={monitorIds.includes(m.id)}
                        onChange={() => toggleMonitor(m.id)}
                      />
                      {m.name}
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          )}
          <button
            type="submit"
            disabled={busy || title.trim().length < 2}
            className={`${DS.button.primary} px-5 min-h-[44px]`}
          >
            {busy ? 'Kaydediliyor…' : 'Oluştur'}
          </button>
        </form>
      )}

      {initialPages.length === 0 && !showForm ? (
        <EmptyState
          icon="inbox"
          title="Henüz status page yok"
          description="Public uptime sayfası oluşturup monitörlerini bağla."
          action={{ label: 'Oluştur', onClick: () => setShowForm(true) }}
        />
      ) : (
        <ul className="space-y-3">
          {initialPages.map((p) => (
            <li
              key={p.id}
              className="rounded-2xl border border-border bg-card/50 p-4 flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <p className="font-bold">{p.title}</p>
                <p className="text-xs font-mono text-muted-foreground">/status/{p.slug}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {p.monitorIds.length} monitör · {p.isPublic ? 'public' : 'private'}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/status/${p.slug}`}
                  target="_blank"
                  className="admin-btn admin-btn-secondary text-sm"
                >
                  Aç
                </Link>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleDelete(p.id)}
                  className="admin-btn admin-btn-secondary text-sm text-destructive"
                >
                  Sil
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

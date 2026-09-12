'use client';

/**
 * CreateWorkspaceForm — yeni workspace oluşturma (client fetch + toast).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DS } from '@/lib/design-system';

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

interface CreateWorkspaceFormProps {
  /** Oluşturma sonrası yönlendirme (varsayılan: workspace detay) */
  redirectTo?: 'detail' | 'tasks' | 'list';
  className?: string;
}

export function CreateWorkspaceForm({
  redirectTo = 'detail',
  className = '',
}: CreateWorkspaceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');

  const onNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || slugify(name),
          description: description.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message ?? 'Workspace oluşturulamadı');
      }
      const ws = json.data?.workspace ?? json.data;
      toast.success('Workspace oluşturuldu');
      if (redirectTo === 'tasks') {
        router.push('/dashboard/tasks');
      } else if (redirectTo === 'list') {
        router.push('/dashboard/workspaces');
        router.refresh();
      } else {
        router.push(`/dashboard/workspaces/${ws.id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`glass-card-premium p-6 sm:p-8 space-y-5 max-w-lg ${className}`}
    >
      <div>
        <h2 className="text-lg font-semibold text-foreground">Yeni Workspace</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Görevler, compliance ve şablon kurulumu için bir çalışma alanı oluşturun.
        </p>
      </div>

      <label className="block text-sm">
        <span className="font-medium mb-1.5 block">İsim *</span>
        <input
          type="text"
          required
          minLength={2}
          maxLength={100}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className={DS.input}
          placeholder="Örn. Ajans Projesi"
          autoComplete="organization"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium mb-1.5 block">Slug *</span>
        <input
          type="text"
          required
          minLength={2}
          maxLength={60}
          pattern="[a-z0-9-]+"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
          }}
          className={DS.input}
          placeholder="ajans-projesi"
        />
        <span className="text-xs text-muted-foreground mt-1 block">
          Sadece küçük harf, rakam ve tire.
        </span>
      </label>

      <label className="block text-sm">
        <span className="font-medium mb-1.5 block">Açıklama</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          className={DS.input}
          placeholder="Opsiyonel"
        />
      </label>

      <button
        type="submit"
        disabled={loading || name.trim().length < 2}
        className={`${DS.button.primary} w-full px-6 min-h-[44px]`}
      >
        {loading ? 'Oluşturuluyor…' : 'Workspace Oluştur'}
      </button>
    </form>
  );
}

export default CreateWorkspaceForm;

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

type WorkspaceDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  members: Array<{
    id: string;
    userEmail: string;
    userName: string | null;
    role: string;
  }>;
  _count?: { members: number; invitations: number };
};

export default function WorkspaceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/workspaces/${params.id}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error?.message ?? 'Yüklenemedi');
        setWorkspace(data.data.workspace);
        setName(data.data.workspace.name);
        setDescription(data.data.workspace.description ?? '');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Hata');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Kaydedilemedi');
      toast.success('Kaydedildi');
      setWorkspace((prev) => (prev ? { ...prev, name, description } : prev));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    } finally {
      setSaving(false);
    }
  };

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/workspaces/${params.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: 'VIEWER' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Davet gönderilemedi');
      toast.success('Davet gönderildi');
      setInviteEmail('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;
  }

  if (!workspace) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4">Workspace bulunamadı</p>
        <Link href="/admin/workspaces" className="text-brand-primary underline">
          Listeye dön
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">{workspace.name}</h1>
          <p className="text-sm text-gray-500 font-mono">@{workspace.slug}</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/admin/workspaces')}
          className="text-sm underline"
        >
          ← Liste
        </button>
      </div>

      <div className="glass-card-premium p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">İsim</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Açıklama</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl text-sm font-bold bg-brand-primary text-white disabled:opacity-50"
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>

      <div className="glass-card-premium p-6">
        <h2 className="text-lg font-semibold mb-4">Üyeler</h2>
        <ul className="space-y-2 mb-6">
          {workspace.members.map((m) => (
            <li
              key={m.id}
              className="flex justify-between text-sm border-b border-gray-100 dark:border-gray-800 py-2"
            >
              <span>
                {m.userName || m.userEmail}
                <span className="text-gray-500 ml-2">{m.userEmail}</span>
              </span>
              <span className="font-mono text-xs uppercase">{m.role}</span>
            </li>
          ))}
        </ul>
        <form onSubmit={invite} className="flex gap-2">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="davet@ornek.com"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm"
          >
            Davet Et
          </button>
        </form>
      </div>
    </div>
  );
}

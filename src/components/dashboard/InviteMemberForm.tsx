'use client';

/**
 * InviteMemberForm — workspace üye daveti
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DS } from '@/lib/design-system';

interface InviteMemberFormProps {
  workspaceId: string;
  workspaceName: string;
}

export function InviteMemberForm({ workspaceId }: InviteMemberFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'EDITOR' | 'VIEWER'>('VIEWER');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message ?? 'Davet gönderilemedi');
      }
      toast.success('Davet oluşturuldu');
      setEmail('');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={`${DS.input} flex-1`}
        placeholder="uye@firma.com"
        autoComplete="email"
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as typeof role)}
        className={DS.input}
      >
        <option value="VIEWER">Viewer</option>
        <option value="EDITOR">Editor</option>
        <option value="ADMIN">Admin</option>
      </select>
      <button
        type="submit"
        disabled={loading || !email.trim()}
        className={`${DS.button.primary} px-5 min-h-[44px] whitespace-nowrap`}
      >
        {loading ? 'Gönderiliyor…' : 'Davet et'}
      </button>
    </form>
  );
}

export default InviteMemberForm;

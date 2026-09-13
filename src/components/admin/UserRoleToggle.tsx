'use client';

/**
 * Admin kullanıcı listesinde hesap rolünü admin/user arasında değiştirir.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { AppRole } from '@/lib/appRole';

interface UserRoleToggleProps {
  userId: string;
  email: string;
  role: AppRole;
  isSelf: boolean;
}

export function UserRoleToggle({ userId, email, role, isSelf }: UserRoleToggleProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isAdmin = role === 'admin';

  const handleToggle = async () => {
    if (loading) return;
    if (isSelf && isAdmin) {
      toast.error('Kendi yönetici yetkinizi kaldıramazsınız');
      return;
    }

    const nextRole: AppRole = isAdmin ? 'user' : 'admin';
    const confirmText = isAdmin
      ? `${email} hesabından yönetici yetkisi alınsın mı? Kullanıcı Yönetim menüsünü göremez.`
      : `${email} hesabına yönetici yetkisi verilsin mi? Kullanıcı header'daki hesap menüsünden Yönetim'e girebilir.`;

    if (!confirm(confirmText)) return;

    setLoading(true);
    const toastId = toast.loading(isAdmin ? 'Yetki kaldırılıyor...' : 'Yetki veriliyor...');
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error?.message || 'İşlem başarısız');
      }
      toast.success(
        nextRole === 'admin' ? 'Yönetici yetkisi verildi' : 'Yönetici yetkisi kaldırıldı',
        { id: toastId },
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading || (isSelf && isAdmin)}
      aria-pressed={isAdmin}
      className={`admin-btn text-xs min-h-[44px] ${
        isAdmin ? 'admin-btn-secondary' : 'admin-btn-primary'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? 'Kaydediliyor...' : isAdmin ? 'Yetkiyi al' : 'Yönetici yap'}
    </button>
  );
}

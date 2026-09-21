'use client';

/**
 * Kupon / Plan satır aksiyonları — aktif toggle + sil.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaEdit, FaSpinner } from 'react-icons/fa';
import { DeleteButton } from './DeleteButton';

interface CommerceRowActionsProps {
  resource: 'coupons' | 'plans';
  id: string;
  label: string;
  editHref: string;
  isActive: boolean;
  deleteConfirm?: string;
}

export function CommerceRowActions({
  resource,
  id,
  label,
  editHref,
  isActive,
  deleteConfirm,
}: CommerceRowActionsProps) {
  const router = useRouter();
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    const toastId = toast.loading('Durum güncelleniyor...');
    try {
      const res = await fetch(`/api/admin/${resource}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !isActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error?.message || 'Güncellenemedi');
      }
      toast.success(isActive ? 'Pasif yapıldı' : 'Aktif yapıldı', { id: toastId });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata', { id: toastId });
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="flex justify-end items-center gap-2">
      <Link
        href={editHref}
        className="admin-btn admin-btn-ghost px-3"
        aria-label={`${label} düzenle`}
      >
        <FaEdit aria-hidden="true" size={14} />
        <span className="sr-only sm:not-sr-only">Düzenle</span>
      </Link>
      <button
        type="button"
        onClick={handleToggle}
        disabled={toggling}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
          isActive
            ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
        }`}
      >
        {toggling ? <FaSpinner className="w-3 h-3 animate-spin" /> : isActive ? 'Aktif' : 'Pasif'}
      </button>
      <DeleteButton
        endpoint={`/api/admin/${resource}/${id}`}
        itemName={label}
        confirmMessage={
          deleteConfirm ?? `'${label}' kaydını kalıcı olarak silmek istediğinizden emin misiniz?`
        }
      />
    </div>
  );
}

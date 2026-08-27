'use client';

/**
 * @file Yeniden kullanılabilir admin silme butonu.
 * @description DELETE isteği atar, başarı/hata toast gösterir, liste yenilenir.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaTrash, FaSpinner } from 'react-icons/fa';

interface DeleteButtonProps {
  /** Silme isteğinin atılacağı endpoint (örn: `/api/admin/blog/[slug]`). */
  endpoint: string;
  /** Confirm dialog mesajı. */
  confirmMessage?: string;
  /** Silinecek öğenin okunabilir adı (log için). */
  itemName?: string;
  /** Başarı sonrası router.refresh yerine manuel reload. */
  onSuccess?: () => void;
  /** Ekstra CSS className. */
  className?: string;
}

export function DeleteButton({
  endpoint,
  confirmMessage = 'Silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
  itemName,
  onSuccess,
  className = '',
}: DeleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(confirmMessage)) return;
    setLoading(true);
    const toastId = toast.loading('Siliniyor...');
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error?.message || 'Silme işlemi başarısız');
      }
      toast.success(itemName ? `${itemName} silindi` : 'Silindi', { id: toastId });
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      aria-label={itemName ? `${itemName} sil` : 'Sil'}
      title="Sil"
      className={`p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <FaSpinner className="w-4 h-4 animate-spin" aria-hidden="true" />
      ) : (
        <FaTrash className="w-4 h-4" aria-hidden="true" />
      )}
    </button>
  );
}

export default DeleteButton;

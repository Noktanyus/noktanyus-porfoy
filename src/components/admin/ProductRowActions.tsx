'use client';

/**
 * @file Ürün tablo satırı aksiyon bileşeni.
 * @description Silme + Aktif/Pasif toggle butonlarını içerir.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaSpinner } from 'react-icons/fa';
import { DeleteButton } from './DeleteButton';

interface ProductRowActionsProps {
  productId: string;
  productSlug: string;
  productTitle: string;
  isActive: boolean;
}

export function ProductRowActions({
  productId,
  productSlug,
  productTitle,
  isActive,
}: ProductRowActionsProps) {
  const router = useRouter();
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    const toastId = toast.loading('Durum güncelleniyor...');
    try {
      const res = await fetch(`/api/admin/products/${productId}/toggle-active`, {
        method: 'PATCH',
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
      <button
        type="button"
        onClick={handleToggle}
        disabled={toggling}
        title={isActive ? 'Pasif yap' : 'Aktif yap'}
        aria-label={`${productTitle} durumunu değiştir`}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          isActive
            ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
        }`}
      >
        {toggling ? (
          <FaSpinner className="w-3 h-3 animate-spin" aria-hidden="true" />
        ) : isActive ? (
          'Aktif'
        ) : (
          'Pasif'
        )}
      </button>
      <DeleteButton
        endpoint={`/api/admin/products/${productId}`}
        itemName={productTitle}
        confirmMessage={`'${productTitle}' ürününü kalıcı olarak silmek istediğinizden emin misiniz?`}
      />
    </div>
  );
}

export default ProductRowActions;

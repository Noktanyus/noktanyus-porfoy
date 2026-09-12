/**
 * @file Admin — Template toggle button (active / featured)
 * @description PATCH istegi atarak template'in active veya featured alanini
 *              degistirir. Liste refresh ile yeni durum gorunur.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaStar, FaCheckCircle, FaSpinner } from 'react-icons/fa';

interface TemplateToggleButtonProps {
  templateId: string;
  /** Hangi alani toggle edecegi. */
  field: 'active' | 'featured';
  /** Mevcut deger. */
  value: boolean;
  tooltipOn: string;
  tooltipOff: string;
}

export function TemplateToggleButton({
  templateId,
  field,
  value,
  tooltipOn,
  tooltipOff,
}: TemplateToggleButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    const toastId = toast.loading(value ? 'Kapatılıyor...' : 'Açılıyor...');
    try {
      const res = await fetch(`/api/admin/templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error?.message || 'İşlem başarısız');
      }
      toast.success(value ? tooltipOn : tooltipOff, { id: toastId });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const Icon = loading
    ? FaSpinner
    : field === 'featured'
      ? FaStar
      : FaCheckCircle;

  const colorClass =
    field === 'featured'
      ? value
        ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
        : 'text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-500'
      : value
        ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
        : 'text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600';

  const label = value ? tooltipOn : tooltipOff;

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      title={label}
      aria-label={label}
      className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colorClass}`}
    >
      <Icon
        className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
        aria-hidden="true"
      />
    </button>
  );
}

export default TemplateToggleButton;

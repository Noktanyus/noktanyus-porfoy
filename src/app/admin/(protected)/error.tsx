'use client';

/**
 * @file Admin (protected) segmenti için hata sınırı.
 * @description Bu sınır, altındaki TÜM admin sayfalarını (newsletter, coupons,
 *              workspaces, seo, audit, history, gallery, messages, themes,
 *              campaigns, settings/sandbox ...) kapsar. Önceden yalnızca
 *              `dashboard/error.tsx` vardı; diğer admin sayfalarında oluşan
 *              server hataları kök `app/error.tsx`'e düşüyor ve kullanıcı
 *              admin kabuğundan (sidebar) tamamen kopuyordu.
 */

import { AdminErrorFallback } from '@/components/admin/AdminErrorFallback';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AdminErrorFallback
      error={error}
      reset={reset}
      title="Sayfa yüklenemedi"
      message="Yönetim paneli içeriği yüklenirken beklenmeyen bir hata oluştu. Tekrar deneyin; sorun sürerse hata kimliğini destek ekibine iletin."
      context="Admin (protected)"
    />
  );
}

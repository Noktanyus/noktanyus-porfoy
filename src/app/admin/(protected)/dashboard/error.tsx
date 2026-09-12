'use client';

/**
 * @file Dashboard için hata fallback bileşeni.
 * @description Server component'lerde (Prisma sorguları vb.) oluşan hataları yakalar
 *              ve kullanıcıya yeniden deneme imkanı sunar.
 *
 * Faz D: elle yazılmış ikon/başlık/buton düzeni ortak `AdminErrorFallback`
 * (→ `ErrorDisplay`) primitive'ine taşındı. Ayrıca ham `error.message` artık
 * arayüzde gösterilmiyor — server hataları iç detay sızdırabiliyordu.
 */

import { AdminErrorFallback } from '@/components/admin/AdminErrorFallback';

export default function DashboardError({
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
      title="Gösterge paneli yüklenemedi"
      message="İstatistikler yüklenirken bir hata oluştu. Lütfen tekrar deneyin."
      context="Admin Dashboard"
    />
  );
}

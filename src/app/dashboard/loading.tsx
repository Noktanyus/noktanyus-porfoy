/**
 * Dashboard Root Loading — tüm /dashboard/** altında geçerli.
 * Per-page loading.tsx yerine tek kaynaktan yönetilir.
 * Özelleştirilmiş skeleton gereken sayfalar kendi loading.tsx'lerini
 * yazabilir (root loading fallthrough olur).
 */
import { SpinnerLoading } from "@/components/ui/LoadingSkeleton";

export default function Loading() {
  return <SpinnerLoading text="Yükleniyor..." />;
}

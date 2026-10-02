/**
 * Dashboard Root Loading — tüm /dashboard segmentleri için iskelet yükleme ekranı.
 */
import { DashboardSkeleton } from "@/components/ui/LoadingSkeleton";

export default function Loading() {
  return <DashboardSkeleton title="Kullanıcı paneli yükleniyor" />;
}

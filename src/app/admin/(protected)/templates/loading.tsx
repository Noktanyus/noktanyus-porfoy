import { TableSkeleton } from "@/components/ui/LoadingSkeleton";

export default function AdminTemplatesLoading() {
  return (
    <TableSkeleton
      title="Şablonlar listesi yükleniyor"
      rows={6}
      columns={6}
    />
  );
}

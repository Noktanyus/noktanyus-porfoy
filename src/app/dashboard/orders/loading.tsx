import { TableSkeleton } from "@/components/ui/LoadingSkeleton";

export default function OrdersLoading() {
  return (
    <TableSkeleton
      title="Siparişleriniz yükleniyor"
      rows={5}
      columns={6}
    />
  );
}

import { TableSkeleton } from "@/components/ui/LoadingSkeleton";

export default function AdminOrdersLoading() {
  return (
    <TableSkeleton
      title="Siparişler yükleniyor"
      rows={6}
      columns={7}
    />
  );
}

import { TableSkeleton } from "@/components/ui/LoadingSkeleton";

export default function AdminProductsLoading() {
  return (
    <TableSkeleton
      title="Ürünler listesi yükleniyor"
      rows={6}
      columns={6}
    />
  );
}

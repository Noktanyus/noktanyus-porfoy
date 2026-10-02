import { TableSkeleton } from "@/components/ui/LoadingSkeleton";

export default function AdminLicensesLoading() {
  return (
    <TableSkeleton
      title="Lisanslar yükleniyor"
      rows={6}
      columns={6}
    />
  );
}

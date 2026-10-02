import { TableSkeleton } from "@/components/ui/LoadingSkeleton";

export default function ApiKeysLoading() {
  return (
    <TableSkeleton
      title="API anahtarlarınız yükleniyor"
      rows={4}
      columns={5}
    />
  );
}

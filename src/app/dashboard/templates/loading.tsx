import { CardsGridSkeleton } from "@/components/ui/LoadingSkeleton";

export default function UserTemplatesLoading() {
  return (
    <CardsGridSkeleton
      title="Şablonlarınız yükleniyor"
      count={6}
      columns={3}
    />
  );
}

import { CardsGridSkeleton } from "@/components/ui/LoadingSkeleton";

export default function AboneliklerLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <CardsGridSkeleton
        title="Abonelik planları yükleniyor"
        count={3}
        columns={3}
      />
    </div>
  );
}

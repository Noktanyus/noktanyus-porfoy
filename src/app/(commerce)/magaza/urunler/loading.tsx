import { CardsGridSkeleton } from "@/components/ui/LoadingSkeleton";

export default function UrunlerLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <CardsGridSkeleton
        title="Mağaza ürünleri yükleniyor"
        count={6}
        columns={3}
      />
    </div>
  );
}

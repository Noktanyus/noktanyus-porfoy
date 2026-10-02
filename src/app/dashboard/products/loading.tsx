import { CardsGridSkeleton } from "@/components/ui/LoadingSkeleton";

export default function UserProductsLoading() {
  return (
    <CardsGridSkeleton
      title="Satın aldığınız ürünler yükleniyor"
      count={6}
      columns={3}
    />
  );
}

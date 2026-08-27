import { commerceService } from '@/modules/commerce';
import { ProductGrid } from './ProductGrid';

export async function RelatedProducts({
  currentSlug,
  category,
}: {
  currentSlug: string;
  category: string;
}) {
  let related = [];
  try {
    const products = await commerceService.listProducts({ category, take: 4 });
    related = products.filter((p) => p.slug !== currentSlug).slice(0, 3);
  } catch {
    return null;
  }

  if (related.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        İlgili Ürünler
      </h2>
      <ProductGrid products={related} />
    </section>
  );
}

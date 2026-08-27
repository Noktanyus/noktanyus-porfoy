import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { commerceService } from '@/modules/commerce';
import { ProductDetail } from '@/components/commerce/ProductDetail';
import { RelatedProducts } from '@/components/commerce/RelatedProducts';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const product = await commerceService.getProduct(params.slug);
    return {
      title: `${product.title} | Mağaza`,
      description: product.shortDescription,
      openGraph: {
        title: product.title,
        description: product.shortDescription,
        images: product.thumbnail ? [product.thumbnail] : [],
        type: 'website',
      },
    };
  } catch {
    return { title: 'Ürün Bulunamadı' };
  }
}

export default async function ProductPage({ params }: PageProps) {
  let product;
  try {
    product = await commerceService.getProduct(params.slug);
  } catch {
    notFound();
  }

  return (
    <div className="container-responsive">
      <div className="space-responsive">
        <ProductDetail product={product} />
        <RelatedProducts currentSlug={params.slug} category={product.category} />
      </div>
    </div>
  );
}

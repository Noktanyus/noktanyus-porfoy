import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { commerceService } from '@/modules/commerce';
import { ProductDetail } from '@/components/commerce/ProductDetail';
import { RelatedProducts } from '@/components/commerce/RelatedProducts';
import {
  JsonLd,
  productJsonLd,
  breadcrumbJsonLd,
  generateOpenGraph,
  generateTwitterCard,
  getBaseUrl,
} from '@/components/seo/JsonLd';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const product = await commerceService.getProduct(params.slug);
    const baseUrl = getBaseUrl();
    const canonicalUrl = `${baseUrl}/magaza/${product.slug}`;
    return {
      title: `${product.title} | Mağaza`,
      description: product.shortDescription,
      alternates: { canonical: canonicalUrl },
      openGraph: generateOpenGraph({
        title: product.title,
        description: product.shortDescription,
        url: canonicalUrl,
        image: product.thumbnail ?? undefined,
        type: 'product',
      }) as any,
      twitter: generateTwitterCard({
        title: product.title,
        description: product.shortDescription,
        image: product.thumbnail ?? undefined,
      }) as any,
      robots: { index: true, follow: true },
    };
  } catch {
    return { title: 'Ürün Bulunamadı', robots: { index: false, follow: false } };
  }
}

export default async function ProductPage({ params }: PageProps) {
  let product;
  try {
    product = await commerceService.getProduct(params.slug);
  } catch {
    notFound();
  }

  const baseUrl = getBaseUrl();
  const canonicalUrl = `${baseUrl}/magaza/${product.slug}`;

  // Product JSON-LD — Google Merchant Center ve zengin ürün sonuçları için
  const productLd = productJsonLd({
    name: product.title,
    description: product.shortDescription || product.description,
    image: product.thumbnail ?? `${baseUrl}/og-default.png`,
    priceCents: product.priceCents,
    currency: product.currency ?? 'try',
    url: canonicalUrl,
    sku: product.id,
    brand: 'Noktanyus',
    availability: product.active ? 'InStock' : 'OutOfStock',
  });

  // Breadcrumb JSON-LD
  const breadcrumbLd = breadcrumbJsonLd([
    { name: 'Anasayfa', url: `${baseUrl}` },
    { name: 'Mağaza', url: `${baseUrl}/magaza` },
    { name: product.title, url: canonicalUrl },
  ]);

  return (
    <>
      <JsonLd data={[productLd, breadcrumbLd]} />
      <div className="container-responsive">
        <div className="space-responsive">
          <ProductDetail product={product} />
          <RelatedProducts currentSlug={params.slug} category={product.category} />
        </div>
      </div>
    </>
  );
}

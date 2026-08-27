/**
 * /magaza/[slug]
 *
 * Public vendor mağaza sayfası. Vendor'ın aktif ürünlerini + profilini gösterir.
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { vendorService } from '@/modules/marketplace';
import { prisma } from '@/lib/prisma';
import { VendorProfile } from '@/components/marketplace/VendorProfile';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const vendor = await vendorService.getBySlugSafe(params.slug);
  if (!vendor) return { title: 'Mağaza bulunamadı' };

  return {
    title: `${vendor.displayName} | Mağaza`,
    description: vendor.bio?.slice(0, 160) ?? `${vendor.displayName} mağazası`,
  };
}

export default async function PublicVendorPage({ params }: PageProps) {
  const vendor = await vendorService.getBySlugSafe(params.slug);
  if (!vendor || !vendor.active) notFound();

  const [products, summary] = await Promise.all([
    prisma.digitalProduct.findMany({
      where: { vendorId: vendor.id, active: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.productReview.aggregate({
      where: { vendorId: vendor.id, approved: true },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  return (
    <VendorProfile
      vendor={vendor}
      products={products}
      average={summary._avg.rating ?? 0}
      reviewCount={summary._count._all}
    />
  );
}
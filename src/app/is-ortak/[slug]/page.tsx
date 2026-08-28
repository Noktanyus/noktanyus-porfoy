/**
 * Public Partner Landing Page
 *
 * Route: /is-ortak/[slug]
 *
 * Partner'in public landing page'i. Aktif olmayan veya bulunamayan slug
 * icin notFound() doner. SEO meta tags inline.
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { PartnerLanding } from '@/components/partners/PartnerLanding';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

async function fetchPartner(slug: string) {
  return prisma.partner.findUnique({
    where: { slug },
    select: {
      companyName: true,
      slug: true,
      description: true,
      website: true,
      verified: true,
      active: true,
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const partner = await fetchPartner(params.slug);
  if (!partner || !partner.active) {
    return { title: 'İş Ortağı Bulunamadı' };
  }
  return {
    title: `${partner.companyName} | İş Ortağı`,
    description: partner.description ?? `${partner.companyName} aracılığıyla Noktanyus çözümleri`,
    robots: { index: partner.verified, follow: true },
  };
}

export default async function PartnerLandingPage({ params }: PageProps) {
  const partner = await fetchPartner(params.slug);
  if (!partner || !partner.active) {
    notFound();
  }

  return <PartnerLanding partner={partner} />;
}
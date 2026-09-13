/**
 * @file /is-ortak/[slug] — Partner landing (minimal public stub)
 * Unknown or inactive slug → 404 (never 500).
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { safeMetadata } from '@/lib/pageMetadata';

export const dynamic = 'force-dynamic';

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/;

interface PageProps {
  params: { slug: string };
}

async function findPublicPartner(slug: string) {
  if (!SLUG_PATTERN.test(slug)) return null;
  try {
    return await prisma.partner.findFirst({
      where: { slug, active: true },
      select: {
        companyName: true,
        slug: true,
        description: true,
        website: true,
        verified: true,
        contactEmail: true,
      },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return safeMetadata(
    async () => {
      const partner = await findPublicPartner(params.slug);
      if (!partner) return null;
      return {
        title: `${partner.companyName} — İş ortağı`,
        description: partner.description ?? `${partner.companyName} iş ortaklığı sayfası`,
      };
    },
    {
      title: 'İş ortağı bulunamadı',
      path: `/is-ortak/${params.slug}`,
    },
  );
}

export default async function PartnerLandingPage({ params }: PageProps) {
  const partner = await findPublicPartner(params.slug);
  if (!partner) notFound();

  return (
    <main className="container-responsive space-responsive min-h-[60vh]">
      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          İş ortağı
          {partner.verified ? (
            <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-700 dark:text-emerald-300">
              Doğrulanmış
            </span>
          ) : null}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {partner.companyName}
        </h1>
        {partner.description ? (
          <p className="mt-4 text-muted-foreground leading-relaxed">{partner.description}</p>
        ) : (
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Bu sayfa {partner.companyName} iş ortaklığı referansıdır.
          </p>
        )}

        <dl className="mt-8 space-y-3 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground shrink-0">Slug</dt>
            <dd className="font-mono text-foreground">/is-ortak/{partner.slug}</dd>
          </div>
          {partner.website ? (
            <div className="flex gap-2">
              <dt className="text-muted-foreground shrink-0">Web</dt>
              <dd>
                <a
                  href={partner.website}
                  className="text-brand-primary hover:underline"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {partner.website}
                </a>
              </dd>
            </div>
          ) : null}
          <div className="flex gap-2">
            <dt className="text-muted-foreground shrink-0">İletişim</dt>
            <dd>
              <a
                href={`mailto:${partner.contactEmail}`}
                className="text-brand-primary hover:underline"
              >
                {partner.contactEmail}
              </a>
            </dd>
          </div>
        </dl>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/magaza"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Mağazaya git
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground"
          >
            API dokümantasyon
          </Link>
        </div>
      </div>
    </main>
  );
}

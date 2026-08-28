/**
 * PartnerLanding — Public partner landing page (server-rendered).
 * SEO uyumlu meta + lead formu icerir.
 */

import type { Partner } from '@prisma/client';
import { PartnerLeadForm } from './PartnerLeadForm';

interface PartnerLandingProps {
  partner: Pick<Partner, 'companyName' | 'slug' | 'description' | 'website' | 'verified'>;
}

export function PartnerLanding({ partner }: PartnerLandingProps) {
  const description =
    partner.description ??
    `${partner.companyName} aracılığıyla profesyonel dijital çözümler.`;

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-12">
      <header className="mb-8 text-center">
        <div className="mb-2 inline-flex items-center gap-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {partner.companyName}
          </h1>
          {partner.verified && (
            <span
              className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              aria-label="Doğrulanmış iş ortağı"
            >
              ✓ Doğrulanmış
            </span>
          )}
        </div>
        <p className="mx-auto max-w-2xl text-slate-600 dark:text-slate-400">{description}</p>
        {partner.website && (
          <p className="mt-2 text-sm">
            <a
              href={partner.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {partner.website}
            </a>
          </p>
        )}
      </header>

      <section className="mx-auto max-w-md">
        <PartnerLeadForm partnerSlug={partner.slug} partnerName={partner.companyName} />
      </section>

      <footer className="mt-12 text-center text-xs text-slate-500">
        <p>
          Bu sayfa bir Noktanyus iş ortağı tarafından sağlanmaktadır.{' '}
          <a href="/" className="hover:underline">
            noktanyus.com
          </a>
        </p>
      </footer>
    </div>
  );
}
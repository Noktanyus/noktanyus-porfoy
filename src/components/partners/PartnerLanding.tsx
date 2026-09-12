/**
 * PartnerLanding — Public partner landing page (server-rendered).
 * SEO uyumlu meta + lead formu icerir.
 *
 * Faz D:
 *  - "Doğrulanmış" rozeti ortak `StatusBadge` primitive'ine taşındı (emoji
 *    onay işareti yerine ikon; ekran okuyucuya `srLabel` ile bağlam verilir).
 *  - Partner web sitesi linki dış bağlantı olduğu için görünür bir "yeni
 *    sekmede açılır" bilgisi eklendi; `rel="noopener noreferrer"` korundu.
 *  - Semantik token'lara geçildi (slate-* sabit renkleri dark mode'da
 *    tema ile uyumsuzdu).
 */

import type { Partner } from '@prisma/client';
import { FaCheckCircle, FaExternalLinkAlt } from 'react-icons/fa';
import { StatusBadge } from '@/components/ui/StatusBadge';
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
        <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
          <h1 className="text-3xl font-bold text-foreground">
            {partner.companyName}
          </h1>
          {partner.verified && (
            <StatusBadge
              size="sm"
              tone="info"
              label="Doğrulanmış"
              srLabel="İş ortağı durumu:"
              icon={<FaCheckCircle className="h-3 w-3" />}
            />
          )}
        </div>
        <p className="mx-auto max-w-2xl text-muted-foreground">{description}</p>
        {partner.website && (
          <p className="mt-2 text-sm">
            <a
              href={partner.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-brand-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            >
              {partner.website}
              <FaExternalLinkAlt aria-hidden="true" className="h-3 w-3" />
              <span className="sr-only">(yeni sekmede açılır)</span>
            </a>
          </p>
        )}
      </header>

      <section className="mx-auto max-w-md" aria-labelledby="partner-lead-heading">
        <h2 id="partner-lead-heading" className="sr-only">
          İletişim formu
        </h2>
        <PartnerLeadForm partnerSlug={partner.slug} partnerName={partner.companyName} />
      </section>

      <footer className="mt-12 text-center text-xs text-muted-foreground">
        <p>
          Bu sayfa bir Noktanyus iş ortağı tarafından sağlanmaktadır.{' '}
          <a
            href="/"
            className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            noktanyus.com
          </a>
        </p>
      </footer>
    </div>
  );
}
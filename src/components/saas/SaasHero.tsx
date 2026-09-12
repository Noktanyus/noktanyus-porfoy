/**
 * @file SaasHero — SaaS landing sayfası hero bölümü.
 * @description Pazarlama sayfasının en üstündeki dikkat çekici başlık + tagline +
 *              CTA butonlarından oluşur. Server component (client state yok).
 *              Renkler brand-primary token'ından gelir — global tema ile uyumlu.
 */

import Link from 'next/link';

interface SaasHeroProps {
  /** Üstte küçük etiket (örn. "Yeni · v2"). */
  eyebrow?: string;
  /** Ana başlık. */
  title: string;
  /** Başlığın altında tagline. */
  subtitle: string;
  /** Primary CTA href. */
  primaryHref: string;
  /** Primary CTA metni. */
  primaryLabel: string;
  /** Secondary CTA href (opsiyonel). */
  secondaryHref?: string;
  /** Secondary CTA metni. */
  secondaryLabel?: string;
}

export function SaasHero({
  eyebrow,
  title,
  subtitle,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: SaasHeroProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Arka plan dekoru — radial gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--brand-primary-soft,_rgba(99,102,241,0.15)),_transparent_60%)]"
      />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-28 sm:pb-24 text-center">
        {eyebrow && (
          <span className="inline-block mb-4 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold uppercase tracking-wide">
            {eyebrow}
          </span>
        )}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white break-words">
          {title}
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed break-words">
          {subtitle}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
          <Link
            href={primaryHref}
            className="inline-flex items-center justify-center min-h-[48px] px-7 py-3 rounded-xl bg-brand-primary text-white text-base font-semibold shadow-lg hover:bg-brand-primary/90 transition-all"
          >
            {primaryLabel}
          </Link>
          {secondaryHref && secondaryLabel && (
            <Link
              href={secondaryHref}
              className="inline-flex items-center justify-center min-h-[48px] px-7 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-base font-semibold hover:border-brand-primary hover:text-brand-primary transition-all"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
        <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          Kredi kartı gerekmez · 14 gün ücretsiz dene
        </p>
      </div>
    </section>
  );
}

/**
 * Marketplace Detail — Public template detay sayfası (Phase 3 B.2).
 *
 * - getTemplateBySlug ile tek template
 * - Preview images (TemplatePreview — lightbox)
 * - Long description (markdown-render: simple whitespace-preserved paragraph)
 * - Features + tech stack rozetleri
 * - Pricing tablosu (3 lisans tipi)
 * - Demo iframe (demoUrl varsa)
 * - Reviews placeholder (future)
 *
 * Not: getTemplateBySlug NotFoundError fırlatır; Next.js bunu 404'e map eder.
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { getTemplateBySlug } from '@/modules/marketplace';
import { safeMetadata } from '@/lib/pageMetadata';
import { TemplateHero } from '@/components/marketplace/TemplateHero';
import { TemplatePreview } from '@/components/marketplace/TemplatePreview';
import { PricingTable } from '@/components/marketplace/PricingTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { FaCheckCircle, FaPlay, FaExclamationTriangle } from 'react-icons/fa';

export const dynamic = 'force-dynamic';

// =================== HELPERS ===================

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

// Basit markdown escape (sadece güvenli text gösterimi; HTML yok)
// Phase'de gerçek markdown render (react-markdown + DOMPurify) eklenebilir.
function renderLongDescription(text: string | null | undefined) {
  if (!text) return null;
  return text
    .split(/\n\s*\n/) // paragraph split
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para, idx) => (
      <p key={idx} className="whitespace-pre-wrap break-words leading-relaxed">
        {para}
      </p>
    ));
}

// =================== METADATA ===================

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  return safeMetadata(
    async () => {
      try {
        const tpl = await getTemplateBySlug(params.slug);
        return {
          title: `${tpl.name} | Noktanyus Marketplace`,
          description: tpl.tagline,
          alternates: { canonical: `/marketplace/${tpl.slug}` },
          openGraph: {
            title: tpl.name,
            description: tpl.tagline,
            type: 'website',
            url: `/marketplace/${tpl.slug}`,
          },
        };
      } catch {
        return null;
      }
    },
    {
      title: 'Template Detayı | Noktanyus Marketplace',
      description: 'Template detaylarını görüntüle',
      path: `/marketplace/${params.slug}`,
    }
  );
}

// =================== PAGE ===================

export default async function TemplateDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  let template;
  try {
    template = await getTemplateBySlug(params.slug);
  } catch {
    notFound();
  }

  const session = await getServerSession(authOptions);

  const previewImages = asStringArray(template.previewImages);
  const features = asStringArray(template.features);
  const techStack = asStringArray(template.techStack);
  const longParagraphs = renderLongDescription(template.longDescription);

  return (
    <div className="container-responsive bg-blob-decoration">
      <div className="relative z-10 space-responsive">
        {/* Breadcrumb */}
        <nav className="mb-4 text-sm" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-gray-600 dark:text-gray-400">
            <li>
              <Link href="/marketplace" className="hover:text-brand-primary">
                Marketplace
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={`/marketplace?category=${template.category}`}
                className="hover:text-brand-primary capitalize"
              >
                {template.category}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">
              {template.name}
            </li>
          </ol>
        </nav>

        {/* Hero */}
        <TemplateHero
          slug={template.slug}
          name={template.name}
          tagline={template.tagline}
          category={template.category}
          techStack={techStack}
          rating={template.rating}
          reviewCount={template.reviewCount}
          downloads={template.downloads}
          version={template.version}
          priceCents={template.priceCents}
          currency={template.currency}
          licenseType={template.licenseType}
          demoUrl={template.demoUrl}
          featured={template.featured}
        />

        {/* 2-col layout: gallery + sidebar (description/features) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {/* Left: Preview + Description */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image gallery */}
            <TemplatePreview images={previewImages} alt={template.name} />

            {/* Long description */}
            {longParagraphs && longParagraphs.length > 0 && (
              <section className="glass-card-premium p-6" aria-labelledby="long-desc">
                <h2
                  id="long-desc"
                  className="text-xl font-bold text-gray-900 dark:text-white mb-4"
                >
                  Hakkında
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 space-y-4">
                  {longParagraphs}
                </div>
              </section>
            )}

            {/* Short description (her zaman göster) */}
            <section className="glass-card-premium p-6" aria-labelledby="short-desc">
              <h2
                id="short-desc"
                className="text-xl font-bold text-gray-900 dark:text-white mb-3"
              >
                Özet
              </h2>
              <p className="text-gray-700 dark:text-gray-300 break-words leading-relaxed">
                {template.description}
              </p>
            </section>
          </div>

          {/* Right: sidebar — features + tech + author */}
          <aside className="space-y-6">
            {/* Features */}
            {features.length > 0 && (
              <section className="glass-card-premium p-6" aria-labelledby="features-heading">
                <h2
                  id="features-heading"
                  className="text-lg font-bold text-gray-900 dark:text-white mb-4"
                >
                  Özellikler
                </h2>
                <ul className="space-y-2">
                  {features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <FaCheckCircle
                        className="w-4 h-4 mt-0.5 text-brand-primary shrink-0"
                        aria-hidden="true"
                      />
                      <span className="break-words min-w-0">{feature}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Tech stack */}
            {techStack.length > 0 && (
              <section className="glass-card-premium p-6" aria-labelledby="tech-heading">
                <h2
                  id="tech-heading"
                  className="text-lg font-bold text-gray-900 dark:text-white mb-4"
                >
                  Teknoloji Yığını
                </h2>
                <div className="flex flex-wrap gap-2">
                  {techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Author */}
            <section className="glass-card-premium p-6" aria-labelledby="author-heading">
              <h2
                id="author-heading"
                className="text-lg font-bold text-gray-900 dark:text-white mb-2"
              >
                Yayıncı
              </h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                {template.author.name ?? template.author.email}
              </p>
            </section>

            {/* Login CTA — sadece signed-out kullanıcılara */}
            {!session?.user && (
              <section className="glass-card-premium p-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Satın alma için hesap oluştur veya giriş yap.
                </p>
                <Link
                  href={`/giris?callbackUrl=/marketplace/${template.slug}`}
                  className="inline-flex items-center justify-center w-full min-h-[44px] px-4 py-2 rounded-xl border-2 border-brand-primary text-brand-primary bg-transparent hover:bg-brand-primary/10 font-semibold transition-colors"
                >
                  Giriş Yap
                </Link>
              </section>
            )}
          </aside>
        </div>

        {/* Demo iframe (sadece demoUrl varsa) */}
        {template.demoUrl && (
          <section className="mb-12" aria-labelledby="demo-heading">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2
                id="demo-heading"
                className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"
              >
                <FaPlay className="w-5 h-5 text-brand-primary" aria-hidden="true" />
                Canlı Demo
              </h2>
              <Link
                href={`/marketplace/${template.slug}/demo`}
                className="text-sm text-brand-primary hover:underline font-medium"
              >
                Tam ekranda aç →
              </Link>
            </div>

            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-gray-200/60 dark:border-gray-700/60 bg-muted">
              <p
                role="note"
                className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/90 text-white text-xs font-medium"
              >
                <FaExclamationTriangle aria-hidden="true" className="h-3 w-3 shrink-0" />
                Bu bir demo önizlemesidir — satın alma işlemi gerçekleşmez
              </p>
              <iframe
                src={template.demoUrl}
                title={`${template.name} demo`}
                sandbox="allow-scripts allow-same-origin allow-forms"
                loading="lazy"
                className="w-full h-full pt-8"
                referrerPolicy="no-referrer"
              />
            </div>
          </section>
        )}

        {/* Pricing table */}
        <section id="pricing" className="mb-12 scroll-mt-20" aria-labelledby="pricing-heading">
          <div className="text-center mb-8">
            <h2
              id="pricing-heading"
              className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2"
            >
              Lisans Seçenekleri
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              İhtiyacına uygun lisans tipini seç, dakikalar içinde workspace'ine kur.
            </p>
          </div>

          <PricingTable
            templateSlug={template.slug}
            basePriceCents={template.priceCents}
            currency={template.currency}
            sharedFeatures={features.slice(0, 3)}
          />

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Tüm lisanslar ömür boyu kullanım hakkı içerir. Satın aldığınız
            lisansları{' '}
            <Link
              href="/dashboard/templates"
              className="text-brand-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              lisanslarım
            </Link>{' '}
            sayfasından yönetebilirsiniz.
          </p>
        </section>

        {/* Değerlendirmeler — sistem henüz aktif değil, EmptyState ile bildirilir */}
        <section className="mb-12" aria-labelledby="reviews-heading">
          <h2
            id="reviews-heading"
            className="mb-4 text-2xl font-bold text-gray-900 dark:text-white"
          >
            Değerlendirmeler
          </h2>
          <EmptyState
            icon="question"
            title="Değerlendirme sistemi yakında aktif olacak"
            description="Satın aldıktan sonra lisans anahtarınızla yorum bırakabileceksiniz. Şu anda bu şablon için görüntülenecek değerlendirme yok."
          />
        </section>
      </div>
    </div>
  );
}
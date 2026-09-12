/**
 * Marketplace Demo — Tam ekran iframe ile demo önizleme (Phase 3 B.2).
 *
 * - Top bar: geri linki + "Bu bir demo — Satın Al" CTA
 * - Full-page iframe (sandbox: scripts + same-origin)
 * - getTemplateBySlug (active olmayan template'ler için 404)
 *
 * Not: middleware `/marketplace/[slug]/demo` PUBLIC bırakılmıştır
 * (PROTECTED_PREFIXES'te sadece /marketplace/dashboard korunur).
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTemplateBySlug } from '@/modules/marketplace';
import { safeMetadata } from '@/lib/pageMetadata';
import { FaArrowLeft, FaShoppingCart } from 'react-icons/fa';

export const dynamic = 'force-dynamic';

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
          title: `${tpl.name} Demo | Noktanyus Marketplace`,
          description: `${tpl.name} canlı demosu — satın almadan önce incele.`,
          alternates: { canonical: `/marketplace/${tpl.slug}/demo` },
          // Demo sayfası indexlenmesin
          robots: { index: false, follow: true },
        };
      } catch {
        return null;
      }
    },
    {
      title: 'Template Demo | Noktanyus Marketplace',
      description: 'Template canlı demosu',
      path: `/marketplace/${params.slug}/demo`,
    }
  );
}

// =================== PAGE ===================

export default async function TemplateDemoPage({
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

  // demoUrl yoksa detay sayfasına geri yönlendir
  if (!template.demoUrl) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="glass-card-premium p-8 text-center max-w-md">
          <p className="text-3xl mb-3" aria-hidden="true">
            🎬
          </p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Demo Mevcut Değil
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Bu template için canlı demo henüz eklenmedi.
          </p>
          <Link
            href={`/marketplace/${template.slug}`}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2 rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90 font-semibold transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" aria-hidden="true" />
            Detaya Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/marketplace/${template.slug}`}
            className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium transition-colors shrink-0"
          >
            <FaArrowLeft className="w-3 h-3" aria-hidden="true" />
            Geri
          </Link>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {template.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              Canlı Demo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium">
            ⚠️ Bu bir demo önizlemesidir
          </span>
          <Link
            href={`/marketplace/${template.slug}#pricing`}
            className="inline-flex items-center justify-center gap-2 min-h-[36px] px-4 py-2 rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90 text-sm font-bold shadow transition-colors"
          >
            <FaShoppingCart className="w-3 h-3" aria-hidden="true" />
            Satın Al
          </Link>
        </div>
      </div>

      {/* Full-page iframe */}
      <div className="flex-1 relative bg-gray-100 dark:bg-gray-900">
        <iframe
          src={template.demoUrl}
          title={`${template.name} canlı demo`}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          loading="eager"
          className="w-full h-full border-0"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import IletisimForm from './IletisimForm';
import { getAbout } from '@/services/contentService';
import { ContactSkeleton } from '@/components/ui/LoadingSkeleton';
import { staticMetadata } from '@/lib/pageMetadata';

export const metadata = staticMetadata({
  title: 'İletişim | Noktanyus',
  description:
    'Bir sorunuz mu var, bir proje teklifiniz mi var, yoksa sadece merhaba mı demek istiyorsunuz? Aşağıdaki formu doldurmaktan çekinmeyin.',
  path: '/iletisim',
});

export default async function IletisimPage() {
  let aboutData = null;
  try {
    aboutData = await getAbout();
  } catch (err) {
    console.warn('[IletisimPage] getAbout error:', err);
  }

  return (
    <div className="relative bg-blob-decoration">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,oklch(var(--primary)/0.16),transparent_70%)]"
        aria-hidden="true"
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10 lg:py-14 relative z-10">
        <div className="section-header">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary mb-2">
            İletişim
          </p>
          <h1 className="section-title">İletişime Geçin</h1>
          <p className="section-subtitle text-slate-600 dark:text-slate-300">
            Proje teklifi, API ortaklığı veya genel sorular için formu doldurun — genellikle 1 iş günü içinde dönüş yapılır.
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<ContactSkeleton />}>
            <IletisimForm
              contactEmail={aboutData?.contactEmail}
              socialGithub={aboutData?.socialGithub}
              socialLinkedin={aboutData?.socialLinkedin}
              socialInstagram={aboutData?.socialInstagram}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

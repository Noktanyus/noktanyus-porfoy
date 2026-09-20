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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
      <div className="section-header">
        <h1 className="section-title">İletişime Geçin</h1>
        <p className="section-subtitle">
          Bir sorunuz mu var, bir proje teklifiniz mi var, yoksa sadece merhaba mı demek istiyorsunuz? Aşağıdaki formu doldurmaktan çekinmeyin.
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
  );
}


/**
 * @file İletişim Sayfası (Sunucu Bileşeni)
 * @description Bu sayfa, sunucu tarafında iletişim bilgilerini veritabanından
 *              çeker ve istemci taraflı `IletisimForm` bileşenine prop olarak
 *              geçirerek gösterir. Bu, sayfanın statik avantajlarını korurken
 *              formun interaktif kalmasını sağlar.
 */

import { getAbout } from "@/services/contentService";
import IletisimForm from "./IletisimForm";

export default async function IletisimPage() {
  // Sunucu tarafında "Hakkımda" verilerini çek
  const aboutData = await getAbout();
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!turnstileSiteKey) {
    console.error("NEXT_PUBLIC_TURNSTILE_SITE_KEY ortam değişkeni bulunamadı.");
    // İsteğe bağlı: site anahtarı olmadan formu hiç göstermeyebilirsiniz.
    // return <div>İletişim formu şu anda kullanılamıyor.</div>;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
      <div className="text-center mb-4 sm:mb-6 md:mb-8 lg:mb-12">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white leading-tight px-2">
          İletişime Geçin
        </h1>
        <p className="mt-2 sm:mt-3 md:mt-4 text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-2 sm:px-4 leading-relaxed">
          Bir sorunuz mu var, bir proje teklifiniz mi var, yoksa sadece merhaba mı demek istiyorsunuz? Aşağıdaki formu doldurmaktan çekinmeyin.
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        <IletisimForm 
          contactEmail={aboutData?.contactEmail}
          socialGithub={aboutData?.socialGithub}
          socialLinkedin={aboutData?.socialLinkedin}
          socialInstagram={aboutData?.socialInstagram}
          sitekey={turnstileSiteKey || ''}
        />
      </div>
    </div>
  );
}

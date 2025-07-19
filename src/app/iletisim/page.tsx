
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
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold">İletişime Geçin</h1>
        <p className="mt-3 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Bir sorunuz mu var, bir proje teklifiniz mi var, yoksa sadece merhaba mı demek istiyorsunuz? Aşağıdaki formu doldurmaktan çekinmeyin.
        </p>
      </div>

      <IletisimForm 
        contactEmail={aboutData?.contactEmail}
        socialGithub={aboutData?.socialGithub}
        socialLinkedin={aboutData?.socialLinkedin}
        socialInstagram={aboutData?.socialInstagram}
        sitekey={turnstileSiteKey || ''}
      />
    </div>
  );
}

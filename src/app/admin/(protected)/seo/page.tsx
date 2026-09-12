/**
 * @file SEO ve arama motoru ayarları sayfası (sunucu tarafı).
 * @description Bu sunucu bileşeni, `getSeoSettings` ve `getRobotsTxtContent`
 *              fonksiyonlarını kullanarak mevcut SEO ayarlarını ve robots.txt
 *              içeriğini alır. Ardından bu verileri, istemci tarafında interaktif
 *              bir form sunan `SeoForm` bileşenine prop olarak geçirir.
 *
 * NOT: SEO metadata üretimi ve robots.txt içeriği DEĞİŞTİRİLMEDİ; yalnızca
 *      sayfanın sunum katmanı ortak primitive'lere taşındı.
 *
 * Faz D: başlık `PageHeader`, kart `DashboardSection`, ayar yüklenemediğinde
 * düz metin yerine `ErrorDisplay`.
 */

// Force dynamic rendering to prevent build-time database errors
export const dynamic = 'force-dynamic';

import SeoForm from "@/components/admin/SeoForm";
import { getSeoSettings } from "@/services/contentService";
import fs from "fs/promises";
import path from "path";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";

/**
 * `public/robots.txt` dosyasının içeriğini okur.
 * @returns {Promise<string>} robots.txt dosyasının içeriği.
 * @throws Hata durumunda varsayılan bir robots.txt içeriği döner.
 */
async function getRobotsTxtContent(): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), "public", "robots.txt");
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    console.error("robots.txt dosyası okunamadı, varsayılan içerik kullanılıyor.", error);
    // Dosya bulunamazsa veya bir hata olursa, standart bir varsayılan değer döndür.
    return "User-agent: *\nAllow: /\n\nSitemap: /sitemap.xml";
  }
}

/**
 * SEO ayarları sayfasının ana sunucu bileşeni.
 */
export default async function AdminSeoPage() {
  // Sunucu tarafında mevcut SEO ayarlarını ve robots.txt içeriğini al.
  const seoSettings = await getSeoSettings();
  const robotsTxt = await getRobotsTxtContent();

  const header = (
    <PageHeader
      title="SEO ve Arama Motoru Ayarları"
      description="Site geneli meta bilgileri ve robots.txt içeriğini yönetin."
      breadcrumb={<span>Admin / SEO</span>}
    />
  );

  if (!seoSettings) {
    return (
      <div className="admin-content-spacing">
        {header}
        <ErrorDisplay
          variant="card"
          title="SEO ayarları yüklenemedi"
          message="Ayar kaydı bulunamadı. Veritabanı bağlantısını kontrol edip sayfayı yenileyin."
          showHomeLink={false}
        />
      </div>
    );
  }

  return (
    <div className="admin-content-spacing">
      {header}
      <DashboardSection padding="lg">
        {/* Alınan verileri istemci tarafındaki forma prop olarak geçir. */}
        <SeoForm settings={seoSettings} robotsTxt={robotsTxt} />
      </DashboardSection>
    </div>
  );
}

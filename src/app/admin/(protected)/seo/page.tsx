/**
 * @file SEO ve arama motoru ayarları sayfası (sunucu tarafı).
 * @description Bu sunucu bileşeni, `getSeoSettings` ve `getRobotsTxtContent`
 *              fonksiyonlarını kullanarak mevcut SEO ayarlarını ve robots.txt
 *              içeriğini alır. Ardından bu verileri, istemci tarafında interaktif
 *              bir form sunan `SeoForm` bileşenine prop olarak geçirir.
 */

import SeoForm from "@/components/admin/SeoForm";
import { getSeoSettings } from "@/lib/content-parser";
import fs from "fs/promises";
import path from "path";

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
  const seoSettings = getSeoSettings();
  const robotsTxt = await getRobotsTxtContent();

  return (
    <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">SEO ve Arama Motoru Ayarları</h1>
      {/* Alınan verileri istemci tarafındaki forma prop olarak geçir. */}
      <SeoForm settings={seoSettings} robotsTxt={robotsTxt} />
    </div>
  );
}

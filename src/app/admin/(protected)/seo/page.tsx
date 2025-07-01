// src/app/admin/(protected)/seo/page.tsx
import SeoForm from "@/components/admin/SeoForm";
import { getSeoSettings } from "@/lib/content-parser";
import fs from "fs/promises";
import path from "path";

async function getRobotsTxtContent() {
  try {
    const filePath = path.join(process.cwd(), "public", "robots.txt");
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    console.error("Could not read robots.txt, returning default content.");
    return "User-agent: *\nAllow: /\n\nSitemap: /sitemap.xml";
  }
}

export default async function AdminSeoPage() {
  const seoSettings = getSeoSettings();
  const robotsTxt = await getRobotsTxtContent();

  return (
    <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">SEO ve Arama Motoru Ayarları</h1>
      <SeoForm settings={seoSettings} robotsTxt={robotsTxt} />
    </div>
  );
}

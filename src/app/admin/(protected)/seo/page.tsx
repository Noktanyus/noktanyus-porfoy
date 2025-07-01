// src/app/admin/(protected)/seo/page.tsx
import SeoForm from "@/components/admin/SeoForm";
import { getSeoSettings } from "@/lib/content-parser";
import { SeoSettings } from "@/types/content";

export default async function AdminSeoPage() {
  const seoSettings = getSeoSettings();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">SEO Ayarları</h1>
      <SeoForm settings={seoSettings} />
    </div>
  );
}

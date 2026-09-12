/**
 * @file Admin Theme Management Page
 * @description F1: Multi-theme preset yönetim sayfası.
 *              Sistem genelinde varsayılan temayı seçer ve kullanıcı
 *              tercihlerini yönetir. Glassmorphism + oklch color tokens.
 */

import type { Metadata } from "next";
import { ThemeManager } from "@/components/admin/ThemeManager";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tema Yönetimi | Admin",
  description: "Sistem genelinde tema preset'lerini yönet",
};

export default function AdminThemesPage() {
  return (
    <div className="admin-content-spacing">
      <PageHeader
        title="Tema Yönetimi"
        description="Sistem genelinde kullanılan renk paletlerini önizleyin ve seçin. Kullanıcılar kendi tercihlerini ayrıca belirleyebilir."
        breadcrumb={<span>Admin / Tema</span>}
      />

      <ThemeManager />
    </div>
  );
}
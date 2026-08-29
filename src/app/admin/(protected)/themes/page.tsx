/**
 * @file Admin Theme Management Page
 * @description F1: Multi-theme preset yönetim sayfası.
 *              Sistem genelinde varsayılan temayı seçer ve kullanıcı
 *              tercihlerini yönetir. Glassmorphism + oklch color tokens.
 */

import type { Metadata } from "next";
import { ThemeManager } from "@/components/admin/ThemeManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tema Yönetimi | Admin",
  description: "Sistem genelinde tema preset'lerini yönet",
};

export default function AdminThemesPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Tema Yönetimi</h1>
        <p className="text-sm text-muted-foreground">
          Sistem genelinde kullanılan renk paletlerini önizleyin ve seçin.
          Kullanıcılar kendi tercihlerini ayrıca belirleyebilir.
        </p>
      </header>

      <ThemeManager />
    </div>
  );
}
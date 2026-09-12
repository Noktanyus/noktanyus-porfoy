/**
 * @file Yeni bir blog yazısı oluşturma sayfası.
 * @description Bu sayfa, kullanıcıya yeni bir blog gönderisi eklemesi için
 *              boş bir `BlogForm` bileşeni sunar.
 *
 * Faz D: elle yazılmış kart + başlık yerine ortak `PageHeader` (breadcrumb +
 * geri linki) ve `DashboardSection` kullanıldı.
 */

import type { Metadata } from "next";
import BlogForm from "@/components/admin/BlogForm";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";

export const metadata: Metadata = { title: "Yeni Blog Yazısı | Admin" };

/**
 * Yeni blog yazısı ekleme sayfasının ana bileşeni.
 */
export default function NewBlogPage() {
  return (
    <div className="admin-content-spacing">
      <PageHeader
        title="Yeni Blog Yazısı"
        description="Başlık, içerik ve görselleri girin. Taslak olarak kaydedip daha sonra yayınlayabilirsiniz."
        backHref="/admin/blog"
        backLabel="Blog Yönetimi"
        breadcrumb={<span>Admin / Blog / Yeni</span>}
      />

      <DashboardSection padding="lg">
        {/* Herhangi bir başlangıç verisi olmadan boş bir form render edilir. */}
        <BlogForm />
      </DashboardSection>
    </div>
  );
}

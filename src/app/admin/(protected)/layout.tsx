/**
 * @file Korumalı yönetici sayfaları için ana layout (Server Component).
 * @description Bu layout, kimlik doğrulaması gerektiren tüm yönetici sayfalarını
 *              (örn: /admin/dashboard, /admin/projects) sarmalar.
 *              Auth kontrolü sunucu tarafında getServerSession ile anında yapılır:
 *              - Oturum yoksa: /giris?callbackUrl=/admin/dashboard adresine yönlendirir.
 *              - Rol admin değilse: EmptyState ("Yetkisiz erişim") ekranı basar.
 *              - Rol admin ise: AdminLayoutClient responsive kabuğunu render eder.
 *
 *              İç içe SessionProvider kaldırılmıştır; böylece oturum bilgisi
 *              çökmez, istemci tarafı yükleme gecikmesi yaşanmaz ve SSR
 *              güvenliği ile performansı garanti altına alınır.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/giris?callbackUrl=/admin/dashboard");
    return null;
  }

  if (session.user.role !== "admin") {
    return (
      <EmptyState
        variant="page"
        icon="question"
        title="Yetkisiz erişim"
        description="Bu sayfa yalnızca yönetici yetkisi verilen hesaplara açıktır. Yetkiniz varsa çıkış yapıp kendi hesabınızla tekrar giriş yapın."
        action={{ label: "Giriş Yap", href: "/giris" }}
        secondaryAction={{ label: "Ana Sayfa", href: "/" }}
      />
    );
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}

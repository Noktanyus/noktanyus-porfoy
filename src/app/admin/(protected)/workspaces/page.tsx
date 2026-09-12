/**
 * @file Workspace yönetim sayfası.
 * @description Tüm workspace'leri liste halinde gösterir. Server component
 *              olarak çalışır — auth cookie üzerinden kullanıcı email'ini alır
 *              ve workspace service'inden ilgili kayıtları çeker.
 *
 *   Not: Production'da NextAuth session kullanılmalı (session.user.id / email).
 *   Bu sayfa mock cookie yaklaşımıyla geliştirildi. Faz D kapsamında auth
 *   davranışına DOKUNULMADI (yalnızca sunum katmanı düzeltildi).
 *
 * Faz D düzeltmeleri:
 *  - `admin-container` sınıfı projede TANIMLI DEĞİL; sayfa hiçbir layout
 *    sınıfı almıyordu. `admin-content-spacing` ile değiştirildi.
 *  - Yükleme hatası yalnızca `console.error` ile yutuluyordu; kullanıcı
 *    "hiç workspace yok" sanıyordu. Artık `ErrorDisplay` gösterilir.
 *  - `/admin/workspaces/new` ve `/admin/workspaces/[id]` route'ları projede
 *    YOK; her iki CTA 404'e gidiyordu. Kaldırıldılar. Kart içinden yalnızca
 *    gerçekten var olan `/dashboard/workspaces/[id]/branding` sayfasına link
 *    verilir.
 *  - `any[]` yerine servis dönüş tipi kullanıldı.
 */

import Link from 'next/link';
import { cookies } from 'next/headers';
import { FaPalette } from 'react-icons/fa';
import { workspaceService } from '@/modules/admin/workspaceService';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { StatusBadge } from '@/components/ui/StatusBadge';

export const dynamic = 'force-dynamic';

type WorkspaceListItem = Awaited<ReturnType<typeof workspaceService.listForUser>>[number];

export default async function WorkspacesPage() {
  // Mock session - gerçek projede NextAuth session kullan (davranış korundu)
  const cookieStore = cookies();
  const userEmail = cookieStore.get('admin-email')?.value ?? 'admin@noktanyus.com';

  let workspaces: WorkspaceListItem[] = [];
  let error: string | null = null;

  try {
    // Production'da: session.user.id kullan
    workspaces = await workspaceService.listForUser(userEmail);
  } catch (err) {
    console.error('Failed to load workspaces', err);
    error = err instanceof Error ? err.message : 'Workspace listesi yüklenemedi';
  }

  const header = (
    <PageHeader
      title="Workspace'ler"
      description={
        error ? undefined : `${workspaces.length} workspace erişiminizde`
      }
      breadcrumb={<span>Admin / Workspace&apos;ler</span>}
    />
  );

  if (error) {
    return (
      <div className="admin-content-spacing">
        {header}
        <ErrorDisplay
          variant="card"
          title="Workspace'ler yüklenemedi"
          message={error}
          showHomeLink={false}
        />
      </div>
    );
  }

  return (
    <div className="admin-content-spacing">
      {header}

      {workspaces.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="Henüz workspace yok"
          description="Hesabınıza bağlı bir workspace bulunmuyor. Workspace üyeliği eklendiğinde bu listede görünecek."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => {
            const memberCount = ws._count?.members ?? ws.members?.length ?? 0;
            return (
              <li key={ws.id} className="admin-card flex flex-col">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h2 className="min-w-0 truncate text-lg font-semibold">{ws.name}</h2>
                  <StatusBadge
                    size="sm"
                    tone="info"
                    label={`${memberCount} üye`}
                    srLabel="Üye sayısı:"
                  />
                </div>

                <p className="mb-3 line-clamp-2 flex-1 text-sm text-muted-foreground">
                  {ws.description ?? 'Açıklama girilmemiş'}
                </p>

                <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3 text-xs">
                  <span className="truncate font-mono text-muted-foreground">@{ws.slug}</span>
                  <Link
                    href={`/dashboard/workspaces/${ws.id}/branding`}
                    className="inline-flex shrink-0 items-center gap-1.5 text-brand-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  >
                    <FaPalette aria-hidden="true" className="w-3 h-3" />
                    Branding
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

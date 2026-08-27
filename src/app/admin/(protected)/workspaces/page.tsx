/**
 * @file Workspace yönetim sayfası.
 * @description Tüm workspace'leri liste halinde gösterir, yeni workspace
 *              oluşturma linki sunar. Server component olarak çalışır —
 *              auth cookie üzerinden kullanıcı email'ini alır ve workspace
 *              service'inden ilgili kayıtları çeker.
 *
 *   Not: Production'da NextAuth session kullanılmalı (session.user.id / email).
 *   Bu sayfa mock cookie yaklaşımıyla geliştirildi, sonraki sprint'lerde
 *   session adaptasyonu yapılacak.
 */

import { workspaceService } from '@/modules/admin/workspaceService';
import Link from 'next/link';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function WorkspacesPage() {
  // Mock session - gerçek projede NextAuth session kullan
  const cookieStore = cookies();
  const userEmail = cookieStore.get('admin-email')?.value ?? 'admin@noktanyus.com';

  let workspaces: any[] = [];
  try {
    // Production'da: session.user.id kullan
    workspaces = await workspaceService.listForUser(userEmail);
  } catch (err) {
    console.error('Failed to load workspaces', err);
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Workspace&apos;ler</h1>
          <p className="admin-subtitle">{workspaces.length} workspace</p>
        </div>
        <Link href="/admin/workspaces/new" className="admin-btn admin-btn-primary">
          + Yeni Workspace
        </Link>
      </div>

      {workspaces.length === 0 ? (
        <div className="admin-card text-center py-12">
          <p className="text-5xl mb-3">🏢</p>
          <p className="text-lg text-muted-foreground">Henüz workspace yok</p>
          <p className="text-sm text-muted-foreground mt-2">İlk workspace&apos;inizi oluşturarak başlayın</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <Link key={ws.id} href={`/admin/workspaces/${ws.id}`}>
              <div className="admin-card hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg">{ws.name}</h3>
                  <span className="admin-status-active">
                    {ws._count?.members ?? ws.members?.length ?? 0} üye
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {ws.description ?? 'Açıklama yok'}
                </p>
                <div className="flex justify-between items-center text-xs text-muted-foreground pt-3 border-t">
                  <span className="font-mono">@{ws.slug}</span>
                  <span>Yönet →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
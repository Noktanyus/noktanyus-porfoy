/**
 * Admin — Hesaplar ve yönetici yetkisi.
 * Yetki verilen kullanıcı kendi şifresiyle giriş yapar; header hesap
 * menüsünden Yönetim'e geçer. Ayrı admin login gerekmez.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listAdminUsers } from '@/modules/admin/userRoleService';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { ResponsiveTable } from '@/components/ui/ResponsiveTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { UserRoleToggle } from '@/components/admin/UserRoleToggle';

export const dynamic = 'force-dynamic';

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: { q?: string; page?: string };
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return null;
  }

  const q = searchParams?.q?.trim() ?? '';
  const page = Number(searchParams?.page ?? '1') || 1;

  let result: Awaited<ReturnType<typeof listAdminUsers>> | null = null;
  let error: string | null = null;

  try {
    result = await listAdminUsers({ q, page, limit: 25 });
  } catch (e) {
    error = e instanceof Error ? e.message : 'Kullanıcılar yüklenemedi';
  }

  const header = (
    <PageHeader
      title="Hesaplar"
      description="Kayıtlı hesaplara yönetici yetkisi verin. Yetkili kullanıcı header'daki hesap menüsünden Yönetim'e girer."
      breadcrumb={<span>Admin / Hesaplar</span>}
    />
  );

  if (error || !result) {
    return (
      <div className="admin-content-spacing space-y-6">
        {header}
        <ErrorDisplay
          variant="card"
          title="Kullanıcılar yüklenemedi"
          message={error ?? 'Beklenmeyen hata'}
          showHomeLink={false}
        />
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(result.total / result.limit));
  const qs = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (nextPage > 1) params.set('page', String(nextPage));
    const s = params.toString();
    return s ? `/admin/users?${s}` : '/admin/users';
  };

  return (
    <div className="admin-content-spacing space-y-6">
      {header}

      <form method="get" action="/admin/users" className="flex flex-col sm:flex-row gap-3">
        <label htmlFor="user-search" className="sr-only">
          E-posta veya ad ara
        </label>
        <input
          id="user-search"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="E-posta veya ad ara"
          className="flex-1 min-h-[44px] rounded-xl border border-border bg-background px-3 text-sm"
        />
        <button type="submit" className="admin-btn admin-btn-secondary min-h-[44px]">
          Ara
        </button>
      </form>

      <p className="text-sm text-muted-foreground">
        {result.total} hesap · Yönetici yetkisi verilen kullanıcı kendi hesabıyla giriş yapar;
        ayrı bir admin girişi gerekmez.
      </p>

      <DashboardSection padding={result.users.length === 0 ? 'md' : 'none'} contained>
        {result.users.length === 0 ? (
          <EmptyState
            variant="inline"
            icon={q ? 'search' : 'inbox'}
            title={q ? 'Sonuç yok' : 'Henüz hesap yok'}
            description={
              q
                ? 'Aramayı değiştirip tekrar deneyin.'
                : 'Kayıt olan kullanıcılar burada listelenir.'
            }
          />
        ) : (
          <ResponsiveTable minWidth="720px" caption="Kayıtlı hesaplar" className="rounded-none border-0">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Hesap
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Rol
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Kayıt
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody>
              {result.users.map((user) => {
                const isSelf = session?.user?.id === user.id;
                const isAdmin = user.role === 'admin';
                return (
                  <tr key={user.id} className="border-t border-border/60">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {user.name || 'İsimsiz'}
                        {isSelf && (
                          <span className="ml-2 text-xs text-muted-foreground">(Siz)</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        tone={isAdmin ? 'brand' : 'neutral'}
                        label={isAdmin ? 'Yönetici' : 'Kullanıcı'}
                        dot
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <UserRoleToggle
                        userId={user.id}
                        email={user.email}
                        role={user.role}
                        isSelf={isSelf}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </ResponsiveTable>
        )}
      </DashboardSection>

      {totalPages > 1 && (
        <nav className="flex items-center justify-between gap-3 text-sm" aria-label="Sayfalama">
          <a
            href={qs(Math.max(1, result.page - 1))}
            className={`admin-btn admin-btn-secondary ${result.page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
            aria-disabled={result.page <= 1}
          >
            Önceki
          </a>
          <span className="text-muted-foreground">
            Sayfa {result.page} / {totalPages}
          </span>
          <a
            href={qs(Math.min(totalPages, result.page + 1))}
            className={`admin-btn admin-btn-secondary ${result.page >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
            aria-disabled={result.page >= totalPages}
          >
            Sonraki
          </a>
        </nav>
      )}
    </div>
  );
}

/**
 * Dashboard — Hesap aktivite günlüğü (audit)
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/dashboard/PageHeader';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ACTION_TR: Record<string, string> = {
  CREATE: 'Oluşturma',
  UPDATE: 'Güncelleme',
  DELETE: 'Silme',
  LOGIN: 'Giriş',
  LOGOUT: 'Çıkış',
  LOGIN_FAILED: 'Başarısız giriş',
  EXPORT: 'Dışa aktarma',
  REFUND: 'İade',
  REGISTER: 'Kayıt',
  PASSWORD_RESET: 'Şifre sıfırlama',
  DATA_ACCESS: 'Veri erişimi',
  DATA_EXPORT: 'Veri indirme',
  CONSENT_GRANT: 'Onay',
  CONSENT_REVOKE: 'Onay iptali',
  SETTINGS_UPDATE: 'Ayar güncelleme',
};

function formatTs(d: Date) {
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

export default async function ActivityPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/giris?callbackUrl=/dashboard/activity');

  const userId = (session.user as { id: string }).id;
  const logs = await prisma.auditLog.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: 80,
    select: {
      id: true,
      action: true,
      resource: true,
      resourceId: true,
      status: true,
      ipAddress: true,
      timestamp: true,
      errorMessage: true,
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aktivite"
        description="Hesabınıza bağlı güvenlik ve işlem kayıtları"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/settings" className="admin-btn admin-btn-secondary">
              Ayarlar
            </Link>
            <Link href="/dashboard/usage" className="admin-btn admin-btn-secondary">
              API kullanımı
            </Link>
          </div>
        }
      />

      {logs.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Henüz kayıt yok. Giriş, API anahtarı oluşturma ve ayar değişiklikleri burada görünür.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Zaman</th>
                <th className="px-4 py-3 font-semibold">İşlem</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Kaynak</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">IP</th>
                <th className="px-4 py-3 font-semibold">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((row) => (
                <tr key={row.id} className="bg-card/40 hover:bg-muted/20">
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums text-muted-foreground">
                    {formatTs(row.timestamp)}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {ACTION_TR[row.action] ?? row.action}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="font-mono text-xs">{row.resource}</span>
                    {row.resourceId && (
                      <span className="text-muted-foreground text-xs ml-1 truncate max-w-[8rem] inline-block align-bottom">
                        #{row.resourceId.slice(0, 8)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell font-mono text-xs text-muted-foreground">
                    {row.ipAddress ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        row.status === 'success'
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-rose-700 dark:text-rose-300'
                      }
                    >
                      {row.status === 'success' ? 'OK' : 'Hata'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

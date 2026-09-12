/**
 * @file SaaS App Layout — Authenticated SaaS sayfaları için ortak chrome.
 * @description /saas/dashboard, /saas/generate, /saas/brand-voice, /saas/jobs
 *              sayfalarını sarar. getServerSession ile auth kontrolü yapar;
 *              session yoksa /giris'e yönlendirir. Side nav + üst başlık bar.
 *
 *              Server component — tüm sayfa render'ı server-side. Client
 *              etkileşimler alt bileşenlerde (nav aktif state, form, modal vb.).
 *
 * Faz D değişiklikleri:
 *  - Emoji navigasyon `SaasAppNav` (react-icons) ile değiştirildi.
 *  - Workspace/hesap alanı standartlaştırıldı: workspace yoksa kullanıcıya
 *    ne yapması gerektiğini söyleyen görünür bir uyarı gösterilir (sessizce
 *    boş bırakılmaz).
 *  - Workspace sorgusu hata verirse sayfa çökmüyor; uyarı satırı gösterilir.
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { FaBuilding, FaExclamationTriangle, FaUserCog } from 'react-icons/fa';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SaasAppNav } from '@/components/saas/SaasAppNav';

export const dynamic = 'force-dynamic';

interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
}

/**
 * Kullanıcının üye olduğu en son workspace'i döner.
 * Hata durumunda `null` + `failed: true` döner — layout render'ı bloklanmaz.
 */
async function loadActiveWorkspace(
  userId: string,
): Promise<{ workspace: WorkspaceSummary | null; failed: boolean }> {
  try {
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId },
      select: {
        workspace: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { joinedAt: 'desc' },
    });
    return { workspace: membership?.workspace ?? null, failed: false };
  } catch (error) {
    console.error('SaaS layout: workspace yüklenemedi', error);
    return { workspace: null, failed: true };
  }
}

export default async function SaasAppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/giris?callbackUrl=/saas/dashboard');
  }

  const userId = session.user.id as string;
  const { workspace, failed } = await loadActiveWorkspace(userId);

  const email = session.user.email ?? '';
  const displayName = session.user.name ?? (email || 'Hesabım');
  const initials = (email || displayName).slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      {/* Üst bar */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          <Link
            href="/saas"
            className="flex items-center gap-2 font-bold min-h-[44px] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span
              aria-hidden="true"
              className="w-7 h-7 rounded-md bg-gradient-to-br from-brand-primary to-purple-600 flex items-center justify-center text-white text-sm"
            >
              ✦
            </span>
            <span className="hidden sm:inline">Noktanyus SaaS</span>
          </Link>

          <div className="flex items-center gap-3 min-w-0">
            {workspace && (
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                <FaBuilding aria-hidden="true" className="shrink-0" />
                <span className="sr-only">Aktif workspace:</span>
                <span className="font-medium text-foreground truncate max-w-[160px]">
                  {workspace.name}
                </span>
              </span>
            )}

            <Link
              href="/dashboard/settings"
              className="flex items-center gap-2 text-sm min-h-[44px] px-2 -mr-2 rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span
                aria-hidden="true"
                className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0"
              >
                {initials}
              </span>
              <span className="hidden sm:block leading-tight min-w-0 text-left">
                <span className="block font-medium text-foreground truncate max-w-[160px]">
                  {displayName}
                </span>
                <span className="block text-xs text-muted-foreground truncate max-w-[160px]">
                  {email}
                </span>
              </span>
              <FaUserCog aria-hidden="true" className="hidden sm:block text-muted-foreground shrink-0" />
              <span className="sr-only">Hesap ayarları</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Workspace durum uyarısı — sessiz başarısızlık yerine görünür mesaj */}
      {(failed || !workspace) && (
        <div
          role="status"
          className="border-b border-amber-500/30 bg-amber-500/10 px-4 sm:px-6 lg:px-8 py-2.5"
        >
          <div className="mx-auto max-w-7xl flex items-start gap-2 text-xs sm:text-sm text-amber-800 dark:text-amber-200">
            <FaExclamationTriangle aria-hidden="true" className="mt-0.5 shrink-0" />
            <p>
              {failed
                ? 'Workspace bilgisi şu an yüklenemedi. Üretim ekranları çalışmaya devam eder; sayfayı yenilemeyi deneyin.'
                : 'Henüz bir workspace üyeliğiniz yok. Üretim geçmişi ve toplu işler workspace bazlı saklanır.'}
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Side nav */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <SaasAppNav />
        </aside>

        {/* İçerik — kök layout'ta zaten main landmark var, burada <div> */}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

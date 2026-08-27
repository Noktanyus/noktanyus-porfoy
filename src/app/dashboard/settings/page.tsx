/**
 * Dashboard — Hesap Ayarları sayfası (server component).
 *
 * Auth kontrolü + kullanıcı bilgilerini DB'den çeker.
 * Tüm form/state işlemleri SettingsOverview (client) tarafında yönetilir.
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SettingsOverview } from '@/components/dashboard/SettingsOverview';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ayarlar | Dashboard',
};

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/giris');
  }

  const userId = (session.user as any).id;
  if (!userId) {
    redirect('/giris');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect('/giris');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ayarlar</h1>
        <p className="text-sm text-muted-foreground">
          Hesap bilgilerinizi, şifrenizi ve hesap silme işlemlerinizi yönetin
        </p>
      </div>
      <SettingsOverview user={user} />
    </div>
  );
}
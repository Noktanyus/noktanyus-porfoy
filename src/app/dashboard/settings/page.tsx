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
import { PageHeader } from '@/components/dashboard/PageHeader';

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

  const userEmail = session.user.email?.toLowerCase().trim();
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: userId },
        ...(userEmail ? [{ email: userEmail }] : []),
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user && userEmail) {
    user = await prisma.user.upsert({
      where: { email: userEmail },
      update: {},
      create: {
        email: userEmail,
        name: session.user.name || 'Admin',
        role: (session.user as any).role || 'admin',
        emailVerified: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  }

  if (!user) {
    redirect('/giris');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ayarlar"
        description="Hesap bilgilerinizi, şifrenizi ve hesap silme işlemlerinizi yönetin"
      />
      <SettingsOverview user={user} />
    </div>
  );
}

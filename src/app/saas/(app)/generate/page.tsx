/**
 * @file SaaS Generate Page — Server entry.
 * @description Server component; brand voice listesini DB'den getirir ve
 *              GenerateClient'i hydrate eder.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GenerateClient } from './GenerateClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'AI ile Üret · Noktanyus SaaS',
  description: 'Tekil veya toplu CSV ile AI ürün açıklaması üretin',
};

export default async function GeneratePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const userId = session.user.id as string;

  const brandVoices = await prisma.brandVoice.findMany({
    where: { workspace: { members: { some: { userId } } } },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true },
    take: 100,
  });

  return <GenerateClient brandVoices={brandVoices} />;
}

/**
 * @file SaaS Brand Voice Page — Server entry.
 * @description Workspace üyesi olduğu brand voice'ları DB'den çeker, client'a prop olarak geçirir.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BrandVoiceClient } from './BrandVoiceClient';
import type { BrandVoiceCardData } from '@/components/saas/BrandVoiceCard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Marka Sesi · Noktanyus SaaS',
  description: 'AI marka sesinizi eğitin ve yönetin',
};

export default async function BrandVoicePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const userId = session.user.id as string;

  const rows = await prisma.brandVoice.findMany({
    where: { workspace: { members: { some: { userId } } } },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      model: true,
      trainedAt: true,
      sampleInputs: true,
    },
  });

  const voices: BrandVoiceCardData[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    model: r.model,
    trainedAt: r.trainedAt ? r.trainedAt.toISOString() : null,
    sampleCount: Array.isArray(r.sampleInputs) ? (r.sampleInputs as unknown[]).length : 0,
  }));

  return <BrandVoiceClient initialVoices={voices} />;
}

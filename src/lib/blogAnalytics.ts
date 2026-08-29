/**
 * @file Blog analitik yardimci modulu.
 * @description Okuma suresi hesaplama, view tracking, popular/related blog
 *              sorgulari burada toplanir. UI ve API katmanlari tarafindan
 *              ortak olarak kullanilir.
 */

import { prisma } from '@/lib/prisma';

/**
 * Icerikten kelime sayisini cikarip ortalama okuma hizina bolerek
 * tahmini okuma suresi (dakika) hesaplar. Minimum 1 dakika doner.
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 180;
  const plainText = content
    .replace(/<[^>]*>/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/[#*_~`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

/**
 * Blog yazisinin view sayisini atomik olarak arttirir.
 * Hata durumunda loglayip yutar (kullanici deneyimini bozmamak icin).
 */
export async function trackBlogView(blogId: string): Promise<void> {
  try {
    await prisma.blog.update({
      where: { id: blogId },
      data: { viewCount: { increment: 1 } },
    });
  } catch (error) {
    console.error('trackBlogView failed', { blogId, error });
  }
}

/**
 * Belirli bir zaman araliginda en cok okunan blog yazilarini getirir.
 * "days" ile filtreleme yapilmazsa tum zamanlar dikkate alinir.
 */
export async function getPopularBlogs(opts: { limit?: number; days?: number } = {}) {
  const limit = opts.limit ?? 5;
  const days = opts.days ?? 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return prisma.blog.findMany({
    where: { date: { gte: since } },
    orderBy: { viewCount: 'desc' },
    take: limit,
    select: {
      id: true,
      slug: true,
      title: true,
      viewCount: true,
      readTimeMinutes: true,
    },
  });
}

/**
 * Ayni kategorideki diger blog yazilarini (ilgili yazilar) getirir.
 * Mevcut yaziyi sonuctan haric tutar.
 */
export async function getRelatedBlogs(blogId: string, category: string, limit = 3) {
  try {
    return await prisma.blog.findMany({
      where: {
        id: { not: blogId },
        category,
      },
      take: limit,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        thumbnail: true,
        category: true,
        readTimeMinutes: true,
      },
    });
  } catch {
    return [];
  }
}

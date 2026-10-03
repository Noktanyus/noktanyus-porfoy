import { prisma } from '../src/lib/prisma';

async function main() {
  const mapping = [
    { title: 'ESTM İle Dijital Dönüşüm', img: '/images/blogs/estm-dijital-donusum.webp' },
    { title: 'Glassmorphism: 2026 UI Trendleri', img: '/images/blogs/glassmorphism-2026.webp' },
    { title: 'Next.js 14 App Router Derinlemesine', img: '/images/blogs/nextjs-14-app-router.webp' },
    { title: 'Prisma vs Drizzle: Hangisi Tercih Edilmeli?', img: '/images/blogs/prisma-vs-drizzle.webp' },
    { title: 'Docker ile Geliştirme Ortamı', img: '/images/blogs/docker-gelistirme-ortami.webp' },
    { title: 'Zod ile Runtime Type Safety', img: '/images/blogs/zod-runtime-safety.webp' },
    { title: 'Stripe ile E-Ticaret Entegrasyonu', img: '/images/blogs/stripe-eticaret.webp' },
    { title: 'Tailwind CSS v4: Geçiş Rehberi', img: '/images/blogs/tailwind-v4-gecis.webp' }
  ];

  for (const item of mapping) {
    const res = await prisma.blog.updateMany({
      where: { title: item.title },
      data: { thumbnail: item.img }
    });
    console.log(`Updated "${item.title}": ${res.count} record(s)`);
  }

  const all = await prisma.blog.findMany({ select: { title: true, thumbnail: true } });
  console.log('Current DB Blogs:', all);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

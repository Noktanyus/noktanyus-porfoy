/**
 * @file Site haritası (sitemap.xml) oluşturan dosya.
 * @description Bu dosya, Next.js'in dosya tabanlı sitemap oluşturma özelliğini
 *              kullanır. Statik sayfaları ve veritabanından okunan dinamik
 *              içerik (projeler, blog yazıları, mağaza ürünleri, planlar)
 *              yollarını birleştirerek arama motorları için bir site haritası
 *              oluşturur.
 *
 *              Ayrıca robots.ts ile birlikte /robots.txt üzerinden
 *              arama motoru botlarına sunulur.
 */

import { MetadataRoute } from 'next';
import { listProjects, listBlogs } from '@/services/contentService';
import { prisma } from '@/lib/prisma';

// Bu satır, Next.js'e bu rotanın önbelleğe alınmamasını ve her istekte
// yeniden oluşturulmasını söyler. Bu, site haritasının her zaman en güncel
// içeriği yansıtmasını sağlar.
export const revalidate = 0;

// .env dosyasından sitenin ana URL'sini al, yoksa localhost kullan
const BASE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXTAUTH_URL ||
  'http://localhost:3000'
).replace(/\/+$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Statik sayfalar için yolları oluştur
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/hakkimda`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/projelerim`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/magaza`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/fiyatlandirma`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/iletisim`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  // 2. Dinamik proje sayfaları için yolları oluştur
  let projectRoutes: MetadataRoute.Sitemap = [];
  try {
    const projects = await listProjects();
    projectRoutes = projects.map((project) => ({
      url: `${BASE_URL}/projelerim/${project.slug}`,
      lastModified: project.date
        ? new Date(project.date).toISOString()
        : new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 0.6,
    }));
  } catch (e) {
    console.warn('sitemap: listProjects failed', e);
  }

  // 3. Dinamik blog sayfaları için yolları oluştur
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const blogs = await listBlogs();
    blogRoutes = blogs.map((blog) => ({
      url: `${BASE_URL}/blog/${blog.slug}`,
      lastModified: new Date(blog.date).toISOString(),
      changeFrequency: 'monthly',
      priority: 0.7,
    }));
  } catch (e) {
    console.warn('sitemap: listBlogs failed', e);
  }

  // 4. Aktif dijital ürünler için mağaza ürün yollarını oluştur
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.digitalProduct.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
    });
    productRoutes = products.map((p) => ({
      url: `${BASE_URL}/magaza/${p.slug}`,
      lastModified: new Date(p.updatedAt).toISOString(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  } catch (e) {
    console.warn('sitemap: digitalProduct findMany failed', e);
  }

  // Tüm yolları birleştirip döndür
  return [
    ...staticRoutes,
    ...projectRoutes,
    ...blogRoutes,
    ...productRoutes,
  ];
}

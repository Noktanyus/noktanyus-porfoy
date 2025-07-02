/**
 * @file Site haritası (sitemap.xml) oluşturan dosya.
 * @description Bu dosya, Next.js'in dosya tabanlı sitemap oluşturma özelliğini
 *              kullanır. Statik sayfaları ve `content` dizininden okunan dinamik
 *              içerik (projeler, blog yazıları) yollarını birleştirerek
 *              arama motorları için bir site haritası oluşturur.
 */

import { MetadataRoute } from 'next';
import { getSortedContentData } from '@/lib/content-parser';
import { Project, Blog } from '@/types/content';

// .env dosyasından sitenin ana URL'sini al, yoksa localhost kullan
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  // 1. Statik sayfalar için yolları oluştur
  const staticRoutes = [
    '', // Ana sayfa
    '/hakkimda',
    '/projelerim',
    '/blog',
    '/iletisim',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(), // Her build'de güncellenir
    changeFrequency: 'monthly' as const, // Sayfaların ne sıklıkla değiştiği
    priority: route === '' ? 1.0 : 0.8, // Sayfanın önceliği (1.0 en yüksek)
  }));

  // 2. Dinamik proje sayfaları için yolları oluştur
  const projects = getSortedContentData<Project>('projects');
  const projectRoutes = projects.map((project) => ({
    url: `${BASE_URL}/projelerim/${project.id}`,
    // Projenin kendi tarih alanı varsa onu kullan, yoksa bugünün tarihini kullan
    lastModified: project.date ? new Date(project.date).toISOString() : new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // 3. Dinamik blog sayfaları için yolları oluştur
  const blogs = getSortedContentData<Blog>('blog');
  const blogRoutes = blogs.map((blog) => ({
    url: `${BASE_URL}/blog/${blog.id}`,
    lastModified: new Date(blog.date).toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Tüm yolları birleştirip döndür
  return [...staticRoutes, ...projectRoutes, ...blogRoutes];
}

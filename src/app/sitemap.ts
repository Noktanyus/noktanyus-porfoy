import { MetadataRoute } from 'next';
import { getSortedContentData } from '@/lib/content-parser';
import { Project, Blog } from '@/types/content';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  // Statik sayfalar
  const staticRoutes = [
    '',
    '/hakkimda',
    '/projelerim',
    '/blog',
    '/iletisim',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Dinamik proje sayfaları
  const projects = getSortedContentData<Project>('projects');
  const projectRoutes = projects.map((project) => ({
    url: `${BASE_URL}/projelerim/${project.id}`,
    lastModified: new Date().toISOString(), // Gerçek bir tarih alanı eklenmeli
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Dinamik blog sayfaları
  const blogs = getSortedContentData<Blog>('blog');
  const blogRoutes = blogs.map((blog) => ({
    url: `${BASE_URL}/blog/${blog.id}`,
    lastModified: blog.date,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...projectRoutes, ...blogRoutes];
}

import { NextResponse } from 'next/server';
import { listBlogs } from '@/services/contentService';

export const dynamic = 'force-dynamic';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'https://noktanyus.com';
  const normalizedBase = baseUrl.replace(/\/$/, '');

  let blogs: Awaited<ReturnType<typeof listBlogs>> = [];
  try {
    blogs = await listBlogs();
  } catch {
    blogs = [];
  }

  const itemsXml = blogs
    .map((blog) => {
      const url = `${normalizedBase}/blog/${blog.slug}`;
      const pubDate = blog.date ? new Date(blog.date).toUTCString() : new Date().toUTCString();
      const title = escapeXml(blog.title || '');
      const description = escapeXml(blog.description || '');
      const author = escapeXml(blog.author || 'Noktanyus');
      const category = blog.category ? `<category>${escapeXml(blog.category)}</category>` : '';

      return `    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
      <author>${author}</author>
      ${category}
    </item>`;
    })
    .join('\n');

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Noktanyus Blog</title>
    <link>${normalizedBase}/blog</link>
    <description>Teknoloji, yazılım ve diğer konulardaki yazılarım.</description>
    <language>tr</language>
    <atom:link href="${normalizedBase}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}

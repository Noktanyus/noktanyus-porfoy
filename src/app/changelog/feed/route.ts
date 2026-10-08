import { CHANGELOG, CHANGELOG_KIND_LABEL } from '@/lib/changelog';

const BASE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXTAUTH_URL ||
  'https://noktanyus.com'
).replace(/\/+$/, '');

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Changelog RSS — /changelog/feed (sayfa ağacı altında, production-safe) */
export async function GET() {
  const items = [...CHANGELOG]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((entry) => {
      const link = entry.href?.startsWith('http')
        ? entry.href
        : `${BASE_URL}${entry.href || '/changelog'}`;
      const title = `[${CHANGELOG_KIND_LABEL[entry.kind]}] ${entry.title}`;
      return `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="false">${entry.id}</guid>
      <pubDate>${new Date(`${entry.date}T12:00:00Z`).toUTCString()}</pubDate>
      <description><![CDATA[${entry.summary}]]></description>
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Noktanyus Changelog</title>
    <link>${BASE_URL}/changelog</link>
    <description>Noktanyus API ve ürün güncellemeleri</description>
    <language>tr-TR</language>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

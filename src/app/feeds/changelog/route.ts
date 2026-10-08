import { buildChangelogRssXml } from '@/lib/changelogRss';

export const dynamic = 'force-static';
export const revalidate = 3600;

/**
 * RSS feed — noktalı segment (/changelog.xml) Vercel/App Router’da
 * güvenilir değil; public/*.xml de bu projede 404 veriyor.
 * Canonical path: /feeds/changelog (rewrite: /changelog.xml).
 */
export function GET() {
  const xml = buildChangelogRssXml();
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

import { CHANGELOG, CHANGELOG_KIND_LABEL } from '@/lib/changelog';

const SITE = 'https://noktanyus.com';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Changelog RSS 2.0 — /feeds/changelog ve rewrite ile /changelog.xml */
export function buildChangelogRssXml(): string {
  const items = [...CHANGELOG]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((entry) => {
      const title = `[${CHANGELOG_KIND_LABEL[entry.kind]}] ${entry.title}`;
      const link = entry.href
        ? entry.href.startsWith('http')
          ? entry.href
          : `${SITE}${entry.href}`
        : `${SITE}/changelog#${entry.id}`;
      const pubDate = new Date(`${entry.date}T12:00:00+03:00`).toUTCString();
      return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">${escapeXml(entry.id)}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(CHANGELOG_KIND_LABEL[entry.kind])}</category>
      <description>${escapeXml(entry.summary)}</description>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Noktanyus Changelog</title>
    <link>${SITE}/changelog</link>
    <description>Noktanyus API ve ürün güncellemeleri</description>
    <language>tr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}

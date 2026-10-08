/**
 * public/changelog.xml üretir — Vercel static serve (route handler gerekmez).
 * npm run build öncesi veya changelog değişince çalıştır.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// changelog.ts ile senkron tutulmalı (build-time basit generator)
const CHANGELOG = [
  {
    id: '2026-10-08-google-oauth',
    date: '2026-10-08',
    title: 'Google ile giriş ve kayıt',
    summary:
      'Giriş ve kayıt ekranlarında Google OAuth; e-posta ile devam seçeneği korundu.',
    kind: 'Özellik',
    href: '/giris',
  },
  {
    id: '2026-10-08-live-playground',
    date: '2026-10-08',
    title: 'Ana sayfada canlı IBAN playground',
    summary:
      'API anahtarı olmadan tarayıcıda anında IBAN + banka çözümü denenebilir; tam araçlara tek tık.',
    kind: 'Özellik',
    href: '/#canli-playground',
  },
  {
    id: '2026-10-01-tr-tools',
    date: '2026-10-01',
    title: 'Ücretsiz TR araç seti genişletildi',
    summary:
      'IBAN, TCKN/VKN, KDV/tevkifat ve iş günü hesaplama araçları canlı ve API ile aynı algoritmayı kullanır.',
    kind: 'Özellik',
    href: '/araclar',
  },
  {
    id: '2026-09-20-welcome-credits',
    date: '2026-09-20',
    title: 'Kayıtta ücretsiz API kredisi',
    summary:
      'Yeni hesaplarda tek seferlik karşılama kredisi; e-posta doğrulama sonrası bakiyeye işlenir.',
    kind: 'Özellik',
    href: '/kayit',
  },
  {
    id: '2026-09-10-paytr',
    date: '2026-09-10',
    title: 'PayTR ile plan ve kredi ödemesi',
    summary:
      'Aylık API planları ve ön ödemeli kredi paketleri PayTR üzerinden tahsil edilir.',
    kind: 'Özellik',
    href: '/magaza',
  },
  {
    id: '2026-08-15-openapi',
    date: '2026-08-15',
    title: 'OpenAPI + Redoc referansı',
    summary:
      '/docs altında interaktif referans; openapi.json CI ile senkron tutulur.',
    kind: 'Dokümantasyon',
    href: '/docs',
  },
];

const BASE = 'https://noktanyus.com';

const items = [...CHANGELOG]
  .sort((a, b) => (a.date < b.date ? 1 : -1))
  .map((entry) => {
    const link = `${BASE}${entry.href || '/changelog'}`;
    return `
    <item>
      <title><![CDATA[[${entry.kind}] ${entry.title}]]></title>
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
    <link>${BASE}/changelog</link>
    <description>Noktanyus API ve ürün güncellemeleri</description>
    <language>tr-TR</language>
    ${items}
  </channel>
</rss>
`;

const out = join(root, 'public', 'changelog.xml');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, xml, 'utf8');
console.log('Wrote', out);

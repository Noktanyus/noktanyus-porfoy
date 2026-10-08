/**
 * API / ürün changelog — developer portal standardı (breaking / feature / fix).
 * RSS veya e-posta aboneliği ileride bu kaynağa bağlanabilir.
 */

export type ChangelogKind = 'feature' | 'fix' | 'security' | 'breaking' | 'docs';

export interface ChangelogEntry {
  id: string;
  date: string; // ISO date YYYY-MM-DD
  title: string;
  summary: string;
  kind: ChangelogKind;
  href?: string;
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: '2026-10-08-google-oauth',
    date: '2026-10-08',
    title: 'Google ile giriş ve kayıt',
    summary:
      'Giriş ve kayıt ekranlarında Google OAuth; e-posta ile devam seçeneği korundu.',
    kind: 'feature',
    href: '/giris',
  },
  {
    id: '2026-10-08-live-playground',
    date: '2026-10-08',
    title: 'Ana sayfada canlı IBAN playground',
    summary:
      'API anahtarı olmadan tarayıcıda anında IBAN + banka çözümü denenebilir; tam araçlara tek tık.',
    kind: 'feature',
    href: '/#canli-playground',
  },
  {
    id: '2026-10-01-tr-tools',
    date: '2026-10-01',
    title: 'Ücretsiz TR araç seti genişletildi',
    summary:
      'IBAN, TCKN/VKN, KDV/tevkifat ve iş günü hesaplama araçları canlı ve API ile aynı algoritmayı kullanır.',
    kind: 'feature',
    href: '/araclar',
  },
  {
    id: '2026-09-20-welcome-credits',
    date: '2026-09-20',
    title: 'Kayıtta ücretsiz API kredisi',
    summary:
      'Yeni hesaplarda tek seferlik karşılama kredisi; e-posta doğrulama sonrası bakiyeye işlenir.',
    kind: 'feature',
    href: '/kayit',
  },
  {
    id: '2026-09-10-paytr',
    date: '2026-09-10',
    title: 'PayTR ile plan ve kredi ödemesi',
    summary:
      'Aylık API planları ve ön ödemeli kredi paketleri PayTR üzerinden tahsil edilir.',
    kind: 'feature',
    href: '/magaza',
  },
  {
    id: '2026-08-15-openapi',
    date: '2026-08-15',
    title: 'OpenAPI + Redoc referansı',
    summary:
      '/docs altında interaktif referans; openapi.json CI ile senkron tutulur.',
    kind: 'docs',
    href: '/docs',
  },
];

export const CHANGELOG_KIND_LABEL: Record<ChangelogKind, string> = {
  feature: 'Özellik',
  fix: 'Düzeltme',
  security: 'Güvenlik',
  breaking: 'Kırıcı',
  docs: 'Dokümantasyon',
};

export function getRecentChangelog(limit = 4): ChangelogEntry[] {
  return [...CHANGELOG]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, limit);
}

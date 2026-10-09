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
    id: '2026-10-09-monitor-webhooks-net',
    date: '2026-10-09',
    title: 'Monitör webhook olayları ve net→brüt API',
    summary:
      'monitor.down/up/created/deleted kullanıcıya scoped dispatch; /api/v1/labor/net-to-gross.',
    kind: 'feature',
    href: '/docs/webhooks',
  },
  {
    id: '2026-10-09-payroll-ubl',
    date: '2026-10-09',
    title: 'Brüt→net maaş ve UBL-TR XML doğrulama',
    summary:
      '/api/v1/labor/gross-to-net (SGK/işsizlik/damga/GV) ve /api/v1/invoice/ubl-validate yapısal lint.',
    kind: 'feature',
    href: '/docs',
  },
  {
    id: '2026-10-09-workspaces-monitors-labor',
    date: '2026-10-09',
    title: 'Workspaces, monitörler, fazla mesai / yıllık izin API',
    summary:
      'Dashboard workspaces + davet kabul; uptime monitör CRUD ve saatlik cron; /api/v1/labor/overtime ve annual-leave; usage CSV export.',
    kind: 'feature',
    href: '/dashboard/workspaces',
  },
  {
    id: '2026-10-09-saas-console',
    date: '2026-10-09',
    title: 'Usage dashboard, webhook playground, SDK ve rate-limit docs',
    summary:
      'Dashboard’da API kullanımı ve webhook test UI; /docs/sdk, /docs/rate-limits; mağazada plan karşılaştırma matrisi.',
    kind: 'feature',
    href: '/dashboard/usage',
  },
  {
    id: '2026-10-09-tr-builders',
    date: '2026-10-09',
    title: 'IBAN build, TR Karekod, auto-validate, metin normalize',
    summary:
      'Yeni uçlar: /api/v1/iban/build, /api/v1/pay/qr, /api/v1/validate/auto, /api/v1/text/normalize. Öne çıkan video: yalnızca embed; olay metni aynı blokta.',
    kind: 'feature',
    href: '/docs',
  },
  {
    id: '2026-10-09-error-contract',
    date: '2026-10-09',
    title: 'API hata kodları referansı',
    summary:
      '/docs/hatalar altında HTTP + error.code + retryable sözleşmesi; agent ve SDK entegrasyonları için sabit kodlar.',
    kind: 'docs',
    href: '/docs/hatalar',
  },
  {
    id: '2026-10-09-dx-portal',
    date: '2026-10-09',
    title: 'Durum sayfası, llms.txt ve kod tarifleri',
    summary:
      'Sistem durumu (/durum), LLM-dostu llms.txt, ana sayfada cURL/Node/Python kopyala-yapıştır örnekleri ve güvenilir changelog RSS (/feeds/changelog).',
    kind: 'feature',
    href: '/durum',
  },
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

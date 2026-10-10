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
    id: '2026-10-10-webhook-dlq-retry-ux',
    date: '2026-10-10',
    title: 'Webhook başarısız teslimat / DLQ UX',
    summary:
      '/dashboard/webhooks: FAILED/RETRYING/DEAD_LETTER listesi (durum, deneme sayısı, son hata) + Yeniden dene (replay); Türkçe durum etiketleri.',
    kind: 'feature',
    href: '/dashboard/webhooks',
  },
  {
    id: '2026-10-10-mcp-agent-tools',
    date: '2026-10-10',
    title: 'MCP-ready agent tool yüzeyi',
    summary:
      'Statik /mcp.json + GET /api/v1/agent/tools (OpenAPI’den MCP-uyumlu name/inputSchema); güvenli get_health / list_api_docs; /docs/mcp.',
    kind: 'feature',
    href: '/docs/mcp',
  },
  {
    id: '2026-10-10-usage-error-rate',
    date: '2026-10-10',
    title: 'Usage hata oranı (4xx+5xx)',
    summary:
      '/dashboard/usage ve /api/user/usage: pencere bazlı genel hata oranı % + en çok hata veren endpoint’ler (ApiKeyUsage.statusCode).',
    kind: 'feature',
    href: '/dashboard/usage',
  },
  {
    id: '2026-10-10-request-observability-headers',
    date: '2026-10-10',
    title: 'İstek observability yanıt başlıkları',
    summary:
      'TR API (withApiKey): X-Request-Id, X-RateLimit-Reset (unix sn), X-Request-Duration (ms); /docs/rate-limits ve /docs/hatalar.',
    kind: 'feature',
    href: '/docs/rate-limits',
  },
  {
    id: '2026-10-10-usage-latency',
    date: '2026-10-10',
    title: 'Usage latency insights (p50 / p95)',
    summary:
      'ApiKeyUsage.durationMs kaydı; /dashboard/usage ve /api/user/usage üzerinde genel + endpoint bazlı p50/p95/ort. gecikme.',
    kind: 'feature',
    href: '/dashboard/usage',
  },
  {
    id: '2026-10-09-ip-allowlist-api-version',
    date: '2026-10-09',
    title: 'API key IP allowlist + X-API-Version',
    summary:
      'Anahtar başına IP/CIDR allowlist (403 IP_NOT_ALLOWED); tüm TR API yanıtlarında X-API-Version; /docs/versioning.',
    kind: 'feature',
    href: '/docs/versioning',
  },
  {
    id: '2026-10-09-billing-projection',
    date: '2026-10-09',
    title: 'Usage maliyet tahmini (TRY)',
    summary:
      '/dashboard/usage: ay sonu fatura tahmini, kota aşımı × kredi birim fiyatı, plan ücreti özeti.',
    kind: 'feature',
    href: '/dashboard/usage',
  },
  {
    id: '2026-10-09-docs-md-agents',
    date: '2026-10-09',
    title: 'Agent Markdown API docs (/docs/md)',
    summary:
      'OpenAPI’den üretilen text/markdown endpoint index + per-path sayfalar; llms.txt linkleri.',
    kind: 'docs',
    href: '/docs/md',
  },
  {
    id: '2026-10-09-webhook-hmac-playground',
    date: '2026-10-09',
    title: 'Webhook HMAC doğrulama playground',
    summary:
      '/dashboard/webhooks içinde tarayıcıda sha256 HMAC üretimi ve header karşılaştırması (secret sunucuya gitmez).',
    kind: 'feature',
    href: '/dashboard/webhooks',
  },
  {
    id: '2026-10-09-quota-soft-alerts',
    date: '2026-10-09',
    title: 'Kota soft bildirimleri (%80 / %95)',
    summary:
      'TR API isteklerinde günde bir kez in-app kota uyarısı; exhausted durumda mağaza linki.',
    kind: 'feature',
    href: '/dashboard/notifications',
  },
  {
    id: '2026-10-09-usage-forecast-python-sdk',
    date: '2026-10-09',
    title: 'Usage kota projeksiyonu ve Python SDK',
    summary:
      'Dashboard /usage: ay sonu tahmini, kota doluluk ve kredi dayanma süresi; resmi stdlib Python client (sdk/python) + /docs/sdk.',
    kind: 'feature',
    href: '/dashboard/usage',
  },
  {
    id: '2026-10-09-postman-rotate-hobby',
    date: '2026-10-09',
    title: 'Postman export, API key rotate, Hobby cron düzeltmesi',
    summary:
      '/api/openapi/postman; API key secret döndürme; Vercel Hobby saatlik cron engeli giderildi (monitor GHA cron).',
    kind: 'fix',
    href: '/api/openapi/postman',
  },
  {
    id: '2026-10-09-support-badge-email',
    date: '2026-10-09',
    title: 'Destek merkezi, sağlık rozeti ve e-posta MX aracı',
    summary:
      '/dashboard/support; /api/health/badge SVG; /araclar/email-mx + ücretsiz /api/tools/email-mx; webhook replay ve katalog.',
    kind: 'feature',
    href: '/dashboard/support',
  },
  {
    id: '2026-10-09-webhook-replay-catalog',
    date: '2026-10-09',
    title: 'Webhook replay, API kataloğu ve tebligat aracı',
    summary:
      'Dead-letter/failed delivery replay; /docs/catalog; /araclar/tebligat-suresi; activity/notifications/referral; kıdem + yazıya çevir.',
    kind: 'feature',
    href: '/dashboard/webhooks',
  },
  {
    id: '2026-10-09-activity-severance-playground',
    date: '2026-10-09',
    title: 'Aktivite, bildirimler, kıdem, yazıya çevir, davet',
    summary:
      'Dashboard activity/notifications/referral; araçlar: kidem-tazminati + sayiyi-yaziya; playground; CI cancel-in-progress kapatıldı.',
    kind: 'feature',
    href: '/dashboard/activity',
  },
  {
    id: '2026-10-09-loyalty-oauth-tools',
    date: '2026-10-09',
    title: 'Sadakat, OAuth apps ve İK ücretsiz araçları',
    summary:
      'Dashboard loyalty + OAuth PKCE istemcileri; /araclar/brut-net-maas ve fazla-mesai-izin; webhook delivery logları.',
    kind: 'feature',
    href: '/dashboard/loyalty',
  },
  {
    id: '2026-10-09-ops-console',
    date: '2026-10-09',
    title: 'Alert kanalları, status pages ve görev panosu',
    summary:
      'Dashboard alert-channels, status-pages CRUD; workspace TaskBoard + /api/tasks; monitör bildirimleri.',
    kind: 'feature',
    href: '/dashboard/status-pages',
  },
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

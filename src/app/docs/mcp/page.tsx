import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'MCP / Agent araçları — Noktanyus',
  description:
    'OpenAPI’den üretilen MCP-uyumlu tool kataloğu: /mcp.json, /api/v1/agent/tools, güvenli read-only health ve docs index.',
  alternates: { canonical: '/docs/mcp' },
};

export default function McpDocsPage() {
  return (
    <div className="relative bg-blob-decoration min-h-[70vh]">
      <div className="container-responsive py-10 sm:py-14 relative z-10 max-w-3xl space-y-8">
        <nav className="text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-brand-primary">
            Ana sayfa
          </Link>
          <span className="mx-2">/</span>
          <Link href="/docs" className="hover:text-brand-primary">
            Docs
          </Link>
          <span className="mx-2">/</span>
          <span>MCP / Agent</span>
        </nav>

        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">
            Agent surface
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            MCP ve agent araçları
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Tam bir MCP SDK sunucusu yerine hafif bir keşif yüzeyi: OpenAPI’den türetilen tool
            tanımları, statik <code className="text-xs">/mcp.json</code> ve güvenli read-only
            uçlar. Host (Cursor, Claude, özel agent) tool listesini HTTP ile alır ve{' '}
            <code className="text-xs">tools/call</code> yerine REST çağırır.
          </p>
        </header>

        <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <h2 className="text-lg font-bold text-foreground">Keşif uçları</h2>
          <ul className="space-y-2">
            <li className="rounded-xl border border-border px-4 py-3">
              <a href="/mcp.json" className="font-mono text-brand-primary hover:underline">
                GET /mcp.json
              </a>
              <p className="mt-1">
                Statik manifesto: tools URL, auth başlığı, güvenli tool listesi, llms/OpenAPI
                kaynakları.
              </p>
            </li>
            <li className="rounded-xl border border-border px-4 py-3">
              <a
                href="/api/v1/agent/tools"
                className="font-mono text-brand-primary hover:underline"
              >
                GET /api/v1/agent/tools
              </a>
              <p className="mt-1">
                OpenAPI + meta tool’lar. Her öğede MCP uyumlu{' '}
                <code className="text-xs">name</code>, <code className="text-xs">description</code>
                , <code className="text-xs">inputSchema</code> ve HTTP bağlama (
                <code className="text-xs">http.method</code> / <code className="text-xs">path</code>
                ).
              </p>
            </li>
            <li className="rounded-xl border border-border px-4 py-3">
              <a
                href="/api/v1/agent/tools?safe=1"
                className="font-mono text-brand-primary hover:underline"
              >
                GET /api/v1/agent/tools?safe=1
              </a>
              <p className="mt-1">
                Yalnızca kimlik gerektirmeyen read-only tool’lar:{' '}
                <code className="text-xs">get_health</code>,{' '}
                <code className="text-xs">list_api_docs</code>,{' '}
                <code className="text-xs">get_llms_txt</code>.
              </p>
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <h2 className="text-lg font-bold text-foreground">Agent nasıl bağlanır?</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              <code className="text-xs">/mcp.json</code> veya{' '}
              <code className="text-xs">/api/v1/agent/tools?safe=1</code> ile keşfet.
            </li>
            <li>
              Sağlık için <code className="text-xs">GET /api/health</code> çağır (API key yok).
            </li>
            <li>
              Endpoint özeti için{' '}
              <Link href="/docs/md" className="text-brand-primary hover:underline">
                /docs/md
              </Link>{' '}
              veya{' '}
              <Link href="/llms.txt" className="text-brand-primary hover:underline">
                /llms.txt
              </Link>
              .
            </li>
            <li>
              Ücretli TR uçları için{' '}
              <Link href="/dashboard/api-keys" className="text-brand-primary hover:underline">
                API anahtarı
              </Link>{' '}
              al; istekte <code className="text-xs">x-api-key</code> (veya{' '}
              <code className="text-xs">Authorization: Bearer</code>) gönder.
            </li>
            <li>
              Tool kataloğundaki <code className="text-xs">inputSchema</code> alanlarını body /
              path / query argümanı olarak kullan.
            </li>
          </ol>
        </section>

        <section className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <h2 className="text-lg font-bold text-foreground">Örnek (cURL)</h2>
          <pre className="overflow-x-auto rounded-xl border border-border bg-card/50 p-4 text-xs leading-relaxed">
            {`# Keşif
curl -s https://noktanyus.com/mcp.json | head
curl -s "https://noktanyus.com/api/v1/agent/tools?safe=1"

# Güvenli tool
curl -s https://noktanyus.com/api/health

# TR API (kota düşer)
curl -s -X POST https://noktanyus.com/api/v1/validate/iban \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"iban":"TR330006100519786457841326"}'`}
          </pre>
        </section>

        <section className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <h2 className="text-lg font-bold text-foreground">İlgili</h2>
          <p>
            <Link href="/docs" className="text-brand-primary hover:underline">
              HTML OpenAPI
            </Link>
            {' · '}
            <Link href="/docs/md" className="text-brand-primary hover:underline">
              Markdown index
            </Link>
            {' · '}
            <Link href="/docs/sdk" className="text-brand-primary hover:underline">
              SDK
            </Link>
            {' · '}
            <Link href="/changelog" className="text-brand-primary hover:underline">
              Changelog
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}

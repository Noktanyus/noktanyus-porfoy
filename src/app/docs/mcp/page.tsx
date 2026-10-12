import type { Metadata } from 'next';
import Link from 'next/link';
import { FaRobot, FaSearch, FaTerminal, FaCode } from 'react-icons/fa';

export const metadata: Metadata = {
  title: 'MCP & AI Ajan Araçları — Noktanyus',
  description:
    'OpenAPI ve MCP-uyumlu yapay zeka araç kataloğu: /mcp.json, /api/v1/agent/tools, Claude ve Cursor entegrasyonu.',
  alternates: { canonical: '/docs/mcp' },
};

const DISCOVERY_CURL = `# 1. MCP Manifest Keşfi
curl -s https://noktanyus.com/mcp.json

# 2. Güvenli (Public / Read-only) Araçlar Listesi
curl -s "https://noktanyus.com/api/v1/agent/tools?safe=1"

# 3. TR API Araç Çağrısı (IBAN Doğrulama)
curl -s -X POST https://noktanyus.com/api/v1/validate/iban \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"iban":"TR330006100519786457841326"}'`;

export default function McpDocsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Başlık */}
      <header className="mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold tracking-wide uppercase">
          <FaRobot className="text-[10px]" />
          <span>Yapay Zeka &amp; Agent Arayüzü</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          MCP ve Agent Araçları
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
          Noktanyus API, Model Context Protocol (MCP) ve LLM ajanları (Cursor, Claude Desktop, AutoGPT) için hafif bir keşif
          ve tool kullanım yüzeyi sunar. Agent&apos;lar <code className="text-sm font-mono text-brand-primary">/mcp.json</code> üzerinden
          tüm şemaları keşfederek doğrudan REST üzerinden tool çağrısı yapabilir.
        </p>
      </header>

      {/* Keşif Uç Noktaları */}
      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <FaSearch className="text-brand-primary" />
          <span>Keşif &amp; Şema Uçları</span>
        </h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
          <div className="py-3">
            <a href="/mcp.json" target="_blank" className="font-mono font-bold text-brand-primary hover:underline">
              GET /mcp.json
            </a>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              Statik MCP manifestosu. Tools URL, yetkilendirme şeması ve LLM kaynaklarını döndürür.
            </p>
          </div>
          <div className="py-3">
            <a href="/api/v1/agent/tools" target="_blank" className="font-mono font-bold text-brand-primary hover:underline">
              GET /api/v1/agent/tools
            </a>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              Tüm araç tanımları. Her öğe için MCP uyumlu <code className="text-xs font-mono">name</code>,{' '}
              <code className="text-xs font-mono">description</code>,{' '}
              <code className="text-xs font-mono">inputSchema</code> ve REST bağlama bilgilerini içerir.
            </p>
          </div>
          <div className="py-3">
            <a href="/api/v1/agent/tools?safe=1" target="_blank" className="font-mono font-bold text-brand-primary hover:underline">
              GET /api/v1/agent/tools?safe=1
            </a>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              Kimlik doğrulama gerektirmeyen salt-okunur (read-only) güvenli araçlar listesi.
            </p>
          </div>
        </div>
      </section>

      {/* cURL Keşif & Çağrı */}
      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <FaTerminal className="text-brand-primary" />
          <span>Örnek İstekler (cURL)</span>
        </h2>
        <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs font-mono text-slate-200 leading-relaxed">
          {DISCOVERY_CURL}
        </pre>
      </section>

      {/* LLM Kaynakları CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-xs sm:text-sm">
        <span className="text-slate-700 dark:text-slate-300">
          Agent&apos;lar için optimize edilmiş düz metin Markdown dokümantasyon indeksi:
        </span>
        <div className="flex items-center gap-2">
          <a
            href="/llms.txt"
            target="_blank"
            className="px-3 py-1.5 rounded-xl border border-border bg-card font-semibold text-foreground hover:bg-muted transition-colors"
          >
            llms.txt
          </a>
          <a
            href="/docs/md"
            target="_blank"
            className="px-3 py-1.5 rounded-xl bg-brand-primary font-semibold text-white hover:bg-brand-primary/90 transition-colors"
          >
            /docs/md
          </a>
        </div>
      </div>
    </div>
  );
}

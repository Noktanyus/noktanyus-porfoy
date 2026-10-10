import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'SDK — Noktanyus API (TypeScript, Python & Go)',
  description:
    'Resmi sıfır-bağımlılık TypeScript/Node, Python ve Go SDK: health, IBAN, kimlik ve daha fazlası.',
  alternates: { canonical: '/docs/sdk' },
};

const INSTALL = `// monorepo / bu proje içinde
import { NoktanyusTrClient, NoktanyusApiError } from '@/sdk';

const client = new NoktanyusTrClient({
  apiKey: process.env.NOKTANYUS_API_KEY!,
});`;

const EXAMPLE = `const iban = await client.validateIban('TR330006100519786457841326');
console.log(iban.valid, iban.bankName);

const id = await client.validateIdentity({ type: 'tckn', value: '10000000146' });
console.log(id.valid);`;

const TS_PKG_INSTALL = `# yayınlanabilir paket (native fetch — runtime bağımlılık yok)
cd sdk/typescript && npm install && npm run build
# veya: npm install ./sdk/typescript

import { NoktanyusTrClient, NoktanyusApiError } from 'noktanyus';

const client = new NoktanyusTrClient('ny_live_xxx');`;

const TS_PKG_EXAMPLE = `const health = await client.health();
console.log(health.status);

const iban = await client.validateIban('TR330006100519786457841326');
console.log(iban.valid, iban.bankName);

try {
  const id = await client.validateIdentity({ type: 'tckn', value: '10000000146' });
  console.log(id.valid);
} catch (e) {
  if (e instanceof NoktanyusApiError) console.error(e.code, e.statusCode);
}`;

const PY_INSTALL = `# repodan (stdlib only — pip bağımlılığı yok)
export PYTHONPATH=sdk/python
# veya: pip install -e sdk/python

from noktanyus import NoktanyusTrClient, NoktanyusApiError

client = NoktanyusTrClient("ny_live_xxx")`;

const PY_EXAMPLE = `iban = client.validate_iban("TR330006100519786457841326")
print(iban["valid"], iban.get("bankName"))

try:
    id_ = client.validate_identity(type="tckn", value="10000000146")
    print(id_["valid"])
except NoktanyusApiError as e:
    print(e.code, e.status_code)`;

const GO_INSTALL = `# repodan (stdlib only — net/http)
cd sdk/go && go build ./...
# veya: go get github.com/Noktanyus/noktanyus-porfoy/sdk/go

import "github.com/Noktanyus/noktanyus-porfoy/sdk/go"

client := noktanyus.NewClient("ny_live_xxx")`;

const GO_EXAMPLE = `health, err := client.Health()
if err != nil { /* *noktanyus.APIError */ }
fmt.Println(health.Status)

iban, err := client.ValidateIBAN("TR330006100519786457841326")
if err != nil { /* handle */ }
fmt.Println(iban.Valid, iban.BankName)`;

export default function SdkDocsPage() {
  return (
    <div className="relative bg-blob-decoration min-h-[70vh]">
      <div className="container-responsive py-10 sm:py-14 relative z-10 max-w-3xl">
        <nav className="text-sm text-slate-500 dark:text-slate-400 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-brand-primary">
            Ana sayfa
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <Link href="/docs" className="hover:text-brand-primary">
            Docs
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span>SDK</span>
        </nav>

        <header className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">
            Official client
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            TypeScript, Python &amp; Go SDK
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Zero-dependency istemciler. Anahtarını sunucu tarafında tut; typed{' '}
            <code className="text-sm">code</code> ile retry kararını ver.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/baslangic"
              className="inline-flex min-h-[44px] items-center rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
            >
              5 dk başlangıç
            </Link>
            <Link
              href="/dashboard/api-keys"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-border px-4 py-2 text-sm font-semibold"
            >
              API key al
            </Link>
            <Link
              href="/docs/rate-limits"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-border px-4 py-2 text-sm font-semibold"
            >
              Rate limits
            </Link>
          </div>
        </header>

        <section className="space-y-3 mb-8">
          <h2 className="text-lg font-bold">Kurulum (monorepo)</h2>
          <pre className="overflow-x-auto rounded-2xl bg-slate-950 text-slate-100 p-4 text-[12px] sm:text-sm font-mono leading-relaxed">
            {INSTALL}
          </pre>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-lg font-bold">TypeScript — monorepo ilk çağrılar</h2>
          <pre className="overflow-x-auto rounded-2xl bg-slate-950 text-slate-100 p-4 text-[12px] sm:text-sm font-mono leading-relaxed">
            {EXAMPLE}
          </pre>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-lg font-bold">TypeScript paket — kurulum</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Yayınlanabilir slim client:{' '}
            <code className="text-xs">sdk/typescript/</code> (health + validate; native{' '}
            <code className="text-xs">fetch</code>).
          </p>
          <pre className="overflow-x-auto rounded-2xl bg-slate-950 text-slate-100 p-4 text-[12px] sm:text-sm font-mono leading-relaxed">
            {TS_PKG_INSTALL}
          </pre>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-lg font-bold">TypeScript paket — ilk çağrılar</h2>
          <pre className="overflow-x-auto rounded-2xl bg-slate-950 text-slate-100 p-4 text-[12px] sm:text-sm font-mono leading-relaxed">
            {TS_PKG_EXAMPLE}
          </pre>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-lg font-bold">Python — kurulum</h2>
          <pre className="overflow-x-auto rounded-2xl bg-slate-950 text-slate-100 p-4 text-[12px] sm:text-sm font-mono leading-relaxed">
            {PY_INSTALL}
          </pre>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-lg font-bold">Python — ilk çağrılar</h2>
          <pre className="overflow-x-auto rounded-2xl bg-slate-950 text-slate-100 p-4 text-[12px] sm:text-sm font-mono leading-relaxed">
            {PY_EXAMPLE}
          </pre>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-lg font-bold">Go — kurulum</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Minimal dilim:{' '}
            <code className="text-xs">sdk/go/</code> (health + validate/iban; yalnızca{' '}
            <code className="text-xs">net/http</code>).
          </p>
          <pre className="overflow-x-auto rounded-2xl bg-slate-950 text-slate-100 p-4 text-[12px] sm:text-sm font-mono leading-relaxed">
            {GO_INSTALL}
          </pre>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-lg font-bold">Go — ilk çağrılar</h2>
          <pre className="overflow-x-auto rounded-2xl bg-slate-950 text-slate-100 p-4 text-[12px] sm:text-sm font-mono leading-relaxed">
            {GO_EXAMPLE}
          </pre>
        </section>

        <section className="rounded-2xl border border-border/80 bg-card/40 p-5 text-sm text-slate-600 dark:text-slate-300 space-y-2">
          <p className="font-semibold text-foreground">Kaynak</p>
          <p>
            TS paket: <code className="text-xs">sdk/typescript/</code> · monorepo:{' '}
            <code className="text-xs">src/sdk/trApiClient.ts</code> · Python:{' '}
            <code className="text-xs">sdk/python/noktanyus/</code> · Go:{' '}
            <code className="text-xs">sdk/go/</code>
          </p>
          <p>
            OpenAPI referansı:{' '}
            <Link href="/docs" className="text-brand-primary hover:underline">
              /docs
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}

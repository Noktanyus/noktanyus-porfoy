import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'TypeScript SDK — Noktanyus API',
  description:
    'Resmi sıfır-bağımlılık TypeScript/Node SDK: IBAN, kimlik, KDV ve iş günü çağrıları.',
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
            TypeScript / Node SDK
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Zero-dependency istemci. Anahtarını sunucu tarafında tut;{' '}
            <code className="text-sm">NoktanyusApiError.code</code> ile retry kararını ver.
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
          <h2 className="text-lg font-bold">Kurulum</h2>
          <pre className="overflow-x-auto rounded-2xl bg-slate-950 text-slate-100 p-4 text-[12px] sm:text-sm font-mono leading-relaxed">
            {INSTALL}
          </pre>
        </section>

        <section className="space-y-3 mb-8">
          <h2 className="text-lg font-bold">İlk çağrılar</h2>
          <pre className="overflow-x-auto rounded-2xl bg-slate-950 text-slate-100 p-4 text-[12px] sm:text-sm font-mono leading-relaxed">
            {EXAMPLE}
          </pre>
        </section>

        <section className="rounded-2xl border border-border/80 bg-card/40 p-5 text-sm text-slate-600 dark:text-slate-300 space-y-2">
          <p className="font-semibold text-foreground">Kaynak</p>
          <p>
            Kod: <code className="text-xs">src/sdk/trApiClient.ts</code> · rehber:{' '}
            <code className="text-xs">src/sdk/README.md</code>
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

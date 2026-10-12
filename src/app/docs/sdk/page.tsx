import type { Metadata } from 'next';
import Link from 'next/link';
import { FaCode, FaNpm, FaPython, FaTerminal } from 'react-icons/fa';
import { SiGo } from 'react-icons/si';

export const metadata: Metadata = {
  title: 'Resmi SDK Kütüphaneleri — Noktanyus (TypeScript, Python & Go)',
  description:
    'Resmi sıfır-bağımlılık TypeScript/Node, Python ve Go SDK: health, IBAN, kimlik doğrulama, finans ve daha fazlası.',
  alternates: { canonical: '/docs/sdk' },
};

const TS_INSTALL = `# Standalone npm paketi kurulumu (sıfır runtime bağımlılık, native fetch)
npm install noktanyus
# veya pnpm add noktanyus / yarn add noktanyus`;

const TS_USAGE = `import { NoktanyusTrClient, NoktanyusApiError } from 'noktanyus';

const client = new NoktanyusTrClient(process.env.NOKTANYUS_API_KEY!);

async function main() {
  try {
    // 1. IBAN Doğrulama
    const iban = await client.validateIban('TR330006100519786457841326');
    console.log('Geçerli:', iban.valid, 'Banka:', iban.bankName);

    // 2. TCKN Doğrulama
    const id = await client.validateIdentity({ type: 'tckn', value: '10000000146' });
    console.log('Kimlik geçerli:', id.valid);
  } catch (err) {
    if (err instanceof NoktanyusApiError) {
      console.error('Hata kodu:', err.code, 'HTTP:', err.statusCode);
    }
  }
}

main();`;

const PY_INSTALL = `# pip üzerinden kurulum (harici bağımlılık gerektirmez, Python 3.8+ stdlib)
pip install noktanyus`;

const PY_USAGE = `import os
from noktanyus import NoktanyusTrClient, NoktanyusApiError

client = NoktanyusTrClient(api_key=os.environ["NOKTANYUS_API_KEY"])

try:
    # 1. IBAN Doğrulama
    iban = client.validate_iban("TR330006100519786457841326")
    print("Geçerli:", iban["valid"], "Banka:", iban.get("bankName"))

    # 2. TCKN Doğrulama
    res = client.validate_identity(type="tckn", value="10000000146")
    print("Kimlik geçerli:", res["valid"])
except NoktanyusApiError as e:
    print(f"Hata: {e.code} (HTTP {e.status_code})")`;

const GO_INSTALL = `# Go modülü indirme
go get github.com/Noktanyus/noktanyus-client-go`;

const GO_USAGE = `package main

import (
	"fmt"
	"os"
	"github.com/Noktanyus/noktanyus-client-go"
)

func main() {
	client := noktanyus.NewClient(os.Getenv("NOKTANYUS_API_KEY"))

	// IBAN Doğrulama
	iban, err := client.ValidateIBAN("TR330006100519786457841326")
	if err != nil {
		fmt.Printf("Hata: %v\\n", err)
		return
	}
	fmt.Printf("Geçerli: %t, Banka: %s\\n", iban.Valid, iban.BankName)
}`;

export default function SdkDocsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Başlık */}
      <header className="mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide uppercase">
          <FaCode className="text-[10px]" />
          <span>Resmi İstemci Kütüphaneleri</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          TypeScript, Python &amp; Go SDK
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
          Noktanyus API için resmi ve hafif (zero-runtime-dependency) SDK kütüphaneleri. Tip güvenli arayüzler, otomatik hata modelleme ve yerleşik retry desteği sunar.
        </p>
      </header>

      {/* Diller Bölümü */}
      <div className="space-y-8">
        {/* TypeScript / Node.js */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xl">
              <FaCode />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">TypeScript / Node.js</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Node.js 18+, Bun, Deno ve modern JS runtime desteği</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Kurulum
              </span>
              <pre className="overflow-x-auto rounded-xl bg-slate-950 p-3.5 text-xs font-mono text-emerald-400">
                {TS_INSTALL}
              </pre>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Kullanım Örneği
              </span>
              <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs font-mono text-slate-200 leading-relaxed">
                {TS_USAGE}
              </pre>
            </div>
          </div>
        </section>

        {/* Python */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xl">
              <FaPython />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Python</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Python 3.8+ (sıfır pip bağımlılığı, yerleşik urllib ve ssl)</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Kurulum
              </span>
              <pre className="overflow-x-auto rounded-xl bg-slate-950 p-3.5 text-xs font-mono text-emerald-400">
                {PY_INSTALL}
              </pre>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Kullanım Örneği
              </span>
              <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs font-mono text-slate-200 leading-relaxed">
                {PY_USAGE}
              </pre>
            </div>
          </div>
        </section>

        {/* Go */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xl">
              <SiGo />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Go (Golang)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Go 1.18+ (yalnızca standart kütüphane net/http)</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Kurulum
              </span>
              <pre className="overflow-x-auto rounded-xl bg-slate-950 p-3.5 text-xs font-mono text-emerald-400">
                {GO_INSTALL}
              </pre>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Kullanım Örneği
              </span>
              <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs font-mono text-slate-200 leading-relaxed">
                {GO_USAGE}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

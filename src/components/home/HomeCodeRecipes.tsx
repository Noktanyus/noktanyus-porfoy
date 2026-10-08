'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaCopy, FaCheck, FaCode } from 'react-icons/fa';
import toast from 'react-hot-toast';

type Lang = 'curl' | 'node' | 'python';

const RECIPES: Record<
  Lang,
  { label: string; code: string }
> = {
  curl: {
    label: 'cURL',
    code: `curl -sS https://noktanyus.com/api/v1/validate/iban \\
  -H "Authorization: Bearer nok_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"iban":"TR330006100519786457841326"}'`,
  },
  node: {
    label: 'Node',
    code: `const res = await fetch('https://noktanyus.com/api/v1/validate/iban', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer nok_live_YOUR_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ iban: 'TR330006100519786457841326' }),
});
const data = await res.json();
console.log(data);`,
  },
  python: {
    label: 'Python',
    code: `import requests

r = requests.post(
    "https://noktanyus.com/api/v1/validate/iban",
    headers={"Authorization": "Bearer nok_live_YOUR_KEY"},
    json={"iban": "TR330006100519786457841326"},
    timeout=15,
)
print(r.json())`,
  },
};

/**
 * Stripe-benzeri “copy a working request” — ana sayfada dil sekmeleri.
 */
export default function HomeCodeRecipes() {
  const [lang, setLang] = useState<Lang>('curl');
  const [copied, setCopied] = useState(false);
  const recipe = RECIPES[lang];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(recipe.code);
      setCopied(true);
      toast.success('Kod kopyalandı');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Kopyalanamadı');
    }
  };

  return (
    <section className="py-6 sm:py-8" aria-labelledby="code-recipes-title">
      <div className="rounded-3xl border border-border/80 bg-card/40 dark:bg-slate-900/40 overflow-hidden">
        <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary">
              <FaCode className="h-3 w-3" aria-hidden="true" />
              Çalışan örnek
            </div>
            <h2
              id="code-recipes-title"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground"
            >
              İlk isteği kopyala
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              cURL, Node veya Python — anahtarı yapıştır, çalıştır. Anahtarın yoksa önce
              kayıt ol veya anahtarsız playground’u dene.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/baslangic"
              className="inline-flex min-h-[44px] items-center rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary/90"
            >
              Başlangıç rehberi
            </Link>
            <Link
              href="/#canli-playground"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:border-brand-primary/40"
            >
              Anahtarsız dene
            </Link>
          </div>
        </div>

        <div className="px-5 sm:px-8 pb-2 flex flex-wrap gap-2" role="tablist" aria-label="Dil">
          {(Object.keys(RECIPES) as Lang[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={lang === key}
              onClick={() => setLang(key)}
              className={`min-h-[40px] rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                lang === key
                  ? 'bg-foreground text-background'
                  : 'bg-muted/60 text-foreground hover:bg-muted'
              }`}
            >
              {RECIPES[key].label}
            </button>
          ))}
        </div>

        <div className="relative mx-5 sm:mx-8 mb-6 sm:mb-8 mt-2">
          <pre className="overflow-x-auto rounded-2xl bg-slate-950 text-slate-100 p-4 sm:p-5 text-[12px] sm:text-sm leading-relaxed font-mono border border-slate-800">
            <code>{recipe.code}</code>
          </pre>
          <button
            type="button"
            onClick={() => void copy()}
            className="absolute top-3 right-3 inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-600 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:border-sky-400/50"
          >
            {copied ? (
              <FaCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            ) : (
              <FaCopy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {copied ? 'Kopyalandı' : 'Kopyala'}
          </button>
        </div>
      </div>
    </section>
  );
}

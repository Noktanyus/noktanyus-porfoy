'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FaCheckCircle, FaTimesCircle, FaArrowRight, FaBolt, FaCopy, FaCheck } from 'react-icons/fa';
import { resolveIbanBank } from '@/modules/tr-api/validators';
import toast from 'react-hot-toast';

const SAMPLES = [
  { label: 'Garanti', iban: 'TR600006201234567890123456' },
  { label: 'İş Bankası', iban: 'TR450006401234567890123456' },
  { label: 'Papara', iban: 'TR790082901234567890123456' },
] as const;

/**
 * Developer portal “Try it” — anahtar gerekmeden tarayıcıda anlık doğrulama.
 * Üretim API’si ile aynı `resolveIbanBank` algoritması.
 */
export default function HomeLivePlayground() {
  const [iban, setIban] = useState<string>(SAMPLES[0].iban);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const clean = iban.trim().replace(/\s+/g, '').toUpperCase();
    if (!clean) return null;
    const bank = resolveIbanBank(clean);
    return {
      ...bank,
      formatted: bank.normalized.replace(/(.{4})/g, '$1 ').trim(),
    };
  }, [iban]);

  return (
    <section
      id="canli-playground"
      className="py-6 sm:py-8"
      aria-labelledby="live-playground-title"
    >
      <div className="rounded-3xl border border-border/80 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white overflow-hidden shadow-2xl shadow-brand-primary/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          <div className="p-6 sm:p-8 lg:p-10 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-300">
              <FaBolt className="h-3 w-3" aria-hidden="true" />
              Try it — anahtar gerekmez
            </div>
            <h2
              id="live-playground-title"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight"
            >
              IBAN’ı burada dene
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-md">
              Aynı algoritma üretim API’sinde çalışır. İlk başarılı isteğe 60 saniyede
              ulaşmak için playground → kayıt → API key akışını kullan.
            </p>

            <label htmlFor="home-iban" className="block text-sm font-semibold text-slate-200">
              TR IBAN
            </label>
            <input
              id="home-iban"
              type="text"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              spellCheck={false}
              autoComplete="off"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 font-mono text-sm sm:text-base tracking-wide text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
              placeholder="TR00 0000 0000 0000 0000 0000 00"
            />

            <div className="flex flex-wrap gap-2">
              {SAMPLES.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setIban(s.iban)}
                  className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-sky-400/40 hover:text-sky-200 transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/araclar/iban-dogrulama"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition-colors"
              >
                Tam aracı aç
                <FaArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
              <Link
                href="/kayit"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:border-sky-400/50 transition-colors"
              >
                API key al
              </Link>
            </div>
          </div>

          <div className="border-t lg:border-t-0 lg:border-l border-slate-800 p-6 sm:p-8 lg:p-10 bg-black/20">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 mb-4">
              Anlık sonuç
            </p>
            {!result ? (
              <p className="text-slate-400 text-sm">IBAN girin…</p>
            ) : result.valid ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <FaCheckCircle aria-hidden="true" />
                  Geçerli TR IBAN
                </div>
                <dl className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <dt className="text-slate-400">Banka</dt>
                    <dd className="font-semibold text-white">{result.bankName}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Banka kodu</dt>
                    <dd className="font-mono text-sky-200">{result.bankCode}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Biçim</dt>
                    <dd className="font-mono text-slate-200 break-all">{result.formatted}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <FaTimesCircle aria-hidden="true" />
                  Geçersiz
                </div>
                <p className="text-sm text-rose-100/90">{result.reason ?? 'Kontrol başarısız'}</p>
              </div>
            )}

            <div className="mt-5 relative">
              <button
                type="button"
                onClick={async () => {
                  const curl = `curl -X POST https://noktanyus.com/api/v1/validate/iban \\\n  -H "x-api-key: YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"iban":"${result?.normalized || 'TR330006100519786457841326'}"}'`;
                  try {
                    await navigator.clipboard.writeText(curl);
                    setCopied(true);
                    toast.success('cURL kopyalandı');
                    setTimeout(() => setCopied(false), 2000);
                  } catch {
                    toast.error('Kopyalanamadı');
                  }
                }}
                className="absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/90 px-2 py-1 text-[11px] font-semibold text-slate-200 hover:border-sky-400/40"
              >
                {copied ? <FaCheck className="h-3 w-3 text-emerald-400" /> : <FaCopy className="h-3 w-3" />}
                {copied ? 'Kopyalandı' : 'Kopyala'}
              </button>
              <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 p-3 pr-24 text-[11px] leading-relaxed text-slate-400">
{`curl -X POST https://noktanyus.com/api/v1/validate/iban \\
  -H "x-api-key: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"iban":"${result?.normalized || 'TR…'}"}'`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaArrowRight,
  FaBolt,
  FaCopy,
  FaCheck,
} from 'react-icons/fa';
import { resolveIbanBank, validateTckn, validateVkn } from '@/modules/tr-api/validators';
import toast from 'react-hot-toast';

type Tool = 'iban' | 'tckn' | 'vkn';

const IBAN_SAMPLES = [
  { label: 'Garanti', value: 'TR600006201234567890123456' },
  { label: 'İş Bankası', value: 'TR450006401234567890123456' },
  { label: 'Papara', value: 'TR790082901234567890123456' },
] as const;

const TCKN_SAMPLES = [
  { label: 'Geçerli', value: '10000000146' },
  { label: 'Hatalı', value: '10000000147' },
] as const;

const VKN_SAMPLES = [
  { label: 'Geçerli', value: '1000000000' },
  { label: 'Hatalı', value: '1000000001' },
] as const;

const TABS: { id: Tool; label: string }[] = [
  { id: 'iban', label: 'IBAN + banka' },
  { id: 'tckn', label: 'TCKN' },
  { id: 'vkn', label: 'VKN' },
];

/**
 * Developer portal “Try it” — anahtar gerekmeden tarayıcıda anlık doğrulama.
 */
export default function HomeLivePlayground() {
  const [tool, setTool] = useState<Tool>('iban');
  const [iban, setIban] = useState(IBAN_SAMPLES[0].value);
  const [tckn, setTckn] = useState(TCKN_SAMPLES[0].value);
  const [vkn, setVkn] = useState(VKN_SAMPLES[0].value);
  const [copied, setCopied] = useState(false);

  const ibanResult = useMemo(() => {
    const clean = iban.trim().replace(/\s+/g, '').toUpperCase();
    if (!clean) return null;
    const bank = resolveIbanBank(clean);
    return {
      ...bank,
      formatted: bank.normalized.replace(/(.{4})/g, '$1 ').trim(),
    };
  }, [iban]);

  const tcknResult = useMemo(() => {
    const clean = tckn.trim().replace(/\s+/g, '');
    if (!clean) return null;
    return validateTckn(clean);
  }, [tckn]);

  const vknResult = useMemo(() => {
    const clean = vkn.trim().replace(/\s+/g, '');
    if (!clean) return null;
    return validateVkn(clean);
  }, [vkn]);

  const curl =
    tool === 'iban'
      ? `curl -X POST https://noktanyus.com/api/v1/validate/iban \\\n  -H "Authorization: Bearer YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"iban":"${ibanResult?.normalized || 'TR330006100519786457841326'}'}'`
      : tool === 'tckn'
        ? `curl -X POST https://noktanyus.com/api/v1/validate/identity \\\n  -H "Authorization: Bearer YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"type":"tckn","value":"${tcknResult?.normalized || '10000000146'}'}'`
        : `curl -X POST https://noktanyus.com/api/v1/validate/identity \\\n  -H "Authorization: Bearer YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"type":"vkn","value":"${vknResult?.normalized || '1000000000'}'}'`;

  const toolHref =
    tool === 'iban' ? '/araclar/iban-dogrulama' : '/araclar/tckn-vkn-dogrulama';

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
              Burada dene
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-md">
              Üretim API’siyle aynı algoritmalar — IBAN banka, TCKN ve VKN checksum. Anahtar
              olmadan anında.
            </p>

            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Playground aracı">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={tool === tab.id}
                  onClick={() => setTool(tab.id)}
                  className={`min-h-[40px] rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    tool === tab.id
                      ? 'bg-sky-500 text-slate-950'
                      : 'border border-slate-700 bg-slate-800/80 text-slate-200 hover:border-sky-400/40'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {tool === 'iban' && (
              <>
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
                  {IBAN_SAMPLES.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setIban(s.value)}
                      className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-sky-400/40 hover:text-sky-200 transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {tool === 'tckn' && (
              <>
                <label htmlFor="home-tckn" className="block text-sm font-semibold text-slate-200">
                  TCKN
                </label>
                <input
                  id="home-tckn"
                  type="text"
                  inputMode="numeric"
                  value={tckn}
                  onChange={(e) => setTckn(e.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 font-mono text-sm sm:text-base tracking-wide text-white focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                  placeholder="11 haneli TCKN"
                />
                <div className="flex flex-wrap gap-2">
                  {TCKN_SAMPLES.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setTckn(s.value)}
                      className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-sky-400/40 hover:text-sky-200 transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {tool === 'vkn' && (
              <>
                <label htmlFor="home-vkn" className="block text-sm font-semibold text-slate-200">
                  VKN
                </label>
                <input
                  id="home-vkn"
                  type="text"
                  inputMode="numeric"
                  value={vkn}
                  onChange={(e) => setVkn(e.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 font-mono text-sm sm:text-base tracking-wide text-white focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                  placeholder="10 haneli VKN"
                />
                <div className="flex flex-wrap gap-2">
                  {VKN_SAMPLES.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setVkn(s.value)}
                      className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:border-sky-400/40 hover:text-sky-200 transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={toolHref}
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

            {tool === 'iban' &&
              (!ibanResult ? (
                <p className="text-slate-400 text-sm">IBAN girin…</p>
              ) : ibanResult.valid ? (
                <ResultOk title="Geçerli TR IBAN">
                  <Row label="Banka" value={ibanResult.bankName} />
                  <Row label="Banka kodu" value={ibanResult.bankCode} mono />
                  <Row label="Biçim" value={ibanResult.formatted} mono />
                </ResultOk>
              ) : (
                <ResultBad reason={ibanResult.reason} />
              ))}

            {tool === 'tckn' &&
              (!tcknResult ? (
                <p className="text-slate-400 text-sm">TCKN girin…</p>
              ) : tcknResult.valid ? (
                <ResultOk title="Geçerli TCKN (algoritmik)">
                  <Row label="Normalize" value={tcknResult.normalized} mono />
                </ResultOk>
              ) : (
                <ResultBad reason={tcknResult.reason} />
              ))}

            {tool === 'vkn' &&
              (!vknResult ? (
                <p className="text-slate-400 text-sm">VKN girin…</p>
              ) : vknResult.valid ? (
                <ResultOk title="Geçerli VKN (algoritmik)">
                  <Row label="Normalize" value={vknResult.normalized} mono />
                </ResultOk>
              ) : (
                <ResultBad reason={vknResult.reason} />
              ))}

            <div className="mt-5 relative">
              <button
                type="button"
                onClick={async () => {
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
                {copied ? (
                  <FaCheck className="h-3 w-3 text-emerald-400" />
                ) : (
                  <FaCopy className="h-3 w-3" />
                )}
                {copied ? 'Kopyalandı' : 'Kopyala'}
              </button>
              <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 p-3 pr-24 text-[11px] leading-relaxed text-slate-400 whitespace-pre-wrap">
                {curl}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultOk({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-3">
      <div className="flex items-center gap-2 text-emerald-300 font-bold">
        <FaCheckCircle aria-hidden="true" />
        {title}
      </div>
      <dl className="grid grid-cols-1 gap-3 text-sm">{children}</dl>
    </div>
  );
}

function ResultBad({ reason }: { reason?: string }) {
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 space-y-2">
      <div className="flex items-center gap-2 text-rose-300 font-bold">
        <FaTimesCircle aria-hidden="true" />
        Geçersiz
      </div>
      <p className="text-sm text-rose-100/90">{reason ?? 'Kontrol başarısız'}</p>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd
        className={`${mono ? 'font-mono text-sky-200' : 'font-semibold text-white'} break-all`}
      >
        {value}
      </dd>
    </div>
  );
}

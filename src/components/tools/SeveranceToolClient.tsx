'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaBalanceScale, FaCopy, FaCheck, FaArrowLeft, FaCode } from 'react-icons/fa';
import {
  calculateSeverance,
  DEFAULT_SEVERANCE_CEILING_CENTS,
} from '@/modules/tr-api/extras';
import { TrackRecentTool } from '@/components/tools/TrackRecentTool';

export default function SeveranceToolClient() {
  const [grossStr, setGrossStr] = useState('50000');
  const [startDate, setStartDate] = useState('2020-01-15');
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [ceilingStr, setCeilingStr] = useState(
    String(Math.round(DEFAULT_SEVERANCE_CEILING_CENTS / 100))
  );
  const [copied, setCopied] = useState(false);

  const grossCents = Math.round((parseFloat(grossStr.replace(',', '.')) || 0) * 100);
  const ceilingCents = Math.round((parseFloat(ceilingStr.replace(',', '.')) || 0) * 100);

  let result: ReturnType<typeof calculateSeverance> | null = null;
  let error: string | null = null;
  try {
    if (grossCents > 0 && startDate && endDate) {
      result = calculateSeverance({
        monthlyGrossCents: grossCents,
        startDate,
        endDate,
        severanceCeilingCents: ceilingCents > 0 ? ceilingCents : undefined,
      });
    }
  } catch (e) {
    result = null;
    error = e instanceof Error ? e.message : 'Hesaplanamadı';
  }

  const fmt = (cents: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(cents / 100);

  const handleCopy = () => {
    const body = JSON.stringify({
      monthlyGrossCents: grossCents,
      startDate,
      endDate,
      ...(ceilingCents > 0 ? { severanceCeilingCents: ceilingCents } : {}),
    });
    const curl = `curl -X POST "https://noktanyus.com/api/v1/labor/severance" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${body}'`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="section-glass-hero bg-blob-decoration py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <TrackRecentTool slug="kidem-tazminati" title="Kıdem Tazminatı" />
      <div className="relative z-10 space-y-8">
        <Link
          href="/araclar"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-brand-primary"
        >
          <FaArrowLeft className="w-3.5 h-3.5" />
          Tüm Araçlara Dön
        </Link>

        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
            <FaBalanceScale className="w-3 h-3" />
            4857 kıdem + ihbar tahmini
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold">
            Kıdem & İhbar Tazminatı
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Hizmet süresi, kıdem tavanı ve damga vergisi (%0,759) ile yaklaşık kıdem neti + ihbar
            brütü. Haklı fesih / istisna durumları değerlendirilmez; hukuki tavsiye değildir.
          </p>
        </header>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="font-medium mb-1.5 block">Aylık brüt ücret (TRY)</span>
            <input
              type="text"
              inputMode="decimal"
              value={grossStr}
              onChange={(e) => setGrossStr(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 min-h-[48px]"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium mb-1.5 block">Kıdem tavanı (TRY, opsiyonel)</span>
            <input
              type="text"
              inputMode="decimal"
              value={ceilingStr}
              onChange={(e) => setCeilingStr(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 min-h-[48px]"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium mb-1.5 block">İşe giriş</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 min-h-[48px]"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium mb-1.5 block">Fesih / hesap tarihi</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 min-h-[48px]"
            />
          </label>
        </div>

        {error && (
          <p className="text-sm text-rose-600 dark:text-rose-400" role="alert">
            {error}
          </p>
        )}

        {result && (
          <div className="rounded-2xl border border-border bg-card/60 p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Hizmet günü', value: String(result.serviceDays) },
                { label: 'Hizmet yılı', value: result.serviceYears.toFixed(3) },
                { label: 'İhbar haftası', value: String(result.noticeWeeks) },
                { label: 'Tavanlı aylık', value: fmt(result.cappedMonthlyCents) },
                { label: 'Kıdem brüt', value: fmt(result.severanceGrossCents) },
                { label: 'Damga vergisi', value: fmt(result.severanceStampTaxCents) },
                { label: 'Kıdem net', value: fmt(result.severanceNetCents) },
                { label: 'İhbar brüt', value: fmt(result.noticeGrossCents) },
              ].map((row) => (
                <div key={row.label} className="rounded-xl border border-border/70 px-3 py-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{row.label}</p>
                  <p className="text-sm font-bold mt-1 tabular-nums">{row.value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{result.note}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold min-h-[48px] hover:border-brand-primary/40"
          >
            {copied ? <FaCheck className="w-3.5 h-3.5 text-emerald-600" /> : <FaCopy className="w-3.5 h-3.5" />}
            {copied ? 'Kopyalandı' : 'cURL kopyala'}
          </button>
          <Link
            href="/docs/labor"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold min-h-[48px] hover:border-brand-primary/40"
          >
            <FaCode className="w-3.5 h-3.5" />
            Labor API docs
          </Link>
        </div>
      </div>
    </div>
  );
}

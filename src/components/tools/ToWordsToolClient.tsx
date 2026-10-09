'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaLanguage, FaCopy, FaCheck, FaArrowLeft, FaCode } from 'react-icons/fa';
import { amountToTurkishWords } from '@/modules/tr-api/extras';
import { TrackRecentTool } from '@/components/tools/TrackRecentTool';

type Currency = 'TRY' | 'USD' | 'EUR' | 'GBP';

export default function ToWordsToolClient() {
  const [amountStr, setAmountStr] = useState('1250.50');
  const [currency, setCurrency] = useState<Currency>('TRY');
  const [copied, setCopied] = useState(false);

  const amountNum = parseFloat(amountStr.replace(',', '.')) || 0;
  const amountCents = Math.round(amountNum * 100);
  const result =
    amountCents >= 0
      ? amountToTurkishWords({ amountCents, currency, uppercaseCompact: true })
      : null;

  const handleCopyCurl = () => {
    const body = `{"amountCents":${amountCents},"currency":"${currency}","uppercaseCompact":true}`;
    const curl = `curl -X POST "https://noktanyus.com/api/v1/finance/to-words" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${body}'`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyWords = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.words);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="section-glass-hero bg-blob-decoration py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <TrackRecentTool slug="sayiyi-yaziya" title="Sayıyı Yazıya" />
      <div className="relative z-10 space-y-8">
        <Link
          href="/araclar"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-brand-primary"
        >
          <FaArrowLeft className="w-3.5 h-3.5" />
          Tüm Araçlara Dön
        </Link>

        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
            <FaLanguage className="w-3 h-3" />
            Fatura / çek yazı ile tutar
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold">
            Sayıyı Yazıya Çevir
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Tutarı Türkçe yazıya çevirir (lira/kuruş veya döviz). API:{' '}
            <code className="text-xs">/api/v1/finance/to-words</code>
          </p>
        </header>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="font-medium mb-1.5 block">Tutar</span>
            <input
              type="text"
              inputMode="decimal"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 min-h-[48px]"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium mb-1.5 block">Para birimi</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 min-h-[48px]"
            >
              <option value="TRY">TRY</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </label>
        </div>

        {result && (
          <div className="rounded-2xl border border-border bg-card/60 p-5 sm:p-6 space-y-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              Yazı ile
            </p>
            <p className="text-lg sm:text-xl font-bold leading-snug">{result.words}</p>
            {result.compact && (
              <p className="text-xs font-mono text-muted-foreground break-all">{result.compact}</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCopyWords}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold min-h-[48px] hover:border-brand-primary/40"
          >
            {copied ? <FaCheck className="w-3.5 h-3.5 text-emerald-600" /> : <FaCopy className="w-3.5 h-3.5" />}
            Yazıyı kopyala
          </button>
          <button
            type="button"
            onClick={handleCopyCurl}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold min-h-[48px] hover:border-brand-primary/40"
          >
            <FaCode className="w-3.5 h-3.5" />
            cURL
          </button>
        </div>
      </div>
    </div>
  );
}

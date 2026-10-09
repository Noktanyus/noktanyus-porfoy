'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaCalculator, FaCopy, FaCheck, FaArrowLeft, FaCode } from 'react-icons/fa';
import { calculateGrossToNet, calculateNetToGross } from '@/modules/tr-api/extras';
import { TrackRecentTool } from '@/components/tools/TrackRecentTool';

export default function PayrollToolClient() {
  const [mode, setMode] = useState<'gross-to-net' | 'net-to-gross'>('gross-to-net');
  const [amountStr, setAmountStr] = useState('50000');
  const [monthIndex, setMonthIndex] = useState(1);
  const [copied, setCopied] = useState(false);

  const amountNum = parseFloat(amountStr.replace(',', '.')) || 0;
  const amountCents = Math.round(amountNum * 100);

  const grossToNet =
    mode === 'gross-to-net' && amountCents > 0
      ? calculateGrossToNet({ monthlyGrossCents: amountCents, monthIndex })
      : null;
  const netToGross =
    mode === 'net-to-gross' && amountCents > 0
      ? calculateNetToGross({ monthlyNetCents: amountCents, monthIndex })
      : null;

  const fmt = (cents: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(cents / 100);

  const handleCopyCurl = () => {
    const path = mode === 'gross-to-net' ? 'gross-to-net' : 'net-to-gross';
    const body =
      mode === 'gross-to-net'
        ? `{"monthlyGrossCents":${amountCents},"monthIndex":${monthIndex}}`
        : `{"monthlyNetCents":${amountCents},"monthIndex":${monthIndex}}`;
    const curl = `curl -X POST "https://noktanyus.com/api/v1/labor/${path}" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${body}'`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="section-glass-hero bg-blob-decoration py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <TrackRecentTool slug="brut-net-maas" title="Brüt / Net Maaş" />
      <div className="relative z-10 space-y-8">
        <Link
          href="/araclar"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-brand-primary"
        >
          <FaArrowLeft className="w-3.5 h-3.5" />
          Tüm Araçlara Dön
        </Link>

        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-600 border border-violet-500/20">
            <FaCalculator className="w-3 h-3" />
            Yaklaşık bordro hesabı
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold">
            Brüt ↔ Net Maaş Hesaplama
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            SGK işçi %14, işsizlik %1, damga vergisi ve kümülatif gelir vergisi dilimleriyle tahmini
            net/brüt. Hukuki tavsiye değildir.
          </p>
        </header>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('gross-to-net')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
              mode === 'gross-to-net'
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'border-border'
            }`}
          >
            Brüt → Net
          </button>
          <button
            type="button"
            onClick={() => setMode('net-to-gross')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
              mode === 'net-to-gross'
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'border-border'
            }`}
          >
            Net → Brüt
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="font-medium mb-1.5 block">
              {mode === 'gross-to-net' ? 'Aylık brüt (TRY)' : 'Hedef net (TRY)'}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="admin-input w-full"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium mb-1.5 block">Ay (1–12)</span>
            <input
              type="number"
              min={1}
              max={12}
              value={monthIndex}
              onChange={(e) => setMonthIndex(Math.min(12, Math.max(1, Number(e.target.value) || 1)))}
              className="admin-input w-full"
            />
          </label>
        </div>

        {grossToNet && (
          <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-2 text-sm">
            <p className="text-2xl font-bold">{fmt(grossToNet.netCents)} net</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>SGK işçi: {fmt(grossToNet.sgkEmployeeCents)}</li>
              <li>İşsizlik: {fmt(grossToNet.unemploymentEmployeeCents)}</li>
              <li>Damga: {fmt(grossToNet.stampTaxCents)}</li>
              <li>Gelir vergisi: {fmt(grossToNet.incomeTaxCents)}</li>
              <li>Toplam kesinti: {fmt(grossToNet.totalDeductionCents)}</li>
            </ul>
            <p className="text-xs pt-2">{grossToNet.note}</p>
          </div>
        )}

        {netToGross && (
          <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-2 text-sm">
            <p className="text-2xl font-bold">{fmt(netToGross.monthlyGrossCents)} brüt</p>
            <p className="text-muted-foreground">
              Hesaplanan net: {fmt(netToGross.computedNetCents)} ({netToGross.iterations} iterasyon)
            </p>
            <p className="text-xs pt-2">{netToGross.note}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCopyCurl}
            className="admin-btn admin-btn-secondary inline-flex items-center gap-2"
          >
            {copied ? <FaCheck /> : <FaCopy />}
            {copied ? 'Kopyalandı' : 'cURL kopyala'}
          </button>
          <Link href="/docs" className="admin-btn admin-btn-primary inline-flex items-center gap-2">
            <FaCode />
            API docs
          </Link>
        </div>
      </div>
    </div>
  );
}

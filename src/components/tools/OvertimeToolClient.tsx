'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaClock, FaCopy, FaCheck, FaArrowLeft, FaCode } from 'react-icons/fa';
import { calculateOvertime, calculateAnnualLeave } from '@/modules/tr-api/extras';
import { TrackRecentTool } from '@/components/tools/TrackRecentTool';

export default function OvertimeToolClient() {
  const [tab, setTab] = useState<'overtime' | 'leave'>('overtime');
  const [grossStr, setGrossStr] = useState('45000');
  const [hoursStr, setHoursStr] = useState('10');
  const [kind, setKind] = useState<'overtime' | 'excess' | 'holiday'>('overtime');
  const [startDate, setStartDate] = useState('2020-01-01');
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));
  const [copied, setCopied] = useState(false);

  const grossCents = Math.round((parseFloat(grossStr.replace(',', '.')) || 0) * 100);
  const hours = parseFloat(hoursStr.replace(',', '.')) || 0;

  const ot =
    tab === 'overtime' && grossCents > 0 && hours > 0
      ? calculateOvertime({ monthlyGrossCents: grossCents, hours, kind })
      : null;
  const leave =
    tab === 'leave'
      ? (() => {
          try {
            return calculateAnnualLeave({ startDate, asOfDate });
          } catch {
            return null;
          }
        })()
      : null;

  const fmt = (cents: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(cents / 100);

  const handleCopy = () => {
    const curl =
      tab === 'overtime'
        ? `curl -X POST "https://noktanyus.com/api/v1/labor/overtime" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"monthlyGrossCents":${grossCents},"hours":${hours},"kind":"${kind}"}'`
        : `curl -X POST "https://noktanyus.com/api/v1/labor/annual-leave" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"startDate":"${startDate}","asOfDate":"${asOfDate}"}'`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="section-glass-hero bg-blob-decoration py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <TrackRecentTool slug="fazla-mesai-izin" title="Fazla Mesai & İzin" />
      <div className="relative z-10 space-y-8">
        <Link
          href="/araclar"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-brand-primary"
        >
          <FaArrowLeft className="w-3.5 h-3.5" />
          Tüm Araçlara Dön
        </Link>

        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-600 border border-orange-500/20">
            <FaClock className="w-3 h-3" />
            4857 İş Kanunu yardımcı hesap
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold">
            Fazla Mesai & Yıllık İzin
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Saat ücreti = brüt/225; fazla çalışma 1.5x, fazla süre 1.25x. Yıllık izin 14/20/26 gün.
          </p>
        </header>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab('overtime')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
              tab === 'overtime' ? 'bg-brand-primary text-white border-brand-primary' : 'border-border'
            }`}
          >
            Fazla mesai
          </button>
          <button
            type="button"
            onClick={() => setTab('leave')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
              tab === 'leave' ? 'bg-brand-primary text-white border-brand-primary' : 'border-border'
            }`}
          >
            Yıllık izin
          </button>
        </div>

        {tab === 'overtime' && (
          <div className="grid sm:grid-cols-3 gap-4">
            <label className="block text-sm">
              <span className="font-medium mb-1.5 block">Aylık brüt (TRY)</span>
              <input
                className="admin-input w-full"
                value={grossStr}
                onChange={(e) => setGrossStr(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium mb-1.5 block">Saat</span>
              <input
                className="admin-input w-full"
                value={hoursStr}
                onChange={(e) => setHoursStr(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium mb-1.5 block">Tür</span>
              <select
                className="admin-input w-full"
                value={kind}
                onChange={(e) => setKind(e.target.value as typeof kind)}
              >
                <option value="overtime">Fazla çalışma (1.5x)</option>
                <option value="excess">Fazla süre (1.25x)</option>
                <option value="holiday">Tatil çalışması (1.5x)</option>
              </select>
            </label>
          </div>
        )}

        {tab === 'leave' && (
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="font-medium mb-1.5 block">İşe giriş</span>
              <input
                type="date"
                className="admin-input w-full"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium mb-1.5 block">Hesap tarihi</span>
              <input
                type="date"
                className="admin-input w-full"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
              />
            </label>
          </div>
        )}

        {ot && (
          <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-2">
            <p className="text-2xl font-bold">{fmt(ot.grossCents)}</p>
            <p className="text-sm text-muted-foreground">
              Saat ücreti {fmt(ot.hourlyCents)} · çarpan {ot.multiplier} · {ot.hours} saat
            </p>
            <p className="text-xs">{ot.note}</p>
          </div>
        )}

        {leave && (
          <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-2">
            <p className="text-2xl font-bold">{leave.entitledDays} gün</p>
            <p className="text-sm text-muted-foreground">
              Hizmet: {leave.serviceYears} yıl ({leave.serviceDays} gün)
            </p>
            <p className="text-xs">{leave.note}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCopy}
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

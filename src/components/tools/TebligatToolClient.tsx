'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaGavel, FaCheck, FaArrowLeft, FaCode } from 'react-icons/fa';
import { calculateTebligatClock } from '@/modules/tr-api/extras';
import { TrackRecentTool } from '@/components/tools/TrackRecentTool';

export default function TebligatToolClient() {
  const [notifiedAt, setNotifiedAt] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [daysStr, setDaysStr] = useState('15');
  const [mode, setMode] = useState<'calendar' | 'business'>('calendar');
  const [copied, setCopied] = useState(false);

  const days = Math.max(1, Math.min(365, parseInt(daysStr, 10) || 15));

  let result: ReturnType<typeof calculateTebligatClock> | null = null;
  let displayError: string | null = null;
  try {
    result = calculateTebligatClock({ notifiedAt, days, mode });
  } catch (e) {
    result = null;
    displayError = e instanceof Error ? e.message : 'Hesaplanamadı';
  }

  const handleCopy = () => {
    const body = JSON.stringify({ notifiedAt, days, mode });
    const curl = `curl -X POST "https://noktanyus.com/api/v1/calendar/tebligat" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${body}'`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="section-glass-hero bg-blob-decoration py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <TrackRecentTool slug="tebligat-suresi" title="Tebligat Süresi" />
      <div className="relative z-10 space-y-8">
        <Link
          href="/araclar"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-brand-primary"
        >
          <FaArrowLeft className="w-3.5 h-3.5" />
          Tüm Araçlara Dön
        </Link>

        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
            <FaGavel className="w-3 h-3" />
            Basitleştirilmiş tebligat saati
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold">
            Tebligat Süre Hesabı
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Tebliğ tarihinden itibaren takvim veya iş günü ile son günü hesaplar. Hukuki tavsiye
            değildir. API: <code className="text-xs">/api/v1/calendar/tebligat</code>
          </p>
        </header>

        <div className="grid sm:grid-cols-3 gap-4">
          <label className="block text-sm">
            <span className="font-medium mb-1.5 block">Tebliğ tarihi</span>
            <input
              type="date"
              value={notifiedAt}
              onChange={(e) => setNotifiedAt(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 min-h-[48px]"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium mb-1.5 block">Süre (gün)</span>
            <input
              type="number"
              min={1}
              max={365}
              value={daysStr}
              onChange={(e) => setDaysStr(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 min-h-[48px]"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium mb-1.5 block">Mod</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'calendar' | 'business')}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 min-h-[48px]"
            >
              <option value="calendar">Takvim günü</option>
              <option value="business">İş günü</option>
            </select>
          </label>
        </div>

        {displayError && (
          <p className="text-sm text-rose-600" role="alert">
            {displayError}
          </p>
        )}

        {result && (
          <div className="rounded-2xl border border-border bg-card/60 p-5 sm:p-6 space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Tebliğ</p>
                <p className="font-bold tabular-nums">{result.notifiedAt}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Son gün</p>
                <p className="font-bold tabular-nums text-brand-primary">{result.deadline}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Süre / mod</p>
                <p className="font-bold">
                  {result.days} gün · {result.mode}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{result.note}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold min-h-[48px]"
        >
          {copied ? <FaCheck className="text-emerald-600" /> : <FaCode />}
          {copied ? 'Kopyalandı' : 'cURL kopyala'}
        </button>
      </div>
    </div>
  );
}

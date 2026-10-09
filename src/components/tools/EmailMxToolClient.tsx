'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaEnvelope, FaCheck, FaTimes, FaArrowLeft, FaCode, FaSpinner } from 'react-icons/fa';
import { TrackRecentTool } from '@/components/tools/TrackRecentTool';

type MxResult = {
  email: string;
  syntaxValid: boolean;
  hasMx: boolean;
  mxHosts?: string[];
  note?: string;
};

export default function EmailMxToolClient() {
  const [email, setEmail] = useState('ornek@gmail.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MxResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/tools/email-mx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json?.error?.message ?? `HTTP ${res.status}`);
        return;
      }
      setResult(json.data as MxResult);
    } catch {
      setError('İstek başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const curl = `curl -X POST "https://noktanyus.com/api/v1/validate/email" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"email":"${email}"}'`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="section-glass-hero bg-blob-decoration py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <TrackRecentTool slug="email-mx" title="E-posta MX" />
      <div className="relative z-10 space-y-8">
        <Link
          href="/araclar"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-brand-primary"
        >
          <FaArrowLeft className="w-3.5 h-3.5" />
          Tüm Araçlara Dön
        </Link>

        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
            <FaEnvelope className="w-3 h-3" />
            Sözdizimi + MX kaydı
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold">
            E-posta MX Doğrulama
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Adres sözdizimini ve alan adının MX kaydını kontrol eder. API anahtarı olmadan bu
            sayfada sınırlı demo; üretimde <code className="text-xs">x-api-key</code> kullanın.
          </p>
        </header>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-xl border border-border bg-background px-4 py-3 min-h-[48px]"
            placeholder="ornek@firma.com"
          />
          <button
            type="button"
            onClick={run}
            disabled={loading || !email.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary text-white px-5 py-3 font-semibold min-h-[48px] disabled:opacity-50"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaEnvelope />}
            Doğrula
          </button>
        </div>

        {error && (
          <p className="text-sm text-rose-600" role="alert">
            {error}
          </p>
        )}

        {result && (
          <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-3">
            <div className="flex flex-wrap gap-4">
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                {result.syntaxValid ? (
                  <FaCheck className="text-emerald-600" />
                ) : (
                  <FaTimes className="text-rose-600" />
                )}
                Sözdizimi
              </span>
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                {result.hasMx ? (
                  <FaCheck className="text-emerald-600" />
                ) : (
                  <FaTimes className="text-rose-600" />
                )}
                MX kaydı
              </span>
            </div>
            {result.mxHosts && result.mxHosts.length > 0 && (
              <ul className="text-xs font-mono text-muted-foreground space-y-1">
                {result.mxHosts.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            )}
            {result.note && <p className="text-xs text-muted-foreground">{result.note}</p>}
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

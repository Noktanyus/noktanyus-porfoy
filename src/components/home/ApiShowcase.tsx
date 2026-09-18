'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaBolt, FaShieldAlt, FaCode, FaCheck, FaCopy, FaArrowRight } from 'react-icons/fa';

export default function ApiShowcase() {
  const [activeTab, setActiveTab] = useState<'curl' | 'node'>('curl');
  const [copied, setCopied] = useState(false);

  const curlCode = `curl -X POST "https://noktanyus.com/api/v1/validate/iban" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"iban":"TR330006100511123456789012"}'`;

  const nodeCode = `import { NoktanyusTrClient } from '@/sdk';

const client = new NoktanyusTrClient({ apiKey: 'nok_live_...' });
const result = await client.validateIban('TR330006100511123456789012');

console.log(result.bankName); // 'Türkiye Garanti Bankası A.Ş.'`;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeTab === 'curl' ? curlCode : nodeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-12 relative overflow-hidden" aria-labelledby="api-showcase-title">
      <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl relative">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left info column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-brand-primary/20 text-brand-primary border border-brand-primary/30">
              <FaBolt className="w-3 h-3" />
              <span>96+ Türkiye Mikroservisi & E-Ticaret API'leri</span>
            </div>

            <h2 id="api-showcase-title" className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Geliştiriciler İçin Güçlü <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                Türkiye Yardımcı API'leri
              </span>
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              TCKN/VKN sağlama kontrolü, TR IBAN çözümleme, KDV/Tevkifat hesabı, iş günü takvimi ve fatura PDF üretimi gibi
              tüm yerel operasyonel kuralları dakikalar içinde sisteminize entegre edin.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="block text-xl font-extrabold text-white">100 Kredi</span>
                <span className="text-xs text-slate-400">Kayıt olan herkese anında hediye</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="block text-xl font-extrabold text-emerald-400">&lt; 1 ms</span>
                <span className="text-xs text-slate-400">Ultra hızlı yanıt süresi</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/docs"
                className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold shadow-lg transition-colors inline-flex items-center gap-2"
              >
                <span>API Dokümantasyonu</span>
                <FaArrowRight className="w-3 h-3" />
              </Link>
              <Link
                href="/magaza/abonelikler"
                className="px-5 py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 text-sm font-bold border border-indigo-500/40 transition-colors inline-flex items-center gap-2"
              >
                <span>Fiyatlar & Planlar</span>
              </Link>
              <Link
                href="/araclar"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold border border-slate-700 transition-colors inline-flex items-center gap-2"
              >
                <span>Canlı Araçlar</span>
              </Link>
            </div>
          </div>

          {/* Right code snippet column */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl bg-slate-950 border border-slate-800 shadow-xl overflow-hidden">
              {/* Snippet Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('curl')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                      activeTab === 'curl'
                        ? 'bg-brand-primary text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    cURL
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('node')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                      activeTab === 'node'
                        ? 'bg-brand-primary text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    TypeScript SDK
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  {copied ? <FaCheck className="w-3 h-3 text-emerald-400" /> : <FaCopy className="w-3 h-3" />}
                  <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
                </button>
              </div>

              {/* Snippet Body */}
              <pre className="p-4 text-xs sm:text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed">
                {activeTab === 'curl' ? curlCode : nodeCode}
              </pre>

              {/* Footer guarantee */}
              <div className="px-4 py-2.5 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <FaShieldAlt className="w-3.5 h-3.5" />
                  <span>KVKK Uyumlu & Checksum Doğrulama</span>
                </span>
                <span className="text-slate-400">POST JSON</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

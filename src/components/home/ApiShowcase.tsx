'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FaBolt,
  FaShieldAlt,
  FaCheck,
  FaCopy,
  FaArrowRight,
  FaCreditCard,
  FaIdCard,
  FaCalculator,
  FaUserTie,
  FaCalendarAlt,
} from 'react-icons/fa';

interface ShowcaseEndpoint {
  id: string;
  name: string;
  category: string;
  icon: typeof FaBolt;
  path: string;
  request: string;
  response: string;
}

const ENDPOINTS: ShowcaseEndpoint[] = [
  {
    id: 'iban',
    name: 'TR IBAN & Banka',
    category: 'Finans',
    icon: FaCreditCard,
    path: '/api/v1/validate/iban',
    request: `curl -X POST "https://noktanyus.com/api/v1/validate/iban" \\
  -H "x-api-key: nok_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"iban":"TR330006100511123456789012"}'`,
    response: `{
  "success": true,
  "data": {
    "valid": true,
    "bankCode": "0062",
    "bankName": "Türkiye Garanti Bankası A.Ş.",
    "branchCode": "00511",
    "accountNumber": "123456789012"
  }
}`,
  },
  {
    id: 'identity',
    name: 'TCKN & VKN',
    category: 'Kimlik',
    icon: FaIdCard,
    path: '/api/v1/validate/identity',
    request: `curl -X POST "https://noktanyus.com/api/v1/validate/identity" \\
  -H "x-api-key: nok_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"type":"tckn","value":"10000000146"}'`,
    response: `{
  "success": true,
  "data": {
    "type": "tckn",
    "valid": true,
    "normalized": "10000000146",
    "algorithm": "MOD-10 Checksum"
  }
}`,
  },
  {
    id: 'tax',
    name: 'KDV & Tevkifat',
    category: 'Muhasebe',
    icon: FaCalculator,
    path: '/api/v1/tax/calculate',
    request: `curl -X POST "https://noktanyus.com/api/v1/tax/calculate" \\
  -H "x-api-key: nok_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"amount":10000,"kdvRate":20,"withholdingRate":"5/10"}'`,
    response: `{
  "success": true,
  "data": {
    "baseAmount": 10000.00,
    "kdvAmount": 2000.00,
    "withholdingAmount": 1000.00,
    "payableKdv": 1000.00,
    "totalWithKdv": 12000.00
  }
}`,
  },
  {
    id: 'labor',
    name: 'Brüt → Net Bordro',
    category: 'İK & Bordro',
    icon: FaUserTie,
    path: '/api/v1/labor/gross-to-net',
    request: `curl -X POST "https://noktanyus.com/api/v1/labor/gross-to-net" \\
  -H "x-api-key: nok_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"monthlyGrossCents":5000000,"monthIndex":1}'`,
    response: `{
  "success": true,
  "data": {
    "grossCents": 5000000,
    "sgkWorkerCents": 700000,
    "unemploymentCents": 50000,
    "incomeTaxCents": 382500,
    "netCents": 3876000
  }
}`,
  },
  {
    id: 'calendar',
    name: 'İş Günü & Tatil',
    category: 'Takvim',
    icon: FaCalendarAlt,
    path: '/api/v1/calendar/workdays',
    request: `curl -X POST "https://noktanyus.com/api/v1/calendar/workdays" \\
  -H "x-api-key: nok_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"startDate":"2026-10-01","endDate":"2026-10-31"}'`,
    response: `{
  "success": true,
  "data": {
    "totalDays": 31,
    "workdays": 21,
    "weekendDays": 9,
    "publicHolidays": 1,
    "holidays": [{"date":"2026-10-29","name":"Cumhuriyet Bayramı"}]
  }
}`,
  },
];

export default function ApiShowcase() {
  const [selectedId, setSelectedId] = useState<string>('iban');
  const [viewMode, setViewMode] = useState<'request' | 'response'>('request');
  const [copied, setCopied] = useState(false);

  const current = ENDPOINTS.find((e) => e.id === selectedId) || ENDPOINTS[0];
  const activeCode = viewMode === 'request' ? current.request : current.response;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-10 sm:py-14 relative overflow-x-clip" aria-labelledby="api-showcase-title">
      <div
        className="absolute inset-x-8 inset-y-6 bg-gradient-to-r from-brand-primary/15 via-indigo-500/10 to-sky-500/15 rounded-3xl blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="p-6 sm:p-10 lg:p-12 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Sol Kolon */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-brand-primary/20 text-brand-primary border border-brand-primary/30">
              <FaBolt className="w-3 h-3" />
              <span>Genişletilmiş Mikroservis Kataloğu</span>
            </div>

            <h2 id="api-showcase-title" className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Türkiye İş Dünyası ve Finans İçin{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-400 to-cyan-300">
                Yardımcı API Paketi
              </span>
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Resmi algoritmalar, ISO standartları ve yerel mevzuat kuralları. Tek bir API key ile
              dakikalar içinde entegre olun, sub-milisaniye hızla çağırın.
            </p>

            {/* Servis Seçim Butonları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1" role="tablist">
              {ENDPOINTS.map((endpoint) => {
                const Icon = endpoint.icon;
                const isSelected = endpoint.id === selectedId;
                return (
                  <button
                    key={endpoint.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedId(endpoint.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                      isSelected
                        ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 border border-brand-primary/50'
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-sky-400'}`} />
                    <div className="min-w-0">
                      <span className="block truncate">{endpoint.name}</span>
                      <span className={`text-[10px] block opacity-75 font-normal ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                        {endpoint.category}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/docs"
                className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-sm font-bold shadow-lg transition-colors inline-flex items-center gap-2"
              >
                <span>Tüm Dokümantasyon</span>
                <FaArrowRight className="w-3 h-3" />
              </Link>
              <Link
                href="/magaza/abonelikler"
                className="px-5 py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 text-sm font-bold border border-indigo-500/40 transition-colors inline-flex items-center gap-2"
              >
                <span>Planlar & Krediler</span>
              </Link>
            </div>
          </div>

          {/* Sağ Kolon: Canlı İstek ve Yanıt */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl bg-slate-950 border border-slate-800 shadow-xl overflow-hidden">
              {/* Kod Başlığı & Sekmeler */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-sky-400 font-semibold border border-slate-700">
                    {current.path}
                  </span>
                  <div className="hidden sm:flex items-center rounded-lg bg-slate-800 p-0.5 border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setViewMode('request')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                        viewMode === 'request'
                          ? 'bg-brand-primary text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      İstek (cURL)
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('response')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                        viewMode === 'response'
                          ? 'bg-brand-primary text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      JSON Yanıt
                    </button>
                  </div>
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

              {/* Mobilde İstek/Yanıt Butonu */}
              <div className="sm:hidden flex border-b border-slate-800 bg-slate-900/80 px-3 py-1.5 gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('request')}
                  className={`flex-1 py-1 rounded text-xs font-semibold ${
                    viewMode === 'request' ? 'bg-brand-primary text-white' : 'text-slate-400'
                  }`}
                >
                  İstek
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('response')}
                  className={`flex-1 py-1 rounded text-xs font-semibold ${
                    viewMode === 'response' ? 'bg-brand-primary text-white' : 'text-slate-400'
                  }`}
                >
                  JSON Yanıt
                </button>
              </div>

              {/* Kod Gövdesi */}
              <pre className="p-4 sm:p-5 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-[340px]">
                {activeCode}
              </pre>

              {/* Alt Bilgi */}
              <div className="px-4 py-2.5 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <FaShieldAlt className="w-3.5 h-3.5" />
                  <span>KVKK & ISO 7064 Uyumlu</span>
                </span>
                <span className="font-mono text-slate-400 text-[11px]">Sub-ms Latency</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

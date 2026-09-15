'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaCheckCircle, FaTimesCircle, FaCopy, FaCheck, FaCode, FaArrowLeft, FaIdCard } from 'react-icons/fa';
import { validateTckn, validateVkn } from '@/modules/tr-api/validators';

export default function TcknVknToolClient() {
  const [type, setType] = useState<'tckn' | 'vkn'>('tckn');
  const [inputValue, setInputValue] = useState('10000000146');
  const [copied, setCopied] = useState(false);

  const cleanValue = inputValue.trim().replace(/\D/g, '');
  const result = cleanValue
    ? type === 'tckn'
      ? validateTckn(cleanValue)
      : validateVkn(cleanValue)
    : null;

  const handleCopyCurl = () => {
    const curl = `curl -X POST "https://noktanyus.com/api/v1/validate/identity" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"type":"${type}","value":"${cleanValue || '10000000146'}'}'`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="section-glass-hero bg-blob-decoration py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="relative z-10 space-y-8">
        <div>
          <Link
            href="/araclar"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-brand-primary transition-colors"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            <span>Tüm Araçlara Dön</span>
          </Link>
        </div>

        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <FaIdCard className="w-3 h-3" />
            <span>Resmi Modül-10 ve Tek/Çift Algoritması</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
            TCKN & VKN Algoritma Doğrulama Aracı
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            T.C. Kimlik Numarası (11 hane) veya Vergi Kimlik Numarası (10 hane) format ve checksum denetimini anında yapın.
          </p>
        </header>

        {/* Interactive Form Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-sm space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <button
              type="button"
              onClick={() => {
                setType('tckn');
                setInputValue('10000000146');
              }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                type === 'tckn'
                  ? 'bg-brand-primary text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              T.C. Kimlik No (11 Hane)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('vkn');
                setInputValue('1234567890');
              }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                type === 'vkn'
                  ? 'bg-brand-primary text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Vergi Kimlik No (10 Hane)
            </button>
          </div>

          <div>
            <label htmlFor="id-input" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              {type === 'tckn' ? 'T.C. Kimlik Numarası:' : 'Vergi Kimlik Numarası:'}
            </label>
            <input
              id="id-input"
              type="text"
              maxLength={type === 'tckn' ? 11 : 10}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={type === 'tckn' ? '11 haneli TCKN giriniz' : '10 haneli VKN giriniz'}
              className="w-full px-4 py-3 text-lg font-mono tracking-wider rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Hızlı Test:</span>
            {type === 'tckn' ? (
              <>
                <button
                  type="button"
                  onClick={() => setInputValue('10000000146')}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-primary/10 hover:text-brand-primary border border-slate-200 dark:border-slate-700"
                >
                  Geçerli TCKN (Algoritmik)
                </button>
                <button
                  type="button"
                  onClick={() => setInputValue('10000000145')}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-primary/10 hover:text-brand-primary border border-slate-200 dark:border-slate-700"
                >
                  Hatalı TCKN
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setInputValue('1234567890')}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-primary/10 hover:text-brand-primary border border-slate-200 dark:border-slate-700"
                >
                  Örnek VKN
                </button>
                <button
                  type="button"
                  onClick={() => setInputValue('0000000000')}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-primary/10 hover:text-brand-primary border border-slate-200 dark:border-slate-700"
                >
                  Hatalı VKN
                </button>
              </>
            )}
          </div>

          {/* Results */}
          {result && (
            <div
              className={`p-5 rounded-xl border ${
                result.valid
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-300'
              } space-y-2 transition-all`}
            >
              <div className="flex items-center gap-3">
                {result.valid ? (
                  <FaCheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                ) : (
                  <FaTimesCircle className="w-6 h-6 text-rose-500 shrink-0" />
                )}
                <div>
                  <h3 className="font-bold text-base sm:text-lg">
                    {result.valid
                      ? `Geçerli ${type.toUpperCase()} Formatı`
                      : `Geçersiz ${type.toUpperCase()} Formatı`}
                  </h3>
                  <p className="text-xs opacity-80">
                    {result.valid
                      ? `${type.toUpperCase()} kontrol basamakları ve matematiksel kural sağlandı.`
                      : result.reason || 'Algoritma kuralı uyuşmuyor.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* API CTA */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FaCode className="w-5 h-5 text-brand-primary" />
              <h3 className="text-lg font-bold">E-Ticaret Checkout Formunuza Ekleyin</h3>
            </div>
            <button
              type="button"
              onClick={handleCopyCurl}
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors self-start sm:self-auto"
            >
              {copied ? <FaCheck className="w-3.5 h-3.5 text-emerald-400" /> : <FaCopy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Kopyalandı!' : 'cURL Kopyala'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs sm:text-sm text-slate-300 overflow-x-auto border border-slate-800/80">
{`curl -X POST "https://noktanyus.com/api/v1/validate/identity" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"type":"${type}","value":"${cleanValue || '10000000146'}'}'`}
          </pre>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <span className="text-xs text-slate-400">Sepette hatalı fatura bilgilerini anında önleyin.</span>
            <div className="flex items-center gap-3">
              <Link
                href="/docs#tag/TR-API/operation/api-v1-validate-identity-post"
                className="text-xs font-bold text-brand-primary hover:underline"
              >
                API Dokümantasyonu →
              </Link>
              <Link
                href="/kayit"
                className="px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold transition-colors"
              >
                Ücretsiz Başlayın
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaCheckCircle, FaTimesCircle, FaCopy, FaCheck, FaCode, FaArrowLeft, FaShieldAlt } from 'react-icons/fa';
import { resolveIbanBank } from '@/modules/tr-api/validators';

const SAMPLES = [
  { label: 'Garanti BBVA', iban: 'TR330006100511123456789012' },
  { label: 'İş Bankası', iban: 'TR620006400000112345678901' },
  { label: 'Ziraat Bankası', iban: 'TR560001000001123456789012' },
  { label: 'Hatalı IBAN (Test)', iban: 'TR330006100511123456789099' },
];

export default function IbanToolClient() {
  const [ibanInput, setIbanInput] = useState('TR330006100511123456789012');
  const [copied, setCopied] = useState(false);

  const cleanIban = ibanInput.trim().replace(/\s+/g, '').toUpperCase();
  const bankCheck = cleanIban ? resolveIbanBank(cleanIban) : null;
  const result = bankCheck
    ? {
        ...bankCheck,
        formatted: bankCheck.normalized.replace(/(.{4})/g, '$1 ').trim(),
      }
    : null;

  const handleCopyCurl = () => {
    const curl = `curl -X POST "https://noktanyus.com/api/v1/validate/iban" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"iban":"${cleanIban || 'TR330006100511123456789012'}'}'`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="section-glass-hero bg-blob-decoration py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="relative z-10 space-y-8">
        {/* Back Link */}
        <div>
          <Link
            href="/araclar"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-brand-primary transition-colors"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            <span>Tüm Araçlara Dön</span>
          </Link>
        </div>

        {/* Title */}
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <FaShieldAlt className="w-3 h-3" />
            <span>ISO 7064 MOD-97 Algoritması</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
            TR IBAN Doğrulama & Banka Bulucu
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Türkiye bankalarına ait 26 haneli IBAN numaralarını anında doğrulayın, biçimlendirin ve resmi banka adını öğrenin.
          </p>
        </header>

        {/* Interactive Form Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-sm space-y-6">
          <div>
            <label htmlFor="iban-input" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              IBAN Numarası:
            </label>
            <input
              id="iban-input"
              type="text"
              value={ibanInput}
              onChange={(e) => setIbanInput(e.target.value)}
              placeholder="TR00 0000 0000 0000 0000 0000 00"
              className="w-full px-4 py-3 text-lg font-mono tracking-wider rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Preset Samples */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Hızlı Test:</span>
            {SAMPLES.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setIbanInput(s.iban)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-primary/10 hover:text-brand-primary border border-slate-200 dark:border-slate-700 transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Results Display */}
          {result && (
            <div
              className={`p-5 rounded-xl border ${
                result.valid
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-300'
              } space-y-3 transition-all`}
            >
              <div className="flex items-center gap-3">
                {result.valid ? (
                  <FaCheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                ) : (
                  <FaTimesCircle className="w-6 h-6 text-rose-500 shrink-0" />
                )}
                <div>
                  <h3 className="font-bold text-base sm:text-lg">
                    {result.valid ? 'Geçerli TR IBAN Numarası' : 'Geçersiz IBAN Numarası'}
                  </h3>
                  <p className="text-xs opacity-80">
                    {result.valid
                      ? 'Format uzunluğu (26 hane) ve ISO 7064 Mod-97 sağlama toplamı doğrulandı.'
                      : 'Hatalı kontrol basamağı veya geçersiz karakterler tespit edildi.'}
                  </p>
                </div>
              </div>

              {result.valid && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-emerald-500/20 text-sm">
                  <div>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">Banka Adı:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{result.bankName || 'Bilinmeyen Banka'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">Banka Kodu:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{result.bankCode}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="block text-xs text-slate-500 dark:text-slate-400">Biçimlendirilmiş IBAN:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white tracking-widest">
                      {result.formatted}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* API Integration Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FaCode className="w-5 h-5 text-brand-primary" />
              <h3 className="text-lg font-bold">Bu Doğrulamayı Kendi Yazılımınıza Ekleyin</h3>
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
{`curl -X POST "https://noktanyus.com/api/v1/validate/iban" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"iban":"${cleanIban || 'TR330006100511123456789012'}'}'`}
          </pre>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <span className="text-xs text-slate-400">Aylık 1.000 istek tamamen ücretsizdir.</span>
            <div className="flex items-center gap-3">
              <Link
                href="/docs#tag/TR-API/operation/api-v1-validate-iban-post"
                className="text-xs font-bold text-brand-primary hover:underline"
              >
                API Dokümantasyonu →
              </Link>
              <Link
                href="/kayit"
                className="px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold transition-colors"
              >
                Ücretsiz API Key Al
              </Link>
            </div>
          </div>
        </div>

        {/* SEO FAQ Section */}
        <section className="space-y-4 pt-4 text-slate-700 dark:text-slate-300">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sıkça Sorulan Sorular</h2>
          <div className="space-y-3 text-sm leading-relaxed">
            <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">Türkiye IBAN numarası kaç hanelidir?</h4>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                Türkiye'deki IBAN numaraları standart olarak 26 karakterden oluşur. İlk iki hane ülke kodu (TR), sonraki 2 hane
                kontrol basamağı, sonraki 5 hane banka kodu ve kalan 17 hane hesap/şube numarasıdır.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">Bu araç hesap sahibinin adını gösterir mi?</h4>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                Hayır. Bu servis matematiksel ISO 7064 algoritması ve banka kodu eşlemesi yapar. Kişisel veri (hesap sahibi adı vb.)
                saklamaz veya sorgulamaz. KVKK'ya %100 uyumludur.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

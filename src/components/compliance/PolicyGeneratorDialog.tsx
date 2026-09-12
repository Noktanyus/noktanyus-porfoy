/**
 * PolicyGeneratorDialog — Multi-step policy generator modal'ı.
 *
 * Steps:
 *   1) Jurisdiction seçimi (KVKK / GDPR / KVKK+GDPR)
 *   2) Veri kapsamı (hangi kategoriler toplanıyor)
 *   3) Özel maddeler (clause ekleme)
 *   4) Üretim (AI generate) veya Manuel giriş
 *   5) Önizleme
 *   6) Kaydet / Yayınla
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaFileContract,
  FaSpinner,
} from 'react-icons/fa';

interface Site {
  id: string;
  domain: string;
  name: string;
}

interface PolicyGeneratorDialogProps {
  site: Site;
}

const STEPS = [
  'Yetki Alanı',
  'Veri Kapsamı',
  'Özel Maddeler',
  'Üretim',
  'Önizleme',
  'Kaydet',
] as const;

const DATA_CATEGORIES = [
  { id: 'identity', label: 'Kimlik Bilgileri (ad, soyad, TC, doğum tarihi)' },
  { id: 'contact', label: 'İletişim Bilgileri (email, telefon, adres)' },
  { id: 'financial', label: 'Finansal Bilgiler (ödeme, fatura)' },
  { id: 'behavioral', label: 'Davranışsal Veriler (ziyaret logları, analytics)' },
  { id: 'sensitive', label: 'Özel Nitelikli (sağlık, biyometrik, siyasi görüş)' },
  { id: 'children', label: 'Çocuk Verileri (18 yaş altı)' },
];

export function PolicyGeneratorDialog({ site }: PolicyGeneratorDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');

  const [form, setForm] = useState({
    jurisdiction: 'KVKK+GDPR',
    dataCategories: [] as string[],
    customClauses: '',
    generatedBy: 'ai' as 'ai' | 'manual',
    title: `${site.name} Gizlilik Politikası`,
  });

  const update = <K extends keyof typeof form>(
    field: K,
    value: (typeof form)[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (id: string) => {
    update(
      'dataCategories',
      form.dataCategories.includes(id)
        ? form.dataCategories.filter((c) => c !== id)
        : [...form.dataCategories, id]
    );
  };

  const close = () => {
    if (busy) return;
    setOpen(false);
    setStep(0);
    setGeneratedContent('');
  };

  const handleGenerate = async () => {
    setBusy(true);
    try {
      if (form.generatedBy === 'ai') {
        const res = await fetch('/api/compliance/policy/generate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            siteId: site.id,
            jurisdiction: form.jurisdiction,
            dataCategories: form.dataCategories,
            customClauses: form.customClauses,
            title: form.title,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error?.message ?? 'Üretilemedi');
        setGeneratedContent(data.data?.content ?? '');
        toast.success('Policy üretildi');
        setStep(4);
      } else {
        setGeneratedContent('# Manuel Policy\n\nLütfen içeriği aşağıya girin...');
        setStep(4);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/compliance/policies', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          siteId: site.id,
          title: form.title,
          content: generatedContent,
          jurisdiction: form.jurisdiction,
          generatedBy: form.generatedBy,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Kaydedilemedi');
      toast.success('Policy kaydedildi');
      router.refresh();
      close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setBusy(false);
    }
  };

  const canNext =
    (step === 0 && !!form.jurisdiction) ||
    (step === 1 && form.dataCategories.length > 0) ||
    step === 2 ||
    step === 3;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="admin-btn admin-btn-primary"
      >
        <FaFileContract className="w-3 h-3" />
        Policy Üret
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => !busy && close()}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">Policy Üretici</h2>
          <p className="text-sm text-muted-foreground">
            {site.name} ({site.domain})
          </p>
          <div className="flex items-center gap-1 mt-3">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded ${
                  i <= step ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                }`}
                title={s}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Adım {step + 1} / {STEPS.length}: {STEPS[step]}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm">Hangi yetki alanına uygun policy üretilecek?</p>
              {(['KVKK', 'GDPR', 'KVKK+GDPR'] as const).map((j) => (
                <label
                  key={j}
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition ${
                    form.jurisdiction === j
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="jurisdiction"
                    checked={form.jurisdiction === j}
                    onChange={() => update('jurisdiction', j)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium">{j}</p>
                    <p className="text-xs text-muted-foreground">
                      {j === 'KVKK' && 'Türkiye Kişisel Verilerin Korunması Kanunu'}
                      {j === 'GDPR' && 'AB Genel Veri Koruma Tüzüğü'}
                      {j === 'KVKK+GDPR' && 'Hem Türkiye hem AB için uyumlu bileşik policy'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-2">
              <p className="text-sm mb-3">
                Hangi kişisel veri kategorilerini topluyorsunuz?
              </p>
              {DATA_CATEGORIES.map((cat) => (
                <label
                  key={cat.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    form.dataCategories.includes(cat.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.dataCategories.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                    className="mt-1"
                  />
                  <span className="text-sm">{cat.label}</span>
                </label>
              ))}
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-sm mb-3">
                Eklemek istediğiniz özel maddeler? (opsiyonel)
              </p>
              <textarea
                rows={6}
                value={form.customClauses}
                onChange={(e) => update('customClauses', e.target.value)}
                className="admin-input w-full"
                placeholder="Örn: Çocuk verileri toplanmaz. Üçüncü taraf ödeme işlemcileri Stripe ve PayPal ile sınırlıdır..."
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Policy Başlığı
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  className="admin-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Üretim Yöntemi
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['ai', 'manual'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => update('generatedBy', mode)}
                      className={`p-4 rounded-lg border text-left transition ${
                        form.generatedBy === mode
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <p className="font-medium text-sm">
                        {mode === 'ai' ? 'AI Üretimi' : 'Manuel Taslak'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {mode === 'ai'
                          ? 'Anthropic Claude ile otomatik üretim'
                          : 'Boş taslak oluştur, elle düzenle'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={busy}
                className="admin-btn admin-btn-primary w-full"
              >
                {busy ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                {busy ? 'Üretiliyor...' : 'Üret'}
              </button>
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Önizleme — düzenleme yapabilirsiniz
              </p>
              <textarea
                rows={18}
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                className="admin-input w-full font-mono text-xs"
              />
            </div>
          )}

          {step === 5 && (
            <div className="text-center space-y-3 py-8">
              <FaCheck className="w-12 h-12 text-green-500 mx-auto" aria-hidden="true" />
              <p className="font-medium">Policy hazır!</p>
              <p className="text-sm text-muted-foreground">
                Kaydettikten sonra policy'yi inceleme/approval workflow'una alabilirsiniz.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={busy || step === 0}
            className="admin-btn"
          >
            <FaArrowLeft className="w-3 h-3" />
            Geri
          </button>
          {step < 4 && (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext}
              className="admin-btn admin-btn-primary ml-auto"
            >
              İleri
              <FaArrowRight className="w-3 h-3" />
            </button>
          )}
          {step === 4 && (
            <button
              type="button"
              onClick={() => setStep(5)}
              className="admin-btn admin-btn-primary ml-auto"
            >
              Devam
              <FaArrowRight className="w-3 h-3" />
            </button>
          )}
          {step === 5 && (
            <button
              type="button"
              onClick={handleSave}
              disabled={busy}
              className="admin-btn admin-btn-primary ml-auto"
            >
              {busy ? <FaSpinner className="animate-spin" /> : <FaCheck />}
              Kaydet
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

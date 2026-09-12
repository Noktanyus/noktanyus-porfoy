'use client';

/**
 * @file SaaS Generate Page — Tekil + toplu AI üretim UI.
 * @description Tab arayüzü: Tab 1 tekil ürün formu, Tab 2 CSV toplu yükleme.
 *              Server-side olmayan tek sayfa — tüm mantık client'ta.
 *
 *              Tekil mod:
 *                - title, features[], category, targetAudience, language, length
 *                - brandVoiceId dropdown
 *                - POST /api/saas-ui/describe (session-bridged)
 *
 *              Toplu mod:
 *                - BulkUploadDropzone ile CSV yükleme
 *                - language/length/brandVoice seçici
 *                - POST /api/saas-ui/describe/bulk (multipart) → jobId döner
 *                - Kullanıcı /saas/jobs/[jobId]'e yönlendirilir
 *
 * Faz D:
 *  - Emoji ikonlar react-icons'e taşındı.
 *  - Form alanları ortak `FormField` + `DS.input` ile standartlaştırıldı
 *    (label/hata/yardım metni bağlantıları otomatik: aria-describedby).
 *  - Hata blokları `ErrorBanner`, boş sonuç `EmptyState`, buton spinner'ı
 *    `ButtonSpinner`, etiketler `StatusBadge` ile ortaklaştırıldı.
 *  - Tab'lar tam ARIA tab/tabpanel ilişkisiyle bağlandı.
 *  - Token sayacı düzeltildi (önce input + total toplanıyordu; artık total).
 */

import { useCallback, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaMagic, FaLayerGroup, FaCopy, FaCheck } from 'react-icons/fa';
import { BulkUploadDropzone } from '@/components/saas/BulkUploadDropzone';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorDisplay';
import { FormField } from '@/components/ui/FormField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ButtonSpinner } from '@/components/ui/LoadingSkeleton';
import { DS } from '@/lib/design-system';
import { cn } from '@/lib/utils';

type Tab = 'single' | 'bulk';

interface BrandVoice {
  id: string;
  name: string;
}

interface GenerateResponse {
  shortDescription: string;
  description: string;
  suggestedTags?: string[];
  tokensUsed: { input: number; output: number; total: number };
  mock?: boolean;
}

type LanguageCode = 'tr' | 'en' | 'de' | 'fr' | 'es' | 'ar';
type LengthCode = 'short' | 'medium' | 'long';

const LANGUAGES: { value: LanguageCode; label: string }[] = [
  { value: 'tr', label: 'Türkçe' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'ar', label: 'العربية' },
];

const LENGTHS: { value: LengthCode; label: string }[] = [
  { value: 'short', label: 'Kısa (1 paragraf)' },
  { value: 'medium', label: 'Orta (2-3 paragraf)' },
  { value: 'long', label: 'Uzun (4+ paragraf)' },
];

interface GeneratePageProps {
  brandVoices: BrandVoice[];
}

export function GenerateClient({ brandVoices }: GeneratePageProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('single');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ürün Açıklaması Üret"
        description="Tekil ürün için hızlı üretim ya da toplu CSV ile yüzlerce ürünü tek seferde işleyin."
        breadcrumb={<span>SaaS / Üret</span>}
      />

      {/* Tab nav */}
      <div
        role="tablist"
        aria-label="Üretim modu"
        className="inline-flex rounded-xl bg-muted p-1"
      >
        <TabButton
          id="tab-single"
          panelId="panel-single"
          active={tab === 'single'}
          onClick={() => setTab('single')}
          icon={<FaMagic />}
        >
          Tekil Ürün
        </TabButton>
        <TabButton
          id="tab-bulk"
          panelId="panel-bulk"
          active={tab === 'bulk'}
          onClick={() => setTab('bulk')}
          icon={<FaLayerGroup />}
        >
          Toplu CSV
        </TabButton>
      </div>

      {tab === 'single' ? (
        <div id="panel-single" role="tabpanel" aria-labelledby="tab-single">
          <SingleForm brandVoices={brandVoices} />
        </div>
      ) : (
        <div id="panel-bulk" role="tabpanel" aria-labelledby="tab-bulk">
          <BulkForm
            brandVoices={brandVoices}
            onStarted={(jobId) => router.push(`/saas/jobs/${jobId}`)}
          />
        </div>
      )}
    </div>
  );
}

// === Tab Button ===

function TabButton({
  id,
  panelId,
  active,
  onClick,
  icon,
  children,
}: {
  id: string;
  panelId: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={active}
      aria-controls={panelId}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        active
          ? 'bg-card text-brand-primary shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <span aria-hidden="true">{icon}</span>
      {children}
    </button>
  );
}

/** Dil / uzunluk / marka sesi seçicileri — tekil ve toplu formda ortak. */
function GenerationOptions({
  idPrefix,
  language,
  setLanguage,
  length,
  setLength,
  brandVoiceId,
  setBrandVoiceId,
  brandVoices,
}: {
  idPrefix: string;
  language: LanguageCode;
  setLanguage: (v: LanguageCode) => void;
  length: LengthCode;
  setLength: (v: LengthCode) => void;
  brandVoiceId: string;
  setBrandVoiceId: (v: string) => void;
  brandVoices: BrandVoice[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <FormField id={`${idPrefix}-language`} label="Dil">
        {(fieldProps) => (
          <select
            {...fieldProps}
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            className={DS.input}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        )}
      </FormField>

      <FormField id={`${idPrefix}-length`} label="Uzunluk">
        {(fieldProps) => (
          <select
            {...fieldProps}
            value={length}
            onChange={(e) => setLength(e.target.value as LengthCode)}
            className={DS.input}
          >
            {LENGTHS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        )}
      </FormField>

      <FormField
        id={`${idPrefix}-bv`}
        label="Marka sesi"
        helperText={brandVoices.length === 0 ? 'Kayıtlı ses yok' : undefined}
      >
        {(fieldProps) => (
          <select
            {...fieldProps}
            value={brandVoiceId}
            onChange={(e) => setBrandVoiceId(e.target.value)}
            className={DS.input}
            disabled={brandVoices.length === 0}
          >
            <option value="">Marka sesi kullanma</option>
            {brandVoices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        )}
      </FormField>
    </div>
  );
}

// === Single Form ===

function SingleForm({ brandVoices }: { brandVoices: BrandVoice[] }) {
  const [title, setTitle] = useState('');
  const [features, setFeatures] = useState('');
  const [category, setCategory] = useState('');
  const [audience, setAudience] = useState('');
  const [language, setLanguage] = useState<LanguageCode>('tr');
  const [length, setLength] = useState<LengthCode>('medium');
  const [brandVoiceId, setBrandVoiceId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const featureList = features
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);

  const canSubmit = title.trim().length >= 2 && featureList.length >= 1 && !loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Session-bridged SaaS endpoint — workspace otomatik çözülür
      const res = await fetch('/api/saas-ui/describe', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          brandVoiceId: brandVoiceId || undefined,
          productName: title,
          features: featureList,
          category: category || undefined,
          targetAudience: audience || undefined,
          language,
          variant: length,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message ?? 'Üretim başarısız');
      }

      setResult(json.data as GenerateResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  }

  async function copyResult() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(
        `${result.shortDescription}\n\n${result.description}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard yoksa sessizce yok say
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DashboardSection title="Ürün Bilgileri" padding="lg">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField id="gen-title" label="Ürün başlığı" required>
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="örn. Organik Pamuk T-Shirt"
                className={DS.input}
              />
            )}
          </FormField>

          <FormField
            id="gen-features"
            label="Özellikler"
            required
            helperText={`Virgülle ayırın · ${featureList.length} özellik algılandı`}
          >
            {(fieldProps) => (
              <textarea
                {...fieldProps}
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                rows={3}
                placeholder="%100 organik pamuk, nefes alabilir kumaş, modern kesim"
                className={cn(DS.input, 'resize-y')}
              />
            )}
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField id="gen-category" label="Kategori (opsiyonel)">
              {(fieldProps) => (
                <input
                  {...fieldProps}
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  maxLength={100}
                  placeholder="örn. giyim"
                  className={DS.input}
                />
              )}
            </FormField>

            <FormField id="gen-audience" label="Hedef kitle (opsiyonel)">
              {(fieldProps) => (
                <input
                  {...fieldProps}
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  maxLength={200}
                  placeholder="örn. 25-40 yaş profesyoneller"
                  className={DS.input}
                />
              )}
            </FormField>
          </div>

          <GenerationOptions
            idPrefix="gen"
            language={language}
            setLanguage={setLanguage}
            length={length}
            setLength={setLength}
            brandVoiceId={brandVoiceId}
            setBrandVoiceId={setBrandVoiceId}
            brandVoices={brandVoices}
          />

          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

          <button
            type="submit"
            disabled={!canSubmit}
            className="admin-btn admin-btn-primary w-full"
          >
            {loading ? (
              <>
                <ButtonSpinner size="small" />
                Üretiliyor…
              </>
            ) : (
              <>
                <FaMagic aria-hidden="true" className="h-3.5 w-3.5" />
                AI ile Üret
              </>
            )}
          </button>

          {brandVoices.length === 0 && (
            <p className="text-center text-xs text-muted-foreground">
              Marka sesiniz mi yok?{' '}
              <Link href="/saas/brand-voice" className="text-brand-primary hover:underline">
                Hemen eğitin →
              </Link>
            </p>
          )}
        </form>
      </DashboardSection>

      {/* Sonuç paneli */}
      <DashboardSection
        title="Sonuç"
        padding="lg"
        meta={
          result ? (
            <button
              type="button"
              onClick={copyResult}
              className="inline-flex min-h-[32px] items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs transition-colors hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {copied ? (
                <>
                  <FaCheck aria-hidden="true" className="h-3 w-3" />
                  Kopyalandı
                </>
              ) : (
                <>
                  <FaCopy aria-hidden="true" className="h-3 w-3" />
                  Kopyala
                </>
              )}
            </button>
          ) : undefined
        }
      >
        <div aria-live="polite">
          {!result ? (
            <EmptyState
              variant="inline"
              icon="file"
              title="Henüz sonuç yok"
              description="Soldaki formu doldurup “AI ile Üret” butonuna basın."
            />
          ) : (
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  Kısa açıklama
                </p>
                <p className="text-sm leading-relaxed text-foreground">
                  {result.shortDescription}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  Uzun açıklama
                </p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                  {result.description}
                </p>
              </div>
              {result.suggestedTags && result.suggestedTags.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">
                    Önerilen etiketler
                  </p>
                  <ul className="flex flex-wrap gap-1.5">
                    {result.suggestedTags.map((tag) => (
                      <li key={tag}>
                        <StatusBadge size="sm" tone="brand" label={`#${tag}`} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-3 text-xs tabular-nums text-muted-foreground">
                <span>{result.tokensUsed.total} token kullanıldı</span>
                {result.mock && (
                  <StatusBadge
                    size="sm"
                    tone="warning"
                    label="Demo mod"
                    srLabel="Uyarı:"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </DashboardSection>
    </div>
  );
}

// === Bulk Form ===

interface BulkFormProps {
  brandVoices: BrandVoice[];
  onStarted: (jobId: string) => void;
}

function BulkForm({ brandVoices, onStarted }: BulkFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [language, setLanguage] = useState<LanguageCode>('tr');
  const [length, setLength] = useState<LengthCode>('medium');
  const [brandVoiceId, setBrandVoiceId] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const statusId = useId();

  const onFileAccepted = useCallback((p: { file: File; rowCount: number }) => {
    setFile(p.file);
    setRowCount(p.rowCount);
  }, []);

  async function start() {
    if (!file) return;
    setBusy(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      if (brandVoiceId) fd.append('brandVoiceId', brandVoiceId);
      fd.append('language', language);
      fd.append('variant', length);

      const res = await fetch('/api/saas-ui/describe/bulk', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message ?? 'Toplu üretim başlatılamadı');
      }
      onStarted(json.data.jobId as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <DashboardSection
        title="CSV Yükle"
        description="UTF-8 kodlamalı CSV, ilk satır başlık olmalı (title, features)."
        padding="lg"
      >
        <BulkUploadDropzone onFileAccepted={onFileAccepted} busy={busy} />
        <p id={statusId} role="status" aria-live="polite" className="mt-3 text-sm text-muted-foreground">
          {file
            ? `${file.name} seçildi · ${rowCount} satır algılandı.`
            : 'Henüz dosya seçilmedi.'}
        </p>
      </DashboardSection>

      <DashboardSection title="Üretim Ayarları" padding="lg">
        <div className="space-y-4">
          <GenerationOptions
            idPrefix="bulk"
            language={language}
            setLanguage={setLanguage}
            length={length}
            setLength={setLength}
            brandVoiceId={brandVoiceId}
            setBrandVoiceId={setBrandVoiceId}
            brandVoices={brandVoices}
          />

          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

          <button
            type="button"
            onClick={start}
            disabled={!file || busy}
            aria-describedby={statusId}
            className="admin-btn admin-btn-primary w-full"
          >
            {busy ? (
              <>
                <ButtonSpinner size="small" />
                Başlatılıyor…
              </>
            ) : file ? (
              <>
                <FaLayerGroup aria-hidden="true" className="h-3.5 w-3.5" />
                {`${rowCount} satır için toplu üretimi başlat`}
              </>
            ) : (
              'Önce CSV yükleyin'
            )}
          </button>
        </div>
      </DashboardSection>
    </div>
  );
}

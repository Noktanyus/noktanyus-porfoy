'use client';

/**
 * @file SaaS Brand Voice — Client UI (liste + modal).
 * @description Server entry page.tsx'ten brand voice listesini prop olarak alır.
 *              UI: liste (BrandVoiceCard grid) + "Yeni" butonu → çok adımlı
 *              modal:
 *                1. Ad + açıklama
 *                2. Örneklemler (min 3, max 30) — SampleProductForm satırları
 *                3. AI eğitimi başlat → başarı durumu
 *
 *              Train endpoint: POST /api/saas-ui/brand-voice/train
 *
 * Faz D: kendi elle yazılmış dialog/backdrop/input blokları yerine ortak
 * `Modal`, `FormField`, `EmptyState`, `PageHeader` ve `ErrorBanner`
 * primitive'leri kullanılıyor. Adım göstergesi tutarlı hale getirildi
 * (önceden "Adım 4 / 3" gösterebiliyordu).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaPlus, FaBrain } from 'react-icons/fa';
import { BrandVoiceCard, type BrandVoiceCardData } from '@/components/saas/BrandVoiceCard';
import { SampleProductForm, type TrainSampleValue } from '@/components/saas/SampleProductForm';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorDisplay';
import { FormField } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import { ButtonSpinner } from '@/components/ui/LoadingSkeleton';
import { DS } from '@/lib/design-system';
import { cn } from '@/lib/utils';

interface BrandVoiceClientProps {
  initialVoices: BrandVoiceCardData[];
}

const EMPTY_SAMPLE: TrainSampleValue = { title: '', features: '', generatedDescription: '' };

/** Eğitim için gereken minimum / maksimum örneklem sayısı. */
const MIN_SAMPLES = 3;
const MAX_SAMPLES = 30;

export function BrandVoiceClient({ initialVoices }: BrandVoiceClientProps) {
  const router = useRouter();
  const [voices, setVoices] = useState<BrandVoiceCardData[]>(initialVoices);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/saas-ui/brand-voice/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message ?? 'Silinemedi');
      }
      setVoices((prev) => prev.filter((v) => v.id !== id));
      toast.success('Marka sesi silindi');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Silme başarısız');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marka Sesleriniz"
        description="Mevcut içeriklerinizden öğrenen AI ile her üretimde aynı sesi kullanın."
        breadcrumb={<span>SaaS / Marka Sesi</span>}
        actions={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="admin-btn admin-btn-primary"
          >
            <FaPlus aria-hidden="true" className="w-3 h-3" />
            Yeni Marka Sesi
          </button>
        }
      />

      {voices.length === 0 ? (
        <EmptyState
          icon="file"
          title="Henüz marka sesiniz yok"
          description={`Mevcut ürünlerinizden ${MIN_SAMPLES}-${MAX_SAMPLES} örneklem girerek kendi ses tonunuzu eğitin.`}
          action={{
            label: 'İlk Sesinizi Oluşturun',
            onClick: () => setModalOpen(true),
          }}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {voices.map((v) => (
            <li key={v.id} className="min-w-0">
              <BrandVoiceCard
                voice={v}
                onDelete={deletingId === v.id ? undefined : handleDelete}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Koşullu render — modal kapandığında sihirbaz state'i sıfırlanır. */}
      {modalOpen && (
        <TrainBrandVoiceModal
          open
          onClose={() => setModalOpen(false)}
          onCreated={(created) => {
            setVoices((prev) => [created, ...prev]);
            setModalOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// === Multi-step Modal ===

interface TrainModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (voice: BrandVoiceCardData) => void;
}

type WizardStep = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<WizardStep, string> = {
  1: 'Bilgiler',
  2: 'Örneklemler',
  3: 'Eğitim',
  4: 'Tamamlandı',
};

const TOTAL_STEPS = 3;

function TrainBrandVoiceModal({ open, onClose, onCreated }: TrainModalProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [samples, setSamples] = useState<TrainSampleValue[]>([
    { ...EMPTY_SAMPLE },
    { ...EMPTY_SAMPLE },
    { ...EMPTY_SAMPLE },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateSample(i: number, next: TrainSampleValue) {
    setSamples((prev) => prev.map((s, idx) => (idx === i ? next : s)));
  }

  function addSample() {
    if (samples.length >= MAX_SAMPLES) return;
    setSamples((prev) => [...prev, { ...EMPTY_SAMPLE }]);
  }

  function removeSample(i: number) {
    if (samples.length <= MIN_SAMPLES) return;
    setSamples((prev) => prev.filter((_, idx) => idx !== i));
  }

  const nameError =
    name.length > 0 && name.trim().length < 2
      ? 'Marka adı en az 2 karakter olmalı.'
      : undefined;

  function validateStep1(): boolean {
    return name.trim().length >= 2 && name.trim().length <= 100;
  }

  function validateStep2(): boolean {
    if (samples.length < MIN_SAMPLES) return false;
    return samples.every(
      (s) =>
        s.title.trim().length >= 2 &&
        s.features.split(',').map((f) => f.trim()).filter(Boolean).length >= 1 &&
        s.generatedDescription.trim().length >= 20
    );
  }

  async function train() {
    if (!validateStep2()) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch('/api/saas-ui/brand-voice/train', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          samples: samples.map((s) => ({
            title: s.title.trim(),
            features: s.features
              .split(',')
              .map((f) => f.trim())
              .filter(Boolean),
            generatedDescription: s.generatedDescription.trim(),
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message ?? 'Eğitim başarısız');
      }

      const created = json.data as BrandVoiceCardData & { createdAt: string };
      setStep(4); // success
      setTimeout(() => onCreated(created), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setBusy(false);
    }
  }

  /** Adım göstergesi — 4. adım "tamamlandı" olduğu için 3/3 gösterilir. */
  const displayStep = Math.min(step, TOTAL_STEPS);

  return (
    <Modal
      open={open}
      onClose={busy ? () => undefined : onClose}
      title="Yeni Marka Sesi"
      description={`Adım ${displayStep} / ${TOTAL_STEPS} — ${STEP_LABELS[step]}`}
      size="2xl"
      closeOnBackdrop={!busy}
      closeOnEsc={!busy}
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          {step > 1 && step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s > 1 ? ((s - 1) as WizardStep) : s))}
              disabled={busy}
              className="admin-btn admin-btn-secondary"
            >
              ← Geri
            </button>
          ) : (
            <span />
          )}

          {step === 1 && (
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!validateStep1()}
              className="admin-btn admin-btn-primary"
            >
              Devam →
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!validateStep2()}
              className="admin-btn admin-btn-primary"
            >
              Eğitime Geç →
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={train}
              disabled={busy}
              className="admin-btn admin-btn-primary"
            >
              {busy ? (
                <>
                  <ButtonSpinner size="small" />
                  Eğitiliyor…
                </>
              ) : (
                <>
                  <FaBrain aria-hidden="true" className="w-3.5 h-3.5" />
                  Eğitimi Başlat
                </>
              )}
            </button>
          )}
        </div>
      }
    >
      {step === 1 && (
        <div className="space-y-4">
          <FormField
            id="bv-name"
            label="Marka adı"
            required
            error={nameError}
            helperText={`${name.length} / 100 karakter`}
          >
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                placeholder="örn. Moda Acentesi Resmi Sesi"
                className={cn(DS.input, DS.inputError)}
              />
            )}
          </FormField>

          <FormField
            id="bv-desc"
            label="Açıklama (opsiyonel)"
            helperText="Bu ses hangi marka/ürün kategorisi için kullanılacak?"
          >
            {(fieldProps) => (
              <textarea
                {...fieldProps}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                className={cn(DS.input, 'resize-y')}
              />
            )}
          </FormField>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div
            role="note"
            className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-900 dark:text-sky-200"
          >
            <p className="font-semibold mb-1">10 örneklem öneriyoruz</p>
            <p className="text-xs opacity-90">
              Minimum {MIN_SAMPLES}, maksimum {MAX_SAMPLES}. AI her birinden ton,
              kelime haznesi ve CTA kalıbı öğrenir.
            </p>
          </div>

          {samples.map((s, i) => (
            <SampleProductForm
              key={i}
              index={i}
              value={s}
              onChange={(next) => updateSample(i, next)}
              onRemove={samples.length > MIN_SAMPLES ? () => removeSample(i) : undefined}
              totalSamples={samples.length}
            />
          ))}

          <button
            type="button"
            onClick={addSample}
            disabled={samples.length >= MAX_SAMPLES}
            className="inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm font-semibold text-muted-foreground transition-colors hover:border-brand-primary hover:text-brand-primary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <FaPlus aria-hidden="true" className="w-3 h-3" />
            Örneklem Ekle ({samples.length}/{MAX_SAMPLES})
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="py-4 text-center">
            <span
              aria-hidden="true"
              className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/10 text-2xl text-brand-primary"
            >
              <FaBrain />
            </span>
            <p className="font-semibold text-foreground mb-1">Eğitim başlayacak</p>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              {samples.length} örneklem üzerinden marka sesiniz çıkarılacak. Bu işlem
              yaklaşık 30 saniye sürer.
            </p>
          </div>

          <dl className="mx-auto max-w-sm space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between gap-3">
              <dt>Marka adı</dt>
              <dd className="font-semibold text-foreground truncate">{name.trim()}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Örneklem sayısı</dt>
              <dd className="font-semibold text-foreground tabular-nums">{samples.length}</dd>
            </div>
          </dl>

          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
        </div>
      )}

      {step === 4 && (
        <div
          role="status"
          aria-live="polite"
          className="py-10 text-center"
        >
          <span
            aria-hidden="true"
            className="mx-auto mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-3xl text-emerald-600 dark:text-emerald-400"
          >
            ✓
          </span>
          <p className="mb-1 text-xl font-bold text-foreground">Marka sesiniz hazır!</p>
          <p className="text-sm text-muted-foreground">
            Artık üretimlerinizde bu sesi seçebilirsiniz.
          </p>
        </div>
      )}
    </Modal>
  );
}

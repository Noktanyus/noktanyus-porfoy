'use client';

/**
 * @file BrandVoiceCard — Brand voice list item.
 * @description Marka sesi kartı: isim, açıklama, örneklem sayısı, eğitim tarihi,
 *              edit / delete butonları. Silme onay modal tetikler; ebeveyn
 *              delete handler'ı çağırır (DB işlemi orada yapılır).
 */

import { useState } from 'react';
import { cn, formatDate } from '@/lib/utils';

export interface BrandVoiceCardData {
  id: string;
  name: string;
  description: string | null;
  model: string;
  trainedAt: string | null;
  sampleCount: number;
}

interface BrandVoiceCardProps {
  voice: BrandVoiceCardData;
  /** Seçili olanı vurgula (marka seçili dropdown için). */
  selected?: boolean;
  /** Kart tıklandığında çağrılır (örn. düzenleme modunu aç). */
  onEdit?: (id: string) => void;
  /** Sil onayından sonra çağrılır. */
  onDelete?: (id: string) => void | Promise<void>;
}

export function BrandVoiceCard({ voice, selected, onEdit, onDelete }: BrandVoiceCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!onDelete) return;
    setBusy(true);
    try {
      await onDelete(voice.id);
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      className={cn(
        'rounded-2xl border p-5 bg-white dark:bg-gray-900 transition-all',
        selected
          ? 'border-brand-primary ring-2 ring-brand-primary/30'
          : 'border-gray-200 dark:border-gray-700 hover:border-brand-primary/40'
      )}
    >
      <header className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
            {voice.name}
          </h3>
          {voice.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {voice.description}
            </p>
          )}
        </div>
        {selected && (
          <span className="shrink-0 px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold">
            SEÇİLİ
          </span>
        )}
      </header>

      <dl className="grid grid-cols-3 gap-2 text-xs mb-4">
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Örneklem</dt>
          <dd className="font-semibold text-gray-900 dark:text-white tabular-nums">{voice.sampleCount}</dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Model</dt>
          <dd className="font-semibold text-gray-900 dark:text-white truncate" title={voice.model}>
            {voice.model.split('-').slice(-2).join('-')}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Eğitim</dt>
          <dd className="font-semibold text-gray-900 dark:text-white">
            {voice.trainedAt ? formatDate(voice.trainedAt) : '—'}
          </dd>
        </div>
      </dl>

      <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(voice.id)}
            className="flex-1 inline-flex items-center justify-center min-h-[40px] rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-semibold hover:border-brand-primary hover:text-brand-primary transition-colors"
          >
            Düzenle
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center justify-center min-h-[40px] px-3 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            aria-label={`${voice.name} marka sesini sil`}
          >
            Sil
          </button>
        )}
      </div>

      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`confirm-${voice.id}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => !busy && setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 id={`confirm-${voice.id}`} className="text-base font-bold text-gray-900 dark:text-white mb-2">
              Marka sesini sil?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
              <strong>{voice.name}</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={busy}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? 'Siliniyor…' : 'Evet, sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

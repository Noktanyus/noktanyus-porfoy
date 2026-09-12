'use client';

/**
 * @file SampleProductForm — Marka sesi eğitimi için 1 adet örneklem satırı.
 * @description Brand voice training'de kullanıcı 3-30 örneklem girer. Her satır
 *              title + features (virgülle ayrılmış) + AI tarafından üretilmiş
 *              açıklama alır. Ebeveyn state'i sample dizisini tutar; bu bileşen
 *              sadece satır UI'ı ve validation sağlar.
 */

import { cn } from '@/lib/utils';

export interface TrainSampleValue {
  title: string;
  features: string; // virgülle ayrılmış string
  generatedDescription: string;
}

interface SampleProductFormProps {
  index: number;
  value: TrainSampleValue;
  onChange: (next: TrainSampleValue) => void;
  onRemove?: () => void;
  /** Toplam örneklem sayısı — son satırda remove butonu disable edilir (min 3). */
  totalSamples?: number;
}

export function SampleProductForm({
  index,
  value,
  onChange,
  onRemove,
  totalSamples,
}: SampleProductFormProps) {
  const featureCount = value.features
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean).length;
  const canRemove = totalSamples === undefined || totalSamples > 3;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Örneklem #{index + 1}
        </span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove}
            aria-label={`Örneklem ${index + 1} kaldır`}
            className={cn(
              'text-xs px-2 py-1 rounded-md',
              canRemove
                ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                : 'text-gray-400 cursor-not-allowed'
            )}
          >
            Kaldır
          </button>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          Ürün başlığı
        </label>
        <input
          type="text"
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          placeholder="örn. Organik Pamuk T-Shirt"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          maxLength={200}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          Özellikler <span className="text-gray-400">(virgülle ayırın · en az 1)</span>
        </label>
        <input
          type="text"
          value={value.features}
          onChange={(e) => onChange({ ...value, features: e.target.value })}
          placeholder="%100 organik pamuk, nefes alabilir kumaş, modern kesim"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
        <p className="text-xs text-gray-500 mt-1 tabular-nums">
          {featureCount} özellik algılandı
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
          Örnek açıklama <span className="text-gray-400">(AI çıktısı — bu sizin sesiniz)</span>
        </label>
        <textarea
          value={value.generatedDescription}
          onChange={(e) => onChange({ ...value, generatedDescription: e.target.value })}
          placeholder="Marka sesinizi yansıtan açıklama metni (20-5000 karakter)"
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary resize-y"
          maxLength={5000}
        />
        <p className="text-xs text-gray-500 mt-1 tabular-nums">
          {value.generatedDescription.length} / 5000 karakter
        </p>
      </div>
    </div>
  );
}

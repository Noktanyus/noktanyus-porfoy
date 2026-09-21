/**
 * @file Admin abonelik planı formu — oluşturma ve düzenleme.
 */

'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import type { Plan, PlanInterval } from '@prisma/client';
import { parsePlanFeatures } from '@/lib/schemas/plan';

type PlanFormValues = {
  slug: string;
  name: string;
  description: string;
  interval: PlanInterval;
  /** TL */
  priceTl: number;
  currency: string;
  marketingText: string;
  apiRequestsPerMonth: string;
  trialDays: number;
  order: number;
  stripePriceId: string;
  stripeProductId: string;
  active: boolean;
  isFeatured: boolean;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

interface PlanFormProps {
  plan?: Plan;
}

export default function PlanForm({ plan }: PlanFormProps) {
  const router = useRouter();
  const isEdit = Boolean(plan);
  const parsed = plan ? parsePlanFeatures(plan.features) : null;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<PlanFormValues>({
    defaultValues: {
      slug: plan?.slug ?? '',
      name: plan?.name ?? '',
      description: plan?.description ?? '',
      interval: plan?.interval ?? 'MONTH',
      priceTl: plan ? plan.priceCents / 100 : 99,
      currency: plan?.currency ?? 'try',
      marketingText: (parsed?.marketing ?? []).join('\n'),
      apiRequestsPerMonth:
        parsed?.limits?.apiRequestsPerMonth != null
          ? String(parsed.limits.apiRequestsPerMonth)
          : '',
      trialDays: plan?.trialDays ?? 14,
      order: plan?.order ?? 0,
      stripePriceId: plan?.stripePriceId ?? '',
      stripeProductId: plan?.stripeProductId ?? '',
      active: plan?.active ?? true,
      isFeatured: plan?.isFeatured ?? false,
    },
  });

  const onNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!isEdit) {
      const currentSlug = (document.getElementById('slug') as HTMLInputElement | null)?.value;
      if (!currentSlug) {
        setValue('slug', slugify(e.target.value));
      }
    }
  };

  const onSubmit = async (values: PlanFormValues) => {
    const toastId = toast.loading(isEdit ? 'Plan güncelleniyor...' : 'Plan oluşturuluyor...');
    try {
      const apiRaw = values.apiRequestsPerMonth.trim();
      const marketingFeatures = values.marketingText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      const payload = {
        slug: values.slug,
        name: values.name,
        description: values.description.trim() || null,
        interval: values.interval,
        priceCents: Math.round(Number(values.priceTl) * 100),
        currency: values.currency || 'try',
        marketingFeatures,
        apiRequestsPerMonth: apiRaw === '' ? null : Number(apiRaw),
        trialDays: Number(values.trialDays),
        order: Number(values.order),
        stripePriceId: values.stripePriceId.trim() || null,
        stripeProductId: values.stripeProductId.trim() || null,
        active: values.active,
        isFeatured: values.isFeatured,
      };

      const res = await fetch(isEdit ? `/api/admin/plans/${plan!.id}` : '/api/admin/plans', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error?.message || 'Kayıt başarısız');
      }

      toast.success(isEdit ? 'Plan güncellendi' : 'Plan oluşturuldu', { id: toastId });
      router.push('/admin/plans');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu', { id: toastId });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="admin-form-grid">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Plan adı
          </label>
          <input
            id="name"
            className="admin-input"
            placeholder="Pro"
            {...register('name', { required: 'Ad zorunlu', minLength: 2 })}
            onBlur={onNameBlur}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium mb-2">
            Slug
          </label>
          <input
            id="slug"
            className="admin-input font-mono"
            placeholder="pro"
            {...register('slug', {
              required: 'Slug zorunlu',
              pattern: { value: /^[a-z0-9-]+$/, message: 'sadece a-z, 0-9, tire' },
            })}
          />
          {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>}
          <p className="mt-1 text-xs text-muted-foreground">
            Checkout: <code>/odeme/plan?slug=...</code>
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          Kısa açıklama
        </label>
        <textarea
          id="description"
          rows={2}
          className="admin-input"
          {...register('description')}
        />
      </div>

      <div className="admin-form-grid">
        <div>
          <label htmlFor="priceTl" className="block text-sm font-medium mb-2">
            Fiyat (TL)
          </label>
          <input
            id="priceTl"
            type="number"
            step="0.01"
            min={0}
            className="admin-input"
            {...register('priceTl', { valueAsNumber: true, min: 0 })}
          />
        </div>
        <div>
          <label htmlFor="interval" className="block text-sm font-medium mb-2">
            Periyot
          </label>
          <select id="interval" className="admin-input" {...register('interval')}>
            <option value="MONTH">Aylık</option>
            <option value="YEAR">Yıllık</option>
            <option value="WEEK">Haftalık</option>
            <option value="DAY">Günlük</option>
          </select>
        </div>
        <div>
          <label htmlFor="trialDays" className="block text-sm font-medium mb-2">
            Deneme (gün)
          </label>
          <input
            id="trialDays"
            type="number"
            min={0}
            className="admin-input"
            {...register('trialDays', { valueAsNumber: true })}
          />
        </div>
        <div>
          <label htmlFor="order" className="block text-sm font-medium mb-2">
            Sıra
          </label>
          <input
            id="order"
            type="number"
            className="admin-input"
            {...register('order', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="admin-form-grid">
        <div>
          <label htmlFor="apiRequestsPerMonth" className="block text-sm font-medium mb-2">
            Aylık API isteği kotası
          </label>
          <input
            id="apiRequestsPerMonth"
            type="number"
            min={0}
            className="admin-input"
            placeholder="Örn. 10000 — boş = kota yok"
            {...register('apiRequestsPerMonth')}
          />
        </div>
        <div>
          <label htmlFor="currency" className="block text-sm font-medium mb-2">
            Para birimi
          </label>
          <input
            id="currency"
            className="admin-input"
            maxLength={3}
            {...register('currency')}
          />
        </div>
      </div>

      <div>
        <label htmlFor="marketingText" className="block text-sm font-medium mb-2">
          Vitrin özellikleri (her satır bir madde)
        </label>
        <textarea
          id="marketingText"
          rows={5}
          className="admin-input font-mono text-sm"
          placeholder={'10.000 API isteği / ay\nÖncelikli destek'}
          {...register('marketingText')}
        />
      </div>

      <details className="rounded-lg border border-border/60 p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Gelişmiş: Stripe kimlikleri (opsiyonel)
        </summary>
        <p className="mt-2 mb-3 text-xs text-muted-foreground">
          Boş bırakılırsa sistem yerel placeholder üretir (PayTR birincil ödeme için yeterli).
        </p>
        <div className="admin-form-grid">
          <div>
            <label htmlFor="stripePriceId" className="block text-sm font-medium mb-2">
              stripePriceId
            </label>
            <input
              id="stripePriceId"
              className="admin-input font-mono text-sm"
              {...register('stripePriceId')}
            />
          </div>
          <div>
            <label htmlFor="stripeProductId" className="block text-sm font-medium mb-2">
              stripeProductId
            </label>
            <input
              id="stripeProductId"
              className="admin-input font-mono text-sm"
              {...register('stripeProductId')}
            />
          </div>
        </div>
      </details>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="h-4 w-4 rounded" {...register('active')} />
          <span className="text-sm font-medium">Plan aktif (vitrinde görünür)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="h-4 w-4 rounded" {...register('isFeatured')} />
          <span className="text-sm font-medium">Öne çıkan</span>
        </label>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button type="submit" disabled={isSubmitting} className="admin-btn admin-btn-primary">
          {isSubmitting ? 'Kaydediliyor...' : isEdit ? 'Değişiklikleri Kaydet' : 'Plan Oluştur'}
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() => router.push('/admin/plans')}
        >
          İptal
        </button>
      </div>
    </form>
  );
}

/**
 * @file Admin kupon formu — oluşturma ve düzenleme.
 */

'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import type { Coupon, DiscountType } from '@prisma/client';

type CouponFormValues = {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  /** TL cinsinden gösterim — gönderirken *100 */
  minOrderTl: number;
  maxDiscountTl: string;
  maxUses: string;
  maxUsesPerUser: number;
  startsAt: string;
  expiresAt: string;
  active: boolean;
};

function toDateInput(value: Date | string | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

interface CouponFormProps {
  coupon?: Coupon;
}

export default function CouponForm({ coupon }: CouponFormProps) {
  const router = useRouter();
  const isEdit = Boolean(coupon);

  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<CouponFormValues>({
    defaultValues: {
      code: coupon?.code ?? '',
      description: coupon?.description ?? '',
      discountType: coupon?.discountType ?? 'PERCENTAGE',
      discountValue: coupon?.discountValue ?? 10,
      minOrderTl: coupon ? coupon.minOrderCents / 100 : 0,
      maxDiscountTl:
        coupon?.maxDiscountCents != null ? String(coupon.maxDiscountCents / 100) : '',
      maxUses: coupon?.maxUses != null ? String(coupon.maxUses) : '',
      maxUsesPerUser: coupon?.maxUsesPerUser ?? 1,
      startsAt: toDateInput(coupon?.startsAt),
      expiresAt: toDateInput(coupon?.expiresAt),
      active: coupon?.active ?? true,
    },
  });

  const discountType = watch('discountType');

  const onSubmit = async (values: CouponFormValues) => {
    const toastId = toast.loading(isEdit ? 'Kupon güncelleniyor...' : 'Kupon oluşturuluyor...');
    try {
      const maxDiscountTl = values.maxDiscountTl.trim();
      const maxUses = values.maxUses.trim();

      const payload = {
        code: values.code,
        description: values.description.trim() || null,
        discountType: values.discountType,
        discountValue: Number(values.discountValue),
        minOrderCents: Math.round(Number(values.minOrderTl) * 100),
        maxDiscountCents: maxDiscountTl === '' ? null : Math.round(Number(maxDiscountTl) * 100),
        maxUses: maxUses === '' ? null : Number(maxUses),
        maxUsesPerUser: Number(values.maxUsesPerUser),
        startsAt: values.startsAt || null,
        expiresAt: values.expiresAt || null,
        active: values.active,
      };

      const res = await fetch(
        isEdit ? `/api/admin/coupons/${coupon!.id}` : '/api/admin/coupons',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error?.message || 'Kayıt başarısız');
      }

      toast.success(isEdit ? 'Kupon güncellendi' : 'Kupon oluşturuldu', { id: toastId });
      router.push('/admin/coupons');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu', { id: toastId });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="admin-form-grid">
        <div>
          <label htmlFor="code" className="block text-sm font-medium mb-2">
            Kupon kodu
          </label>
          <input
            id="code"
            className="admin-input font-mono uppercase"
            placeholder="HOSGELDIN20"
            {...register('code', {
              required: 'Kod zorunlu',
              minLength: { value: 2, message: 'En az 2 karakter' },
            })}
          />
          {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>}
        </div>
        <div>
          <label htmlFor="discountType" className="block text-sm font-medium mb-2">
            İndirim tipi
          </label>
          <select id="discountType" className="admin-input" {...register('discountType')}>
            <option value="PERCENTAGE">Yüzde (%)</option>
            <option value="FIXED_AMOUNT">Sabit tutar (kuruş)</option>
          </select>
        </div>
      </div>

      <div className="admin-form-grid">
        <div>
          <label htmlFor="discountValue" className="block text-sm font-medium mb-2">
            {discountType === 'PERCENTAGE' ? 'İndirim yüzdesi' : 'İndirim (kuruş)'}
          </label>
          <input
            id="discountValue"
            type="number"
            className="admin-input"
            min={1}
            max={discountType === 'PERCENTAGE' ? 100 : undefined}
            {...register('discountValue', {
              required: 'Değer zorunlu',
              valueAsNumber: true,
              min: { value: 1, message: 'En az 1' },
            })}
          />
          {errors.discountValue && (
            <p className="text-red-500 text-sm mt-1">{errors.discountValue.message}</p>
          )}
          {discountType === 'FIXED_AMOUNT' && (
            <p className="mt-1 text-xs text-muted-foreground">
              Örn. 5000 = 50,00 TL
            </p>
          )}
        </div>
        <div>
          <label htmlFor="minOrderTl" className="block text-sm font-medium mb-2">
            Minimum sepet (TL)
          </label>
          <input
            id="minOrderTl"
            type="number"
            step="0.01"
            min={0}
            className="admin-input"
            {...register('minOrderTl', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          Açıklama
        </label>
        <textarea
          id="description"
          rows={2}
          className="admin-input"
          placeholder="Kampanya notu (opsiyonel)"
          {...register('description')}
        />
      </div>

      <div className="admin-form-grid">
        <div>
          <label htmlFor="maxDiscountTl" className="block text-sm font-medium mb-2">
            Maks. indirim tavanı (TL)
          </label>
          <input
            id="maxDiscountTl"
            type="number"
            step="0.01"
            min={0}
            className="admin-input"
            placeholder="Boş = sınırsız"
            {...register('maxDiscountTl')}
          />
        </div>
        <div>
          <label htmlFor="maxUses" className="block text-sm font-medium mb-2">
            Toplam kullanım limiti
          </label>
          <input
            id="maxUses"
            type="number"
            min={1}
            className="admin-input"
            placeholder="Boş = sınırsız"
            {...register('maxUses')}
          />
        </div>
        <div>
          <label htmlFor="maxUsesPerUser" className="block text-sm font-medium mb-2">
            Kullanıcı başına limit
          </label>
          <input
            id="maxUsesPerUser"
            type="number"
            min={1}
            className="admin-input"
            {...register('maxUsesPerUser', { valueAsNumber: true, min: 1 })}
          />
        </div>
      </div>

      <div className="admin-form-grid">
        <div>
          <label htmlFor="startsAt" className="block text-sm font-medium mb-2">
            Başlangıç
          </label>
          <input id="startsAt" type="date" className="admin-input" {...register('startsAt')} />
        </div>
        <div>
          <label htmlFor="expiresAt" className="block text-sm font-medium mb-2">
            Bitiş
          </label>
          <input id="expiresAt" type="date" className="admin-input" {...register('expiresAt')} />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" className="h-4 w-4 rounded" {...register('active')} />
        <span className="text-sm font-medium">Kupon aktif</span>
      </label>

      <div className="flex flex-wrap gap-3 pt-2">
        <button type="submit" disabled={isSubmitting} className="admin-btn admin-btn-primary">
          {isSubmitting ? 'Kaydediliyor...' : isEdit ? 'Değişiklikleri Kaydet' : 'Kupon Oluştur'}
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() => router.push('/admin/coupons')}
        >
          İptal
        </button>
      </div>
    </form>
  );
}

/**
 * CouponForm — Admin paneli yeni kupon oluşturma formu.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export function CouponForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    discountValue: '',
    minOrderTl: '',
    maxDiscountTl: '',
    maxUses: '',
    maxUsesPerUser: '1',
    startsAt: '',
    expiresAt: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const discountValue =
      form.discountType === 'PERCENTAGE'
        ? Math.round(Number(form.discountValue))
        : Math.round(Number(form.discountValue) * 100);

    if (!discountValue || discountValue <= 0) {
      toast.error('Geçerli bir indirim değeri girin');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          description: form.description || undefined,
          discountType: form.discountType,
          discountValue,
          minOrderCents: form.minOrderTl
            ? Math.round(parseFloat(form.minOrderTl) * 100)
            : undefined,
          maxDiscountCents: form.maxDiscountTl
            ? Math.round(parseFloat(form.maxDiscountTl) * 100)
            : null,
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          maxUsesPerUser: Number(form.maxUsesPerUser) || 1,
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? 'Kupon oluşturulamadı');
      toast.success('Kupon oluşturuldu');
      router.push('/admin/coupons');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card-premium p-6 space-y-4 max-w-xl">
      <div>
        <label className="block text-sm font-medium mb-1">Kupon kodu *</label>
        <input
          required
          minLength={3}
          value={form.code}
          onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 font-mono"
          placeholder="YAZINDIRIM20"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Açıklama</label>
        <input
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">İndirim tipi</label>
          <select
            value={form.discountType}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                discountType: e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT',
              }))
            }
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          >
            <option value="PERCENTAGE">Yüzde (%)</option>
            <option value="FIXED_AMOUNT">Sabit tutar (TL)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {form.discountType === 'PERCENTAGE' ? 'İndirim %' : 'İndirim (TL)'} *
          </label>
          <input
            required
            type="number"
            min="1"
            step={form.discountType === 'PERCENTAGE' ? '1' : '0.01'}
            value={form.discountValue}
            onChange={(e) => setForm((p) => ({ ...p, discountValue: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Min. sipariş (TL)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.minOrderTl}
            onChange={(e) => setForm((p) => ({ ...p, minOrderTl: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Max indirim (TL)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.maxDiscountTl}
            onChange={(e) => setForm((p) => ({ ...p, maxDiscountTl: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Toplam kullanım limiti</label>
          <input
            type="number"
            min="1"
            value={form.maxUses}
            onChange={(e) => setForm((p) => ({ ...p, maxUses: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            placeholder="Sınırsız"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Kullanıcı başına limit</label>
          <input
            type="number"
            min="1"
            value={form.maxUsesPerUser}
            onChange={(e) => setForm((p) => ({ ...p, maxUsesPerUser: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Başlangıç</label>
          <input
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Bitiş</label>
          <input
            type="datetime-local"
            value={form.expiresAt}
            onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl text-sm font-bold bg-brand-primary text-white disabled:opacity-50"
        >
          {loading ? 'Oluşturuluyor...' : 'Kupon Oluştur'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/coupons')}
          className="px-5 py-2.5 rounded-xl text-sm border border-gray-300 dark:border-gray-600"
        >
          İptal
        </button>
      </div>
    </form>
  );
}

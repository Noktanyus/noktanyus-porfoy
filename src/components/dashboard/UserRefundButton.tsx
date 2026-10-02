'use client';

/**
 * @file UserRefundButton.tsx — Kullanıcı 1 Günlük İade Butonu ve Modalı
 * @description Satın alımdan sonraki ilk 24 saat içinde hiçbir hak kullanılmamışsa
 *              kullanıcının anında PayTR iadesi başlatabilmesini sağlar.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  FaUndo,
  FaShieldAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaSpinner,
} from 'react-icons/fa';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import type { RefundEligibilityResult } from '@/modules/commerce/refundEligibility';

interface UserRefundButtonProps {
  orderId: string;
  orderNumber: string;
  orderDate: Date | string;
  status: string;
  totalCents: number;
  currency?: string;
  isSubscriptionOrCredit: boolean;
}

export function UserRefundButton({
  orderId,
  orderNumber,
  orderDate,
  status,
  totalCents,
  currency = 'try',
  isSubscriptionOrCredit,
}: UserRefundButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingEligibility, setIsLoadingEligibility] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eligibility, setEligibility] = useState<RefundEligibilityResult | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  // Sadece PAID durumundaki kredi veya abonelik siparişleri için geçerlidir
  if (status !== 'PAID' && status !== 'FULFILLED') {
    return null;
  }
  if (!isSubscriptionOrCredit) {
    return null;
  }

  // 24 saat kontrolü
  const purchaseTime = new Date(orderDate).getTime();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - purchaseTime;
  if (elapsed > ONE_DAY_MS) {
    return null;
  }

  const hoursRemaining = Math.max(
    0,
    Math.round(((ONE_DAY_MS - elapsed) / (60 * 60 * 1000)) * 10) / 10
  );

  const handleOpen = async () => {
    setIsOpen(true);
    setIsLoadingEligibility(true);
    setFetchError(null);

    try {
      const res = await fetch(`/api/user/orders/${orderId}/refund`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Uygunluk kontrolü yapılamadı');
      }
      setEligibility(data.data.eligibility);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setIsLoadingEligibility(false);
    }
  };

  const handleConfirmRefund = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/user/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'İade işlemi başlatılamadı');
      }

      toast.success(
        data.data?.message ||
          'İade talebiniz başarıyla tamamlandı. Ödemeniz PayTR üzerinden kartınıza iade edildi.'
      );
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'İade işlemi başarısız oldu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-all active:scale-95 shadow-sm"
        title="1 gün içinde ve hak kullanılmamışsa anında iade edebilirsiniz."
      >
        <FaShieldAlt className="text-amber-500" />
        <span>İade Talep Et ({hoursRemaining}s kaldı)</span>
      </button>

      <Modal
        open={isOpen}
        onClose={() => !isSubmitting && setIsOpen(false)}
        title="1 Günlük Koşulsuz İade Garantisi"
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-muted/40 p-4 text-xs space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Sipariş Numarası:</span>
              <span className="font-mono font-bold text-foreground">{orderNumber}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>İade Edilecek Tutar:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalCents, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Kalan İade Süresi:</span>
              <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                <FaClock className="text-[10px]" />
                <span>{hoursRemaining} saat</span>
              </span>
            </div>
          </div>

          {isLoadingEligibility && (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <FaSpinner className="animate-spin text-2xl text-brand-primary" />
              <p className="text-xs">Kullanım hakları ve iade kriterleri kontrol ediliyor...</p>
            </div>
          )}

          {!isLoadingEligibility && fetchError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
              <FaExclamationTriangle className="text-base shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Kontrol Başarısız Oldu</p>
                <p className="mt-1">{fetchError}</p>
              </div>
            </div>
          )}

          {!isLoadingEligibility && eligibility && (
            <>
              {eligibility.eligible ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2.5">
                    <FaCheckCircle className="text-base text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm">İade Hakkınız Bulunmaktadır</p>
                      <p className="mt-1 leading-relaxed">
                        Satın alma işleminizden sonra herhangi bir API kredisi veya abonelik kotası
                        tüketilmediği için 24 saatlik koşulsuz iade hakkınız geçerlidir.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="refund-reason"
                      className="text-xs font-medium text-muted-foreground block"
                    >
                      İade Nedeni (İsteğe Bağlı)
                    </label>
                    <textarea
                      id="refund-reason"
                      rows={2}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Geri bildiriminiz bizim için değerlidir..."
                      className="w-full rounded-lg border border-border/80 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                  </div>

                  <div className="rounded-lg bg-muted/60 p-3 text-[11px] text-muted-foreground leading-relaxed">
                    <strong>Bilgilendirme:</strong> İadeyi başlattığınızda ödeme PayTR üzerinden
                    satın aldığınız kartınıza otomatik olarak iade edilecek ve pakete ait haklar
                    geri çekilecektir.
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      disabled={isSubmitting}
                      className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmRefund}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <FaSpinner className="animate-spin text-xs" />
                          <span>İade Ediliyor...</span>
                        </>
                      ) : (
                        <>
                          <FaUndo className="text-xs" />
                          <span>İadeyi Onayla ve Başlat</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
                    <FaExclamationTriangle className="text-base text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm">İade Talebi Uygun Değil</p>
                      <p className="mt-1 leading-relaxed">
                        {eligibility.reason ||
                          'Bu sipariş için 1 günlük kullanılmamış hak iade şartı sağlanamamaktadır.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="rounded-lg bg-muted px-4 py-2 text-xs font-semibold hover:bg-muted/80 transition-colors"
                    >
                      Kapat
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </>
  );
}

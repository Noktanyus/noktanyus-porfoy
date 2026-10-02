/**
 * @file OrderDetailActions.tsx — Admin Sipariş Detay Aksiyonları
 * @description İade başlatma (PayTR), durum değiştirme ve sipariş notu yönetimi.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaUndo, FaSave, FaBan, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { formatCurrency } from '@/lib/utils';

interface OrderDetailActionsProps {
  orderId: string;
  orderNumber: string;
  status: string;
  totalCents: number;
  currency: string;
  initialNotes?: string | null;
  refundedAt?: Date | string | null;
  refundReason?: string | null;
  metadata?: unknown;
}

export function OrderDetailActions({
  orderId,
  orderNumber,
  status,
  totalCents,
  currency,
  initialNotes = '',
  refundedAt,
  refundReason,
  metadata,
}: OrderDetailActionsProps) {
  const router = useRouter();

  // Notes state
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Status update state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Refund modal state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [partialAmountTl, setPartialAmountTl] = useState('');
  const [refundReasonInput, setRefundReasonInput] = useState('');

  const canRefund = status === 'PAID' || status === 'PARTIALLY_REFUNDED';
  const isPending = status === 'PENDING';

  // Not Kaydet
  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    const toastId = toast.loading('Not kaydediliyor...');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Not kaydedilemedi');
      }
      toast.success('Sipariş notu başarıyla güncellendi', { id: toastId });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu', { id: toastId });
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Durum Değiştir
  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Sipariş durumunu "${newStatus}" olarak güncellemek istediğinize emin misiniz?`)) {
      return;
    }
    setIsUpdatingStatus(true);
    const toastId = toast.loading('Durum güncelleniyor...');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Durum güncellenemedi');
      }
      toast.success('Sipariş durumu güncellendi', { id: toastId });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu', { id: toastId });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // İade Gönder
  const handleExecuteRefund = async () => {
    let amountCents: number | undefined;
    if (refundType === 'partial') {
      const parsedTl = parseFloat(partialAmountTl);
      if (isNaN(parsedTl) || parsedTl <= 0) {
        toast.error('Lütfen geçerli bir iade tutarı girin');
        return;
      }
      amountCents = Math.round(parsedTl * 100);
      if (amountCents > totalCents) {
        toast.error('İade tutarı sipariş toplamından büyük olamaz');
        return;
      }
    }

    if (!confirm(`Bu sipariş için ${refundType === 'full' ? 'TAM İADE' : `${partialAmountTl} TL kısmi iade`} yapılacak ve ilişkili lisanslar iptal edilecektir. Onaylıyor musunuz?`)) {
      return;
    }

    setIsSubmittingRefund(true);
    const toastId = toast.loading('PayTR üzerinden iade işlemi yürütülüyor...');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCents,
          reason: refundReasonInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'İade işlemi başarısız');
      }
      toast.success('İade başarıyla tamamlandı (PayTR)', { id: toastId });
      setShowRefundModal(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'İade gerçekleştirilemedi', { id: toastId });
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* İade Geçmişi Bilgisi */}
      {(status === 'REFUNDED' || status === 'PARTIALLY_REFUNDED' || refundedAt) && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-foreground">
          <div className="flex items-center gap-2 font-semibold text-blue-600 dark:text-blue-400">
            <FaUndo />
            <span>İade Bilgisi</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {refundedAt ? `İade Tarihi: ${new Date(refundedAt).toLocaleString('tr-TR')}` : 'İade kaydı mevcut'}
            {refundReason ? ` — Neden: ${refundReason}` : ''}
          </p>
          {Boolean((metadata as Record<string, any>)?.refundId) && (
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              İade Referans No: {String((metadata as Record<string, any>).refundId)}
            </p>
          )}
        </div>
      )}

      {/* Aksiyon Butonları */}
      <div className="flex flex-wrap items-center gap-3">
        {canRefund && (
          <button
            type="button"
            onClick={() => setShowRefundModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-95 disabled:opacity-50"
          >
            <FaUndo className="text-sm" />
            <span>PayTR ile İade Yap</span>
          </button>
        )}

        {isPending && (
          <>
            <button
              type="button"
              disabled={isUpdatingStatus}
              onClick={() => handleStatusChange('PAID')}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-green-700 active:scale-95 disabled:opacity-50"
            >
              <FaCheck className="text-sm" />
              <span>Manuel Olarak Ödendi İşaretle</span>
            </button>
            <button
              type="button"
              disabled={isUpdatingStatus}
              onClick={() => handleStatusChange('CANCELED')}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 transition hover:bg-red-500/20 active:scale-95 disabled:opacity-50"
            >
              <FaBan className="text-sm" />
              <span>Siparişi İptal Et</span>
            </button>
          </>
        )}

        {status === 'PAID' && (
          <button
            type="button"
            disabled={isUpdatingStatus}
            onClick={() => handleStatusChange('FULFILLED')}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted active:scale-95 disabled:opacity-50"
          >
            <FaCheck className="text-green-600" />
            <span>Tamamlandı Olarak İşaretle</span>
          </button>
        )}
      </div>

      {/* Admin Notları Paneli */}
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <label htmlFor="admin-order-notes" className="block text-sm font-semibold text-foreground mb-1">
          Dahili Sipariş Notları
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          Yalnızca yöneticiler tarafından görülebilir. Müşteriye iletilmez.
        </p>
        <textarea
          id="admin-order-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Müşteri talepleri, teslimat detayları veya destek notu..."
          className="admin-input w-full text-xs font-normal"
        />
        <div className="mt-2.5 flex justify-end">
          <button
            type="button"
            disabled={isSavingNotes || notes === (initialNotes ?? '')}
            onClick={handleSaveNotes}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-primary/90 disabled:opacity-40"
          >
            <FaSave />
            <span>{isSavingNotes ? 'Kaydediliyor...' : 'Notu Kaydet'}</span>
          </button>
        </div>
      </div>

      {/* İade Modalı */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
              <FaExclamationTriangle className="text-xl" />
              <h3 className="text-lg font-bold text-foreground">Sipariş İadesi (PayTR)</h3>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {orderNumber} numaralı sipariş için PayTR İade API&apos;sine iade isteği gönderilecektir. İade sonrası siparişe bağlı lisanslar otomatik iptal edilir.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground">İade Tipi</label>
                <div className="mt-1 flex gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="refundType"
                      checked={refundType === 'full'}
                      onChange={() => setRefundType('full')}
                    />
                    <span>Tam İade ({formatCurrency(totalCents, currency)})</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="refundType"
                      checked={refundType === 'partial'}
                      onChange={() => setRefundType('partial')}
                    />
                    <span>Kısmi İade</span>
                  </label>
                </div>
              </div>

              {refundType === 'partial' && (
                <div>
                  <label htmlFor="partialAmount" className="text-xs font-semibold text-foreground">
                    İade Edilecek Tutar (TL)
                  </label>
                  <input
                    id="partialAmount"
                    type="number"
                    step="0.01"
                    min="1"
                    max={totalCents / 100}
                    value={partialAmountTl}
                    onChange={(e) => setPartialAmountTl(e.target.value)}
                    placeholder="Örn: 250"
                    className="admin-input mt-1 w-full text-xs"
                  />
                </div>
              )}

              <div>
                <label htmlFor="refundReason" className="text-xs font-semibold text-foreground">
                  İade Nedeni (Opsiyonel)
                </label>
                <input
                  id="refundReason"
                  type="text"
                  maxLength={500}
                  value={refundReasonInput}
                  onChange={(e) => setRefundReasonInput(e.target.value)}
                  placeholder="Müşteri talebi, iptal, hatalı çekim vb."
                  className="admin-input mt-1 w-full text-xs"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={isSubmittingRefund}
                onClick={() => setShowRefundModal(false)}
                className="rounded-lg border border-border bg-muted/50 px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={isSubmittingRefund}
                onClick={handleExecuteRefund}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-red-700 disabled:opacity-50"
              >
                <FaUndo />
                <span>{isSubmittingRefund ? 'İade Ediliyor...' : 'İadeyi Onayla'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

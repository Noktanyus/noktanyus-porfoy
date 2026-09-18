'use client';

/**
 * UserLimitModal — Admin kullanıcının özel API kotasını (Enterprise / Custom Limit)
 * ve kredi bakiyesini yönetir.
 * 
 * İşlemler:
 * - Üstüne Ekle (ADD): Mevcut limit bitmeden ek kota tanımlama
 * - Limiti Düzenle (SET): Yeni özel limit ve son geçerlilik tarihi belirleme
 * - Limiti Kes (REVOKE): Özel kotayı anında iptal etme / standart plana döndürme
 * - Süresini Doldur (EXPIRE): Limit geçerlilik tarihini sonlandırarak pasifleştirme
 * - Kredi Yükleme / Güncelleme (CREDITS)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { FaSlidersH, FaPlusCircle, FaEdit, FaBan, FaHourglassEnd, FaCoins } from 'react-icons/fa';

export interface UserLimitData {
  id: string;
  email: string;
  name: string | null;
  apiCreditBalance?: number;
  customApiMonthlyLimit?: number | null;
  customApiLimitExpiresAt?: Date | string | null;
  customApiLimitNotes?: string | null;
}

interface UserLimitModalProps {
  user: UserLimitData;
  open: boolean;
  onClose: () => void;
}

type TabKey = 'add' | 'set' | 'credits' | 'danger';

export function UserLimitModal({ user, open, onClose }: UserLimitModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('add');
  const [loading, setLoading] = useState(false);

  // Form states
  const [addAmount, setAddAmount] = useState<string>('5000');
  const [newLimit, setNewLimit] = useState<string>(
    user.customApiMonthlyLimit !== null && user.customApiMonthlyLimit !== undefined
      ? String(user.customApiMonthlyLimit)
      : '25000'
  );
  const [expiresAt, setExpiresAt] = useState<string>(
    user.customApiLimitExpiresAt
      ? new Date(user.customApiLimitExpiresAt).toISOString().split('T')[0]
      : ''
  );
  const [notes, setNotes] = useState<string>(user.customApiLimitNotes || '');

  // Credits state
  const [creditMode, setCreditMode] = useState<'add' | 'set'>('add');
  const [creditAmount, setCreditAmount] = useState<string>('1000');

  const isExpired = user.customApiLimitExpiresAt
    ? new Date(user.customApiLimitExpiresAt).getTime() < Date.now()
    : false;

  const handleAction = async (actionType: 'add' | 'set' | 'revoke' | 'expire' | 'credits') => {
    if (loading) return;

    let payload: Record<string, unknown> = {};

    if (actionType === 'add') {
      const num = parseInt(addAmount, 10);
      if (isNaN(num) || num <= 0) {
        toast.error('Lütfen geçerli bir ek limit miktarı girin.');
        return;
      }
      payload = {
        action: 'add',
        additionalLimit: num,
        customApiLimitExpiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        customApiLimitNotes: notes || undefined,
      };
    } else if (actionType === 'set') {
      const num = parseInt(newLimit, 10);
      if (isNaN(num) || num < 0) {
        toast.error('Lütfen geçerli bir limit miktarı girin.');
        return;
      }
      payload = {
        action: 'set',
        customApiMonthlyLimit: num,
        customApiLimitExpiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        customApiLimitNotes: notes || undefined,
      };
    } else if (actionType === 'revoke') {
      if (!confirm(`${user.email} kullanıcısının özel kotasını kesmek ve kaldırmak istediğinize emin misiniz?`)) {
        return;
      }
      payload = {
        action: 'revoke',
        customApiLimitNotes: notes || 'Admin tarafından özel limit kesildi',
      };
    } else if (actionType === 'expire') {
      if (!confirm(`${user.email} kullanıcısının limit süresini anında doldurup pasifleştirmek istediğinize emin misiniz?`)) {
        return;
      }
      payload = {
        action: 'expire',
        customApiLimitNotes: notes || 'Admin tarafından limit süresi dolduruldu',
      };
    } else if (actionType === 'credits') {
      const num = parseInt(creditAmount, 10);
      if (isNaN(num)) {
        toast.error('Lütfen geçerli bir kredi miktarı girin.');
        return;
      }
      if (creditMode === 'add') {
        if (num <= 0) {
          toast.error('Eklenecek kredi miktarı pozitif olmalıdır.');
          return;
        }
        payload = {
          addCredits: num,
          customApiLimitNotes: notes || `Admin tarafından +${num} kredi yüklendi`,
        };
      } else {
        if (num < 0) {
          toast.error('Kredi bakiyesi negatif olamaz.');
          return;
        }
        payload = {
          apiCreditBalance: num,
          customApiLimitNotes: notes || `Admin tarafından kredi bakiyesi ${num} olarak ayarlandı`,
        };
      }
    }

    setLoading(true);
    const toastId = toast.loading('İşlem yapılıyor...');

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error?.message || 'İşlem başarısız');
      }

      toast.success('Kullanıcı limiti başarıyla güncellendi', { id: toastId });
      router.refresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bir hata oluştu', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Kullanıcı API Kotası & Kredi Yönetimi"
      description={`${user.name || user.email} için özel limit ve bakiye tanımları.`}
      size="lg"
    >
      <div className="space-y-6 pt-2">
        {/* Kullanıcı Özeti & Mevcut Durum Kartı */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div>
              <span className="text-xs text-muted-foreground uppercase font-semibold">Kullanıcı</span>
              <p className="text-sm font-medium text-foreground">{user.name || 'İsimsiz'} ({user.email})</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Mevcut Kredi</span>
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {(user.apiCreditBalance ?? 0).toLocaleString('tr-TR')} Kredi
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">Özel Aylık Kota:</span>
              <p className="font-semibold text-foreground">
                {user.customApiMonthlyLimit !== null && user.customApiMonthlyLimit !== undefined
                  ? `${user.customApiMonthlyLimit.toLocaleString('tr-TR')} istek / ay`
                  : 'Tanımlanmamış (Standart Plan Kotası)'}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Geçerlilik Durumu:</span>
              <p className="font-semibold">
                {user.customApiLimitExpiresAt ? (
                  isExpired ? (
                    <span className="text-rose-600 dark:text-rose-400">
                      Süresi Doldu ({new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(user.customApiLimitExpiresAt))})
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Aktif ({new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(user.customApiLimitExpiresAt))} kadar)
                    </span>
                  )
                ) : user.customApiMonthlyLimit ? (
                  <span className="text-blue-600 dark:text-blue-400">Süresiz Özel Limit</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </p>
            </div>
          </div>

          {user.customApiLimitNotes && (
            <div className="text-xs text-muted-foreground border-t border-border/40 pt-2">
              <span className="font-semibold text-foreground">Not:</span> {user.customApiLimitNotes}
            </div>
          )}
        </div>

        {/* Tab Butonları */}
        <div className="flex border-b border-border gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'add'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FaPlusCircle className="w-4 h-4" />
            Üstüne Ekle
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('set')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'set'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FaEdit className="w-4 h-4" />
            Limiti Düzenle
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('credits')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'credits'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FaCoins className="w-4 h-4" />
            Kredi Yönetimi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('danger')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'danger'
                ? 'border-rose-500 text-rose-500'
                : 'border-transparent text-muted-foreground hover:text-rose-500'
            }`}
          >
            <FaBan className="w-4 h-4" />
            Kes / Süre Bitir
          </button>
        </div>

        {/* TAB 1: Üstüne Ekle (ADD) */}
        {activeTab === 'add' && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-lg text-xs text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
              Kullanıcının mevcut kotası henüz bitmeden üzerine anında ek istek tanımlayın. 
              Örneğin mevcut kotası 10.000 iken +5.000 eklendiğinde yeni kotası 15.000 olur.
            </div>

            <div>
              <label htmlFor="add-amount" className="block text-sm font-medium text-foreground mb-1">
                Eklenecek İstek Sayısı (+)
              </label>
              <input
                id="add-amount"
                type="number"
                min="1"
                step="1000"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="örn: 5000"
                className="w-full min-h-[44px] rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label htmlFor="add-expires" className="block text-sm font-medium text-foreground mb-1">
                Son Geçerlilik Tarihi (Opsiyonel)
              </label>
              <input
                id="add-expires"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label htmlFor="add-notes" className="block text-sm font-medium text-foreground mb-1">
                Açıklama / Not
              </label>
              <input
                id="add-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="örn: Destek görüşmesi kapsamında +5.000 hediye kota"
                className="w-full min-h-[44px] rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="admin-btn admin-btn-secondary min-h-[42px]"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => handleAction('add')}
                disabled={loading}
                className="admin-btn admin-btn-primary min-h-[42px]"
              >
                {loading ? 'İşleniyor...' : 'Kota Ekle (+)'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Limiti Düzenle (SET) */}
        {activeTab === 'set' && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/30 rounded-lg text-xs text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50">
              Kullanıcının aylık özel API kotasını doğrudan istediğiniz sayıya ayarlayın veya güncelleyin.
            </div>

            <div>
              <label htmlFor="set-limit" className="block text-sm font-medium text-foreground mb-1">
                Yeni Özel Aylık Kota (İstek/Ay)
              </label>
              <input
                id="set-limit"
                type="number"
                min="0"
                step="1000"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                placeholder="örn: 50000"
                className="w-full min-h-[44px] rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label htmlFor="set-expires" className="block text-sm font-medium text-foreground mb-1">
                Son Geçerlilik Tarihi (Boş bırakılırsa süresiz olur)
              </label>
              <input
                id="set-expires"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label htmlFor="set-notes" className="block text-sm font-medium text-foreground mb-1">
                Açıklama / Müşteri Notu
              </label>
              <input
                id="set-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="örn: Yıllık Enterprise Sözleşmesi kapsamında özel kota"
                className="w-full min-h-[44px] rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="admin-btn admin-btn-secondary min-h-[42px]"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => handleAction('set')}
                disabled={loading}
                className="admin-btn admin-btn-primary min-h-[42px]"
              >
                {loading ? 'İşleniyor...' : 'Limiti Kaydet'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: Kredi Yönetimi */}
        {activeTab === 'credits' && (
          <div className="space-y-4">
            <div className="flex gap-4 border-b border-border/60 pb-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="creditMode"
                  checked={creditMode === 'add'}
                  onChange={() => setCreditMode('add')}
                />
                <span>Kredi Ekle (+)</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="creditMode"
                  checked={creditMode === 'set'}
                  onChange={() => setCreditMode('set')}
                />
                <span>Bakiyeyi Doğrudan Belirle</span>
              </label>
            </div>

            <div>
              <label htmlFor="credit-amount" className="block text-sm font-medium text-foreground mb-1">
                {creditMode === 'add' ? 'Eklenecek Kredi Adedi' : 'Yeni Kredi Bakiyesi'}
              </label>
              <input
                id="credit-amount"
                type="number"
                min="0"
                step="500"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="örn: 2500"
                className="w-full min-h-[44px] rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label htmlFor="credit-notes" className="block text-sm font-medium text-foreground mb-1">
                Ledger Açıklaması
              </label>
              <input
                id="credit-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="örn: Manuel telafi kredisi"
                className="w-full min-h-[44px] rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="admin-btn admin-btn-secondary min-h-[42px]"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => handleAction('credits')}
                disabled={loading}
                className="admin-btn admin-btn-primary min-h-[42px]"
              >
                {loading ? 'İşleniyor...' : creditMode === 'add' ? 'Kredi Ekle (+)' : 'Bakiyeyi Güncelle'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: Kes / Süre Bitir (REVOKE / EXPIRE) */}
        {activeTab === 'danger' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold text-sm">
                <FaBan className="w-4 h-4" />
                Limiti Anında Kes (Revoke)
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Kullanıcının özel aylık kotasını ve geçerlilik tarihini tamamen siler. Kullanıcı anında standart plan sınırlarına (veya varsa pay-as-you-go kredilerine) döner.
              </p>
              <button
                type="button"
                onClick={() => handleAction('revoke')}
                disabled={loading || !user.customApiMonthlyLimit}
                className="admin-btn bg-rose-600 hover:bg-rose-700 text-white min-h-[40px] text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'İşleniyor...' : 'Özel Limiti Hemen Kes ve Kaldır'}
              </button>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-sm">
                <FaHourglassEnd className="w-4 h-4" />
                Süresini Doldur (Expire)
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Kotayı silmeden, son geçerlilik tarihini geçmiş bir zamana çekerek özel limiti hemen pasifleştirir. İleride tekrar süre uzatmak isterseniz kotayı yeniden yazmak zorunda kalmazsınız.
              </p>
              <button
                type="button"
                onClick={() => handleAction('expire')}
                disabled={loading || !user.customApiMonthlyLimit || isExpired}
                className="admin-btn bg-amber-600 hover:bg-amber-700 text-white min-h-[40px] text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'İşleniyor...' : isExpired ? 'Süre Zaten Dolmuş' : 'Limiti Şimdi Süresi Doldu Olarak İşaretle'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

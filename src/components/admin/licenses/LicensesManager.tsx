/**
 * @file LicensesManager.tsx
 * @description Admin lisans yönetim tablosu, süre uzatma, dondurma, iptal etme,
 *              cihaz sıfırlama ve manuel lisans oluşturma istemci bileşeni.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  FaKey,
  FaCopy,
  FaCheck,
  FaClock,
  FaSnowflake,
  FaBan,
  FaPlay,
  FaUndo,
  FaSearch,
  FaPlus,
  FaLaptop,
  FaCalendarAlt,
  FaTimes,
  FaExclamationTriangle,
  FaFilter,
} from 'react-icons/fa';
import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';
import { ResponsiveTable } from '@/components/ui/ResponsiveTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatDateTime } from '@/lib/utils';

interface CustomerInfo {
  id: string;
  email: string;
  name: string | null;
}

interface ProductInfo {
  id: string;
  title: string;
  slug: string;
  category: string;
}

interface OrderInfo {
  id: string;
  orderNumber: string;
  totalCents: number;
  currency: string;
  createdAt: string | Date;
}

export interface LicenseItem {
  id: string;
  key: string;
  customerId: string;
  productId: string;
  orderId: string | null;
  userId: string | null;
  type: string;
  status: string;
  maxActivations: number;
  currentActivations: number;
  expiresAt: string | Date | null;
  revokedAt: string | Date | null;
  revokeReason: string | null;
  activations: any;
  metadata: any;
  createdAt: string | Date;
  updatedAt: string | Date;
  customer: CustomerInfo;
  product: ProductInfo;
  order: OrderInfo | null;
  user: { id: string; email: string | null; name: string | null } | null;
}

interface StatsInfo {
  total: number;
  active: number;
  expired: number;
  suspended: number;
  revoked: number;
}

interface LicensesManagerProps {
  initialLicenses: LicenseItem[];
  initialStats: StatsInfo;
  products: Array<{ id: string; title: string; category: string }>;
}

export function LicensesManager({
  initialLicenses,
  initialStats,
  products,
}: LicensesManagerProps) {
  const [licenses, setLicenses] = useState<LicenseItem[]>(initialLicenses);
  const [stats, setStats] = useState<StatsInfo>(initialStats);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'suspended' | 'revoked'>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Modallar
  const [extendModalLicense, setExtendModalLicense] = useState<LicenseItem | null>(null);
  const [extendDays, setExtendDays] = useState<number>(30);
  const [customDate, setCustomDate] = useState<string>('');
  const [isPerpetual, setIsPerpetual] = useState<boolean>(false);

  const [revokeModalLicense, setRevokeModalLicense] = useState<LicenseItem | null>(null);
  const [revokeReason, setRevokeReason] = useState<string>('');

  const [activationsModalLicense, setActivationsModalLicense] = useState<LicenseItem | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newLicenseData, setNewLicenseData] = useState({
    productId: products[0]?.id || '',
    customerEmail: '',
    customerName: '',
    type: 'ONE_TIME',
    durationDays: 365,
    maxActivations: 1,
    notes: '',
  });

  // Lisans listesini yenile
  const refreshLicenses = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('q', searchTerm);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/licenses?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setLicenses(json.data.licenses);
        setStats(json.data.stats);
      }
    } catch {
      toast.error('Lisanslar yenilenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Kopyalama
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Lisans anahtarı kopyalandı');
    } catch {
      toast.error('Kopyalama başarısız');
    }
  };

  // Lisans durumu rozeti
  const getLicenseStatusBadge = (lic: LicenseItem) => {
    const now = new Date();
    const isExpired = lic.expiresAt && new Date(lic.expiresAt) <= now;

    if (lic.status === 'revoked') {
      return <StatusBadge tone="danger" label="İptal Edildi" dot />;
    }
    if (lic.status === 'suspended') {
      return <StatusBadge tone="neutral" label="Donduruldu" dot />;
    }
    if (isExpired) {
      return <StatusBadge tone="warning" label="Süresi Doldu" dot />;
    }
    return <StatusBadge tone="success" label="Aktif" dot />;
  };

  // Kalan gün / süre bilgisi
  const getExpiryDisplay = (expiresAt: string | Date | null) => {
    if (!expiresAt) {
      return <span className="text-emerald-600 dark:text-emerald-400 font-medium">Süresiz (Ömür Boyu)</span>;
    }
    const expDate = new Date(expiresAt);
    const now = new Date();
    const diffMs = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="text-rose-500 font-medium">
          {formatDate(expDate)} ({Math.abs(diffDays)} gün önce doldu)
        </span>
      );
    }
    if (diffDays === 0) {
      return <span className="text-amber-500 font-medium">Bugün sona eriyor</span>;
    }
    return (
      <span className={diffDays <= 7 ? 'text-amber-500 font-medium' : 'text-foreground'}>
        {formatDate(expDate)} ({diffDays} gün kaldı)
      </span>
    );
  };

  // Süre uzatma işlemi
  const handleExtendSubmit = async () => {
    if (!extendModalLicense) return;
    const loadingToast = toast.loading('Lisans süresi uzatılıyor...');

    try {
      let body: any;
      if (isPerpetual) {
        body = { action: 'set_expiration', expiresAt: null };
      } else if (customDate) {
        body = { action: 'set_expiration', expiresAt: new Date(customDate).toISOString() };
      } else {
        body = { action: 'extend', days: Number(extendDays) };
      }

      const res = await fetch(`/api/admin/licenses/${extendModalLicense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Süre uzatılamadı');
      }

      toast.success('Lisans süresi başarıyla güncellendi', { id: loadingToast });
      setExtendModalLicense(null);
      setCustomDate('');
      setIsPerpetual(false);
      refreshLicenses();
    } catch (err) {
      toast.error((err as Error).message, { id: loadingToast });
    }
  };

  // Dondurma / Aktif Etme Toggle
  const handleToggleSuspend = async (lic: LicenseItem) => {
    const isSuspended = lic.status === 'suspended';
    const action = isSuspended ? 'activate' : 'suspend';
    const actionText = isSuspended ? 'Lisans aktifleştiriliyor...' : 'Lisans donduruluyor...';
    const loadingToast = toast.loading(actionText);

    try {
      const res = await fetch(`/api/admin/licenses/${lic.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'İşlem başarısız');
      }

      toast.success(
        isSuspended ? 'Lisans dondurması kaldırıldı (Aktif)' : 'Lisans donduruldu (Askıda)',
        { id: loadingToast }
      );
      refreshLicenses();
    } catch (err) {
      toast.error((err as Error).message, { id: loadingToast });
    }
  };

  // İptal Etme (Revoke) işlemi
  const handleRevokeSubmit = async () => {
    if (!revokeModalLicense) return;
    const loadingToast = toast.loading('Lisans iptal ediliyor...');

    try {
      const res = await fetch(`/api/admin/licenses/${revokeModalLicense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke',
          reason: revokeReason || 'Yönetici tarafından iptal edildi',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Lisans iptal edilemedi');
      }

      toast.success('Lisans kalıcı olarak iptal edildi', { id: loadingToast });
      setRevokeModalLicense(null);
      setRevokeReason('');
      refreshLicenses();
    } catch (err) {
      toast.error((err as Error).message, { id: loadingToast });
    }
  };

  // Aktivasyon Cihaz Kayıtlarını Sıfırlama
  const handleResetActivations = async (lic: LicenseItem) => {
    if (!window.confirm(`${lic.key} anahtarının kayıtlı cihaz aktivasyonlarını sıfırlamak istediğinize emin misiniz?`)) {
      return;
    }
    const loadingToast = toast.loading('Cihaz kayıtları sıfırlanıyor...');

    try {
      const res = await fetch(`/api/admin/licenses/${lic.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_activations' }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Sıfırlanamadı');
      }

      toast.success('Cihaz aktivasyonları sıfırlandı', { id: loadingToast });
      refreshLicenses();
    } catch (err) {
      toast.error((err as Error).message, { id: loadingToast });
    }
  };

  // Manuel Lisans Oluşturma
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLicenseData.productId || !newLicenseData.customerEmail) {
      toast.error('Ürün ve müşteri e-postası zorunludur');
      return;
    }

    const loadingToast = toast.loading('Lisans oluşturuluyor...');
    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLicenseData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Lisans oluşturulamadı');
      }

      toast.success(`Yeni lisans üretildi: ${json.data.license.key}`, { id: loadingToast });
      setCreateModalOpen(false);
      setNewLicenseData({
        productId: products[0]?.id || '',
        customerEmail: '',
        customerName: '',
        type: 'ONE_TIME',
        durationDays: 365,
        maxActivations: 1,
        notes: '',
      });
      refreshLicenses();
    } catch (err) {
      toast.error((err as Error).message, { id: loadingToast });
    }
  };

  // İstemci filtreleme
  const filteredLicenses = licenses.filter((lic) => {
    const matchesSearch =
      !searchTerm ||
      lic.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lic.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lic.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lic.product?.title?.toLowerCase().includes(searchTerm.toLowerCase());

    const now = new Date();
    const isExpired = lic.expiresAt && new Date(lic.expiresAt) <= now;

    if (statusFilter === 'active') {
      return matchesSearch && lic.status === 'active' && !isExpired;
    }
    if (statusFilter === 'expired') {
      return matchesSearch && (lic.status === 'expired' || (lic.status === 'active' && isExpired));
    }
    if (statusFilter === 'suspended') {
      return matchesSearch && lic.status === 'suspended';
    }
    if (statusFilter === 'revoked') {
      return matchesSearch && lic.status === 'revoked';
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* 1. İstatistik Sayaçları */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'all'
              ? 'border-brand-primary bg-brand-primary/5 shadow-sm'
              : 'border-border/60 bg-muted/20 hover:border-border'
          }`}
        >
          <p className="text-xs text-muted-foreground font-medium">Toplam Lisans</p>
          <p className="text-2xl font-bold mt-1 tabular-nums">{stats.total}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('active')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'active'
              ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-sm'
              : 'border-border/60 bg-muted/20 hover:border-border'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">Aktif</p>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400 tabular-nums">
            {stats.active}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('expired')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'expired'
              ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 shadow-sm'
              : 'border-border/60 bg-muted/20 hover:border-border'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">Süresi Dolan</p>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400 tabular-nums">
            {stats.expired}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('suspended')}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === 'suspended'
              ? 'border-slate-500 bg-slate-50/20 dark:bg-slate-900/30 shadow-sm'
              : 'border-border/60 bg-muted/20 hover:border-border'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">Dondurulan</p>
            <span className="w-2 h-2 rounded-full bg-slate-500" />
          </div>
          <p className="text-2xl font-bold mt-1 text-slate-700 dark:text-slate-300 tabular-nums">
            {stats.suspended}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('revoked')}
          className={`p-4 rounded-xl border text-left transition-all col-span-2 sm:col-span-1 ${
            statusFilter === 'revoked'
              ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 shadow-sm'
              : 'border-border/60 bg-muted/20 hover:border-border'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">İptal Edilen</p>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <p className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400 tabular-nums">
            {stats.revoked}
          </p>
        </button>
      </div>

      {/* 2. Filtre ve Arama Çubuğu */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Lisans anahtarı, müşteri e-posta veya ürün ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-input pl-9 text-xs sm:text-sm py-2"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="admin-btn admin-btn-primary text-xs sm:text-sm whitespace-nowrap"
          >
            <FaPlus className="w-3 h-3 mr-1.5" />
            Manuel Lisans Oluştur
          </button>
        </div>
      </div>

      {/* 3. Lisans Tablosu */}
      {filteredLicenses.length === 0 ? (
        <EmptyState
          variant="card"
          icon="key"
          title="Lisans bulunamadı"
          description={
            searchTerm || statusFilter !== 'all'
              ? 'Filtreleme kriterlerinize uygun lisans kaydı bulunamadı.'
              : 'Henüz veritabanında lisans kaydı oluşturulmamış.'
          }
        />
      ) : (
        <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm">
          <ResponsiveTable minWidth="920px" caption="Lisans Listesi" className="border-0">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Lisans Anahtarı
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Müşteri
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Ürün
                </th>
                <th scope="col" className="px-4 py-3 text-center font-semibold">
                  Durum
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Geçerlilik Süresi
                </th>
                <th scope="col" className="px-4 py-3 text-center font-semibold">
                  Aktivasyon
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {filteredLicenses.map((lic) => {
                const isSuspended = lic.status === 'suspended';
                const isRevoked = lic.status === 'revoked';

                return (
                  <tr key={lic.id} className="hover:bg-muted/30 transition-colors">
                    {/* Lisans Anahtarı */}
                    <td className="px-4 py-3 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold bg-muted/80 px-2 py-1 rounded border border-border/60 select-all">
                          {lic.key}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(lic.key)}
                          title="Lisansı Kopyala"
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                        >
                          <FaCopy className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Oluşturuldu: {formatDate(lic.createdAt)}
                      </p>
                    </td>

                    {/* Müşteri */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-xs text-foreground truncate max-w-[180px]">
                        {lic.customer?.name || lic.user?.name || 'İsimsiz Müşteri'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {lic.customer?.email || '—'}
                      </p>
                      {lic.order?.orderNumber && (
                        <p className="text-[10px] text-brand-primary mt-0.5 font-mono">
                          Sipariş: #{lic.order.orderNumber}
                        </p>
                      )}
                    </td>

                    {/* Ürün */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-xs text-foreground truncate max-w-[180px]">
                        {lic.product?.title ?? 'Silinmiş Ürün'}
                      </p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {lic.type}
                      </span>
                    </td>

                    {/* Durum Rozeti */}
                    <td className="px-4 py-3 text-center">
                      {getLicenseStatusBadge(lic)}
                    </td>

                    {/* Süre / Bitiş */}
                    <td className="px-4 py-3 text-xs">
                      {getExpiryDisplay(lic.expiresAt)}
                    </td>

                    {/* Cihaz Aktivasyonu */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setActivationsModalLicense(lic)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted hover:bg-muted/80 transition-colors"
                        title="Aktif Cihazları Görüntüle"
                      >
                        <FaLaptop className="w-3 h-3 text-muted-foreground" />
                        <span>
                          {lic.currentActivations} / {lic.maxActivations}
                        </span>
                      </button>
                    </td>

                    {/* Butonlar / İşlemler */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. Süre Uzatma Butonu */}
                        <button
                          type="button"
                          onClick={() => {
                            setExtendModalLicense(lic);
                            setExtendDays(30);
                            setCustomDate('');
                            setIsPerpetual(!lic.expiresAt);
                          }}
                          className="px-2.5 py-1.5 text-xs rounded-lg bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition-colors font-medium inline-flex items-center gap-1"
                          title="Lisans Süresini Uzat"
                        >
                          <FaClock className="w-3 h-3" />
                          Süre Uzat
                        </button>

                        {/* 2. Dondurma / Aktif Etme Butonu */}
                        {!isRevoked && (
                          <button
                            type="button"
                            onClick={() => handleToggleSuspend(lic)}
                            className={`p-1.5 rounded-lg border text-xs transition-colors ${
                              isSuspended
                                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                            title={isSuspended ? 'Dondurmayı Kaldır (Aktif Et)' : 'Lisansı Dondur (Askıya Al)'}
                          >
                            {isSuspended ? (
                              <FaPlay className="w-3 h-3" />
                            ) : (
                              <FaSnowflake className="w-3 h-3" />
                            )}
                          </button>
                        )}

                        {/* 3. İptal Etme Butonu */}
                        {!isRevoked ? (
                          <button
                            type="button"
                            onClick={() => {
                              setRevokeModalLicense(lic);
                              setRevokeReason('');
                            }}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Lisansı Kalıcı Olarak İptal Et"
                          >
                            <FaBan className="w-3 h-3" />
                          </button>
                        ) : (
                          <span
                            className="text-[10px] text-muted-foreground italic px-1"
                            title={lic.revokeReason || 'İptal edildi'}
                          >
                            İptal
                          </span>
                        )}

                        {/* 4. Cihaz Aktivasyonlarını Sıfırlama */}
                        {lic.currentActivations > 0 && (
                          <button
                            type="button"
                            onClick={() => handleResetActivations(lic)}
                            className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                            title="Cihaz Aktivasyon Kilidini Sıfırla"
                          >
                            <FaUndo className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </ResponsiveTable>
        </div>
      )}

      {/* MODAL 1: SÜRE UZATMA */}
      {extendModalLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border/80 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <FaClock className="text-brand-primary" />
                Lisans Süresini Uzat
              </h3>
              <button
                type="button"
                onClick={() => setExtendModalLicense(null)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <FaTimes />
              </button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Lisans:</strong> <span className="font-mono">{extendModalLicense.key}</span>
              </p>
              <p>
                <strong>Müşteri:</strong> {extendModalLicense.customer?.email}
              </p>
              <p>
                <strong>Mevcut Bitiş:</strong> {getExpiryDisplay(extendModalLicense.expiresAt)}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-foreground">
                Hızlı Süre Ekle
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '+30 Gün (1 Ay)', days: 30 },
                  { label: '+90 Gün (3 Ay)', days: 90 },
                  { label: '+365 Gün (1 Yıl)', days: 365 },
                ].map((item) => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => {
                      setExtendDays(item.days);
                      setCustomDate('');
                      setIsPerpetual(false);
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      extendDays === item.days && !customDate && !isPerpetual
                        ? 'border-brand-primary bg-brand-primary text-white shadow-sm'
                        : 'border-border/60 bg-muted/30 hover:bg-muted'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Veya Belirli Bir Bitiş Tarihi Seç
                </label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    setIsPerpetual(false);
                  }}
                  className="admin-input text-xs"
                />
              </div>

              <div className="pt-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="perpetual-checkbox"
                  checked={isPerpetual}
                  onChange={(e) => {
                    setIsPerpetual(e.target.checked);
                    if (e.target.checked) setCustomDate('');
                  }}
                  className="rounded border-border"
                />
                <label htmlFor="perpetual-checkbox" className="text-xs font-medium cursor-pointer">
                  Bu lisansı <strong>Süresiz (Ömür Boyu)</strong> yap
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
              <button
                type="button"
                onClick={() => setExtendModalLicense(null)}
                className="admin-btn text-xs"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleExtendSubmit}
                className="admin-btn admin-btn-primary text-xs"
              >
                Süreyi Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: İPTAL ETME (REVOKE) */}
      {revokeModalLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl border border-rose-500/30 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-semibold text-base text-rose-500 flex items-center gap-2">
                <FaExclamationTriangle />
                Lisansı Kalıcı Olarak İptal Et
              </h3>
              <button
                type="button"
                onClick={() => setRevokeModalLicense(null)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 dark:text-rose-300">
              Bu işlem lisans anahtarını kalıcı olarak geçersiz kılacaktır. Masaüstü uygulaması bir sonraki kontrolde kapanacak ve kullanılamayacaktır.
            </div>

            <div className="space-y-2 text-xs">
              <p>
                <strong>Lisans:</strong> <span className="font-mono">{revokeModalLicense.key}</span>
              </p>
              <p>
                <strong>Müşteri:</strong> {revokeModalLicense.customer?.email}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                İptal Sebebi (Opsiyonel)
              </label>
              <input
                type="text"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="örn: İade yapıldı / Kötüye kullanım / Müşteri talebi"
                className="admin-input text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
              <button
                type="button"
                onClick={() => setRevokeModalLicense(null)}
                className="admin-btn text-xs"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleRevokeSubmit}
                className="admin-btn text-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                Evet, Lisansı İptal Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: AKTİF CİHAZLAR DETAYI */}
      {activationsModalLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border/80 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <FaLaptop className="text-brand-primary" />
                Aktif Cihaz Kayıtları ({activationsModalLicense.currentActivations}/{activationsModalLicense.maxActivations})
              </h3>
              <button
                type="button"
                onClick={() => setActivationsModalLicense(null)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <FaTimes />
              </button>
            </div>

            <div className="text-xs text-muted-foreground">
              Lisans: <span className="font-mono font-semibold">{activationsModalLicense.key}</span>
            </div>

            {Array.isArray(activationsModalLicense.activations) && activationsModalLicense.activations.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {activationsModalLicense.activations.map((act: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-border/60 bg-muted/30 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono font-semibold">
                      <span>Cihaz #{idx + 1}: {act.machineId || act.domain || 'Bilinmeyen Cihaz'}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        {act.timestamp ? formatDateTime(act.timestamp) : '—'}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-[11px] flex gap-3">
                      <span>IP: {act.ip || '—'}</span>
                      {act.os && <span>İşletim Sistemi: {act.os}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">
                Bu lisans için henüz hiçbir bilgisayar veya cihaz aktivasyonu yapılmamış.
              </p>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-border/60">
              {activationsModalLicense.currentActivations > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    handleResetActivations(activationsModalLicense);
                    setActivationsModalLicense(null);
                  }}
                  className="admin-btn text-xs text-amber-600 border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                >
                  <FaUndo className="mr-1" />
                  Tüm Cihaz Kayıtlarını Sıfırla
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setActivationsModalLicense(null)}
                className="admin-btn admin-btn-primary text-xs"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: MANUEL LİSANS OLUŞTURMA */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border/80 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <FaKey className="text-brand-primary" />
                Manuel Lisans Üret
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium mb-1">Masaüstü / Yazılım Ürünü *</label>
                <select
                  value={newLicenseData.productId}
                  onChange={(e) =>
                    setNewLicenseData({ ...newLicenseData, productId: e.target.value })
                  }
                  className="admin-input text-xs"
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Müşteri E-Posta *</label>
                  <input
                    type="email"
                    value={newLicenseData.customerEmail}
                    onChange={(e) =>
                      setNewLicenseData({ ...newLicenseData, customerEmail: e.target.value })
                    }
                    placeholder="musteri@ornek.com"
                    className="admin-input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Müşteri Adı (Opsiyonel)</label>
                  <input
                    type="text"
                    value={newLicenseData.customerName}
                    onChange={(e) =>
                      setNewLicenseData({ ...newLicenseData, customerName: e.target.value })
                    }
                    placeholder="Ahmet Yılmaz"
                    className="admin-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium mb-1">Lisans Tipi</label>
                  <select
                    value={newLicenseData.type}
                    onChange={(e) =>
                      setNewLicenseData({ ...newLicenseData, type: e.target.value })
                    }
                    className="admin-input text-xs"
                  >
                    <option value="ONE_TIME">Standart</option>
                    <option value="SUBSCRIPTION">Abonelik</option>
                    <option value="PERPETUAL">Ömür Boyu</option>
                    <option value="TRIAL">Deneme</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Geçerlilik (Gün)</label>
                  <input
                    type="number"
                    value={newLicenseData.durationDays}
                    onChange={(e) =>
                      setNewLicenseData({
                        ...newLicenseData,
                        durationDays: Number(e.target.value),
                      })
                    }
                    placeholder="365 (0 = süresiz)"
                    className="admin-input text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Cihaz Sınırı</label>
                  <input
                    type="number"
                    value={newLicenseData.maxActivations}
                    onChange={(e) =>
                      setNewLicenseData({
                        ...newLicenseData,
                        maxActivations: Number(e.target.value),
                      })
                    }
                    min={1}
                    className="admin-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Not / Açıklama (Opsiyonel)</label>
                <input
                  type="text"
                  value={newLicenseData.notes}
                  onChange={(e) =>
                    setNewLicenseData({ ...newLicenseData, notes: e.target.value })
                  }
                  placeholder="örn: Özel müşteri hediyesi / Test lisansı"
                  className="admin-input text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="admin-btn text-xs"
                >
                  Vazgeç
                </button>
                <button type="submit" className="admin-btn admin-btn-primary text-xs">
                  Lisansı Üret ve Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

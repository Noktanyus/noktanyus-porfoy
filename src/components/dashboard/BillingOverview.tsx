'use client';

/**
 * @file Billing Overview — Abonelik, sipariş ve lisans yönetim paneli.
 * @description Tab-tabanlı arayüz: Genel Bakış (aktif abonelik + planlar),
 *              Siparişler, Lisanslar.
 */

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  FaArrowRight,
  FaCheckCircle,
  FaCoins,
  FaCrown,
  FaCreditCard,
  FaKey,
  FaReceipt,
} from 'react-icons/fa';

type Tab = 'overview' | 'orders' | 'licenses';

interface Plan {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  interval: string;
  features: unknown;
  isFeatured: boolean;
}

interface Subscription {
  id: string;
  planSlug: string;
  status: string;
  startedAt: Date | string;
  expiresAt: Date | string;
  autoRenew: boolean;
}

interface OrderItem {
  id: string;
  productTitle: string;
  quantity: number;
  totalCents: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: Date | string;
  items: OrderItem[];
}

interface License {
  id: string;
  key: string;
  status: string;
  createdAt: Date | string;
  expiresAt: Date | string | null;
  product: { title: string; slug: string };
}

interface BillingOverviewProps {
  subscription: Subscription | null;
  orders: Order[];
  licenses: License[];
  plans: Plan[];
  userEmail: string;
  apiCreditBalance?: number;
}

const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: 'overview', label: 'Genel Bakış' },
  { id: 'orders', label: 'Siparişler' },
  { id: 'licenses', label: 'Lisanslar' },
];

export function BillingOverview({
  subscription,
  orders,
  licenses,
  plans: _plans,
  userEmail,
  apiCreditBalance = 0,
}: BillingOverviewProps) {
  const [selectedTab, setSelectedTab] = useState<Tab>('overview');

  const handleManageSubscription = async () => {
    if (!userEmail) {
      toast.error('E-posta adresiniz bulunamadı');
      return;
    }
    try {
      const res = await fetch('/api/checkout/subscription-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail: userEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message ?? 'Portal açılamadı');
      }
      if (data.data?.url) {
        window.location.href = data.data.url;
      } else {
        toast('Portal yönlendirmesi bulunamadı');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'İşlem başarısız');
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Kopyalandı');
    } catch {
      toast.error('Kopyalama başarısız');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div
        className="glass-card-premium p-2 inline-flex flex-wrap gap-1"
        role="tablist"
        aria-label="Faturalandırma bölümleri"
      >
        {TABS.map((tab) => {
          const count =
            tab.id === 'orders' ? orders.length : tab.id === 'licenses' ? licenses.length : null;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={selectedTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedTab === tab.id
                  ? 'bg-brand-primary text-white'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {count !== null && (
                <span className="ml-2 text-xs opacity-70">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {selectedTab === 'overview' && (
        <div id="panel-overview" role="tabpanel" className="space-y-6">
          <div className="glass-card-premium p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                API kredi bakiyesi
              </p>
              <p className="text-2xl font-bold tabular-nums mt-1">
                {apiCreditBalance.toLocaleString('tr-TR')} kredi
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                1 kredi = 1 istek · önce yükle, sonra kullan
              </p>
            </div>
            <a
              href="/magaza/krediler"
              className="rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Kredi yükle
            </a>
          </div>

          {subscription && <ActiveSubscriptionCard subscription={subscription} onManage={handleManageSubscription} />}

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Paket & Teklif Seçenekleri</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                İhtiyacınıza uygun aylık abonelik paketlerini veya süresi dolmayan ön ödemeli API kredilerini mağazamızdan inceleyin.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Abonelikler Card */}
              <div className="glass-card-premium p-6 flex flex-col justify-between border border-border/70 hover:border-brand-primary/50 transition-all group">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      <FaCrown className="w-5 h-5" aria-hidden />
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                      Düzenli Kullanım
                    </span>
                  </div>
                  <h3 className="text-lg font-bold group-hover:text-brand-primary transition-colors">
                    Aylık ve Yıllık Abonelikler
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Yüksek kotalar, öncelikli API altyapısı ve kurumsal faturalama avantajıyla aylık veya yıllık abonelik planlarına geçin.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <FaCheckCircle className="text-emerald-500 shrink-0" />
                      <span>Aylık yenilenen cömert istek kotaları</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FaCheckCircle className="text-emerald-500 shrink-0" />
                      <span>7/24 kesintisiz yüksek hız ve SLA güvencesi</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-border/50">
                  <Link
                    href="/magaza/abonelikler"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    <span>Abonelik Paketlerini İncele</span>
                    <FaArrowRight className="w-3.5 h-3.5" aria-hidden />
                  </Link>
                </div>
              </div>

              {/* Krediler Card */}
              <div className="glass-card-premium p-6 flex flex-col justify-between border border-border/70 hover:border-brand-primary/50 transition-all group">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                      <FaCoins className="w-5 h-5" aria-hidden />
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                      Kullandıkça Öde
                    </span>
                  </div>
                  <h3 className="text-lg font-bold group-hover:text-brand-primary transition-colors">
                    Ön Ödemeli API Kredileri
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Taahhüt olmadan, süresi asla dolmayan paketlerle sadece harcadığınız kadar ödeyin. Kredi bakiyenizi dilediğiniz zaman takviye edin.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <FaCheckCircle className="text-emerald-500 shrink-0" />
                      <span>Süresi dolmayan, devreden bakiye</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FaCheckCircle className="text-emerald-500 shrink-0" />
                      <span>1 kredi = 1 başarılı API çağrısı</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-border/50">
                  <Link
                    href="/magaza/krediler"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border text-sm font-semibold transition-colors"
                  >
                    <span>Kredi Paketlerini İncele</span>
                    <FaArrowRight className="w-3.5 h-3.5" aria-hidden />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'orders' && (
        <div id="panel-orders" role="tabpanel">
          <OrdersTable orders={orders} onCopy={handleCopy} />
        </div>
      )}

      {selectedTab === 'licenses' && (
        <div id="panel-licenses" role="tabpanel">
          <LicensesList licenses={licenses} onCopy={handleCopy} />
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Sub-components ----------------------------- */

const SUBSCRIPTION_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active: {
    label: 'Aktif',
    className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  },
  trialing: {
    label: 'Deneme Sürümü',
    className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  },
  past_due: {
    label: 'Ödeme Bekliyor',
    className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  },
  canceled: {
    label: 'İptal Edildi',
    className: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
  },
  unpaid: {
    label: 'Ödenmedi',
    className: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
  },
};

function ActiveSubscriptionCard({
  subscription,
  onManage,
}: {
  subscription: Subscription;
  onManage: () => void;
}) {
  const statusConfig = SUBSCRIPTION_STATUS_LABELS[subscription.status.toLowerCase()] ?? {
    label: subscription.status,
    className: 'bg-muted text-muted-foreground',
  };
  return (
    <div className="glass-card-premium p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FaCrown className="w-5 h-5 text-yellow-500" aria-hidden />
            <h2 className="text-lg font-semibold">Aktif Abonelik</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Plan:{' '}
            <span className="font-mono px-2 py-0.5 rounded bg-muted text-foreground">
              {subscription.planSlug}
            </span>
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusConfig.className}`}
        >
          {statusConfig.label}
        </span>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Başlangıç</dt>
          <dd className="font-medium">{formatDate(subscription.startedAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Bitiş</dt>
          <dd className="font-medium">{formatDate(subscription.expiresAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Otomatik Yenileme</dt>
          <dd className="font-medium">{subscription.autoRenew ? 'Açık' : 'Kapalı'}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={onManage} className="admin-btn admin-btn-primary text-sm">
          Aboneliği Yönet
        </button>
      </div>
    </div>
  );
}

function OrdersTable({ orders, onCopy }: { orders: Order[]; onCopy: (text: string) => void }) {
  if (orders.length === 0) {
    return (
      <div className="glass-card-premium p-12 text-center">
        <FaReceipt className="w-10 h-10 mx-auto mb-3 text-muted-foreground" aria-hidden />
        <p className="text-lg font-medium">Henüz sipariş yok</p>
        <p className="text-sm text-muted-foreground mt-2">
          Plan veya ürün satın aldığınızda burada görünecek.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card-premium p-6 overflow-hidden">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FaReceipt aria-hidden /> Siparişler
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="text-left p-3 font-medium">Sipariş No</th>
              <th scope="col" className="text-left p-3 font-medium">Tarih</th>
              <th scope="col" className="text-left p-3 font-medium">Ürünler</th>
              <th scope="col" className="text-right p-3 font-medium">Tutar</th>
              <th scope="col" className="text-left p-3 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border/50 last:border-0">
                <td className="p-3 font-mono text-xs">
                  <button
                    onClick={() => onCopy(order.orderNumber)}
                    className="hover:text-brand-primary transition-colors"
                    title="Kopyala"
                  >
                    {order.orderNumber}
                  </button>
                </td>
                <td className="p-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                <td className="p-3">
                  <div className="text-xs space-y-0.5">
                    {order.items.map((item) => (
                      <div key={item.id}>
                        {item.productTitle} × {item.quantity}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="p-3 text-right font-semibold">
                  {formatCurrency(order.totalCents, order.currency)}
                </td>
                <td className="p-3">
                  <span className={statusBadge(order.status)}>{order.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LicensesList({
  licenses,
  onCopy,
}: {
  licenses: License[];
  onCopy: (text: string) => void;
}) {
  if (licenses.length === 0) {
    return (
      <div className="glass-card-premium p-12 text-center">
        <FaKey className="w-10 h-10 mx-auto mb-3 text-muted-foreground" aria-hidden />
        <p className="text-lg font-medium">Henüz lisans yok</p>
        <p className="text-sm text-muted-foreground mt-2">
          Dijital ürün satın aldığınızda lisans anahtarları burada görünecek.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card-premium p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FaKey aria-hidden /> Lisanslarım
      </h2>
      <div className="space-y-3">
        {licenses.map((license) => {
          const isActive = license.status === 'active';
          return (
            <div key={license.id} className="p-4 rounded-lg border border-border">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{license.product.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    Alındı: {formatDate(license.createdAt)}
                    {license.expiresAt && (
                      <> · Bitiş: {formatDate(license.expiresAt)}</>
                    )}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                    isActive
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}
                >
                  {license.status}
                </span>
              </div>

              <div className="flex items-center gap-2 p-2 bg-muted rounded font-mono text-xs">
                <code className="flex-1 overflow-x-auto whitespace-nowrap">
                  {license.key}
                </code>
                <button
                  onClick={() => onCopy(license.key)}
                  className="px-3 py-1 rounded bg-brand-primary text-white text-xs hover:bg-brand-primary/90 transition-colors flex-shrink-0"
                  aria-label="Lisans anahtarını kopyala"
                >
                  Kopyala
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function statusBadge(status: string): string {
  const base = 'px-2 py-1 rounded text-xs font-medium';
  const normalized = status.toUpperCase();
  if (normalized === 'PAID' || normalized === 'COMPLETED' || normalized === 'ACTIVE') {
    return `${base} bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400`;
  }
  if (normalized === 'FAILED' || normalized === 'REFUNDED' || normalized === 'CANCELLED') {
    return `${base} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400`;
  }
  return `${base} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400`;
}
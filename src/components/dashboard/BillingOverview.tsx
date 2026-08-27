'use client';

/**
 * @file Billing Overview — Abonelik, sipariş ve lisans yönetim paneli.
 * @description Tab-tabanlı arayüz: Genel Bakış (aktif abonelik + planlar),
 *              Siparişler, Lisanslar.
 */

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  FaCheckCircle,
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
  plans,
  userEmail,
}: BillingOverviewProps) {
  const [selectedTab, setSelectedTab] = useState<Tab>('overview');

  const handleSubscribe = async (planSlug: string) => {
    if (!userEmail) {
      toast.error('E-posta adresiniz bulunamadı');
      return;
    }
    try {
      const res = await fetch('/api/checkout/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planSlug, customerEmail: userEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message ?? 'Ödeme başlatılamadı');
      }
      if (data.data?.url) {
        window.location.href = data.data.url;
      } else {
        toast.success('Abonelik talebi alındı');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hata oluştu');
    }
  };

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
          {subscription && <ActiveSubscriptionCard subscription={subscription} onManage={handleManageSubscription} />}

          <div>
            <h2 className="text-lg font-semibold mb-4">Planlar</h2>
            {plans.length === 0 ? (
              <div className="glass-card-premium p-12 text-center">
                <FaCreditCard className="w-10 h-10 mx-auto mb-3 text-muted-foreground" aria-hidden />
                <p className="text-lg font-medium">Aktif plan bulunamadı</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Yeni planlar yakında eklenecek.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    isCurrent={subscription?.planSlug === plan.slug}
                    hasActiveSubscription={!!subscription}
                    onSubscribe={handleSubscribe}
                  />
                ))}
              </div>
            )}
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

function ActiveSubscriptionCard({
  subscription,
  onManage,
}: {
  subscription: Subscription;
  onManage: () => void;
}) {
  const isActive = subscription.status === 'active';
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
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
            isActive
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
          }`}
        >
          {subscription.status}
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

function PlanCard({
  plan,
  isCurrent,
  hasActiveSubscription,
  onSubscribe,
}: {
  plan: Plan;
  isCurrent: boolean;
  hasActiveSubscription: boolean;
  onSubscribe: (slug: string) => void;
}) {
  const features = Array.isArray(plan.features)
    ? (plan.features as unknown[]).map((f) => String(f))
    : [];

  return (
    <div
      className={`glass-card-premium p-6 flex flex-col ${
        plan.isFeatured ? 'ring-2 ring-brand-primary' : ''
      }`}
    >
      {plan.isFeatured && (
        <span className="inline-block self-start px-3 py-1 rounded-full bg-brand-primary text-white text-xs font-semibold mb-3">
          ÖNERİLEN
        </span>
      )}
      <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
      {plan.description && (
        <p className="text-sm text-muted-foreground mb-4 min-h-[2.5rem]">
          {plan.description}
        </p>
      )}

      <div className="mb-4">
        <span className="text-3xl font-bold text-brand-primary">
          {formatCurrency(plan.priceCents, plan.currency)}
        </span>
        <span className="text-sm text-muted-foreground ml-1">
          /{String(plan.interval).toLowerCase()}
        </span>
      </div>

      {features.length > 0 && (
        <ul className="space-y-2 mb-6 text-sm flex-1">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" aria-hidden />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}

      {isCurrent ? (
        <button disabled className="w-full admin-btn admin-btn-secondary">
          Mevcut Plan
        </button>
      ) : (
        <button
          onClick={() => onSubscribe(plan.slug)}
          className="w-full admin-btn admin-btn-primary"
        >
          {hasActiveSubscription ? 'Geçiş Yap' : 'Abone Ol'}
        </button>
      )}
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
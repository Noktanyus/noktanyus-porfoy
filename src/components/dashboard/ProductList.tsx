/**
 * @file ProductList - Kullanıcının siparişleri ve lisanslarını sekmeli gösterir.
 *
 * - Orders sekmesi: tüm siparişler, item detayları, tutarlar
 * - Licenses sekmesi: lisans anahtarları, kopyalama, ürün linki
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { FaBox, FaKey, FaCopy, FaEye, FaDownload } from 'react-icons/fa';

type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'FULFILLED'
  | 'CANCELED';

interface OrderItemRow {
  id: string;
  productTitle: string;
  productSlug: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  product?: { id: string; slug: string; title: string } | null;
}

interface OrderRow {
  id: string;
  orderNumber: string;
  status: OrderStatus | string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  createdAt: Date | string;
  items: OrderItemRow[];
}

interface LicenseRow {
  id: string;
  key: string;
  status: string;
  type: string;
  maxActivations: number;
  currentActivations: number;
  expiresAt: Date | string | null;
  createdAt: Date | string;
  product: { id: string; slug: string; title: string; fileUrl?: string } | null;
}

interface ProductListProps {
  orders: OrderRow[];
  licenses: LicenseRow[];
}

const ORDER_STATUS_STYLES: Record<string, string> = {
  PAID: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  FULFILLED: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  PENDING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  REFUNDED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  PARTIALLY_REFUNDED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  FAILED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  CANCELED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};

const LICENSE_STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  expired: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  revoked: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  suspended: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300',
};

export function ProductList({ orders, licenses }: ProductListProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'licenses'>('orders');

  const copyLicense = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      toast.success('Lisans anahtarı kopyalandı');
    } catch {
      toast.error('Kopyalama başarısız');
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card-premium p-2 inline-flex gap-1" role="tablist" aria-label="Ürün sekmeleri">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'orders'}
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'orders'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <FaBox className="inline mr-2 w-3 h-3" />
          Siparişler ({orders.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'licenses'}
          onClick={() => setActiveTab('licenses')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'licenses'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <FaKey className="inline mr-2 w-3 h-3" />
          Lisanslar ({licenses.length})
        </button>
      </div>

      {activeTab === 'orders' && <OrdersTab orders={orders} />}

      {activeTab === 'licenses' && <LicensesTab licenses={licenses} onCopy={copyLicense} />}
    </div>
  );
}

function OrdersTab({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) {
    return (
      <div className="glass-card-premium p-12 text-center">
        <p className="text-5xl mb-3" aria-hidden="true">
          📦
        </p>
        <p className="text-lg font-medium mb-2">Henüz siparişiniz yok</p>
        <p className="text-sm text-muted-foreground mb-4">
          Mağazadan dijital ürün satın alarak başlayabilirsiniz.
        </p>
        <Link href="/magaza" className="admin-btn admin-btn-primary inline-block">
          Mağazaya Git
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const statusClass =
          ORDER_STATUS_STYLES[order.status] ??
          'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';

        return (
          <article key={order.id} className="glass-card-premium p-5">
            <header className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold break-all">{order.orderNumber}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusClass}`}
              >
                {order.status}
              </span>
            </header>

            <ul className="space-y-1.5">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {item.productSlug ? (
                      <Link
                        href={`/magaza/${item.productSlug}`}
                        className="hover:text-brand-primary hover:underline"
                      >
                        {item.productTitle}
                      </Link>
                    ) : (
                      item.productTitle
                    )}
                  <span className="text-muted-foreground ml-2">× {item.quantity}</span>
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(item.totalCents, order.currency)}
                  </span>
                </li>
              ))}
            </ul>

            <footer className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
              <span className="text-sm font-medium">Toplam</span>
              <span className="text-lg font-bold text-brand-primary tabular-nums">
                {formatCurrency(order.totalCents, order.currency)}
              </span>
            </footer>
          </article>
        );
      })}
    </div>
  );
}

function LicensesTab({
  licenses,
  onCopy,
}: {
  licenses: LicenseRow[];
  onCopy: (key: string) => void;
}) {
  if (licenses.length === 0) {
    return (
      <div className="glass-card-premium p-12 text-center">
        <p className="text-5xl mb-3" aria-hidden="true">
          🔑
        </p>
        <p className="text-lg font-medium">Henüz lisansınız yok</p>
        <p className="text-sm text-muted-foreground mt-2">
          Bir ürün satın aldığınızda lisans anahtarınız burada görünecek.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {licenses.map((license) => {
        const statusClass =
          LICENSE_STATUS_STYLES[license.status] ??
          'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';

        const expiresAt = license.expiresAt
          ? formatDate(license.expiresAt)
          : 'Süresiz';

        return (
          <article key={license.id} className="glass-card-premium p-5">
            <header className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold truncate">
                  {license.product?.title ?? 'Ürün'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Alındı: {formatDate(license.createdAt)} · Bitiş: {expiresAt}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                {license.status}
              </span>
            </header>

            <div className="flex items-stretch gap-2 p-3 bg-muted rounded-lg">
              <code
                className="flex-1 overflow-x-auto font-mono text-xs break-all self-center"
                aria-label="Lisans anahtarı"
              >
                {license.key}
              </code>
              <button
                type="button"
                onClick={() => onCopy(license.key)}
                className="px-3 py-1.5 rounded-md bg-brand-primary text-white text-xs font-medium hover:bg-brand-primary/90 transition-colors whitespace-nowrap"
                aria-label="Lisans anahtarını kopyala"
              >
                <FaCopy className="inline w-3 h-3 mr-1" />
                Kopyala
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="text-xs text-muted-foreground">
                Aktivasyon: {license.currentActivations}/{license.maxActivations}
              </span>
              {license.product?.slug && (
                <Link
                  href={`/magaza/${license.product.slug}`}
                  className="inline-flex items-center gap-1 text-brand-primary hover:underline text-sm"
                >
                  <FaEye className="w-3 h-3" />
                  Ürünü Görüntüle
                </Link>
              )}
              {license.product?.fileUrl && license.status === 'active' && (
                <a
                  href={license.product.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-brand-primary hover:underline text-sm"
                >
                  <FaDownload className="w-3 h-3" />
                  İndir
                </a>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
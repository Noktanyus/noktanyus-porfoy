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
import { FaBox, FaKey, FaCopy, FaEye, FaDownload, FaSync, FaExclamationTriangle } from 'react-icons/fa';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { ButtonSpinner } from '@/components/ui/LoadingSkeleton';
import { resolveOrderItems } from '@/modules/commerce/orderUtils';

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
  productTitle?: string | null;
  productSlug?: string | null;
  quantity?: number | null;
  unitPriceCents?: number | null;
  totalCents?: number | null;
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
  notes?: string | null;
  metadata?: unknown;
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
  const [licenseList, setLicenseList] = useState<LicenseRow[]>(licenses);
  const [selectedLicenseToRotate, setSelectedLicenseToRotate] = useState<LicenseRow | null>(null);
  const [isRotating, setIsRotating] = useState(false);

  const copyLicense = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      toast.success('Lisans anahtarı kopyalandı');
    } catch {
      toast.error('Kopyalama başarısız');
    }
  };

  const handleRotateConfirm = async () => {
    if (!selectedLicenseToRotate) return;
    setIsRotating(true);
    const toastId = toast.loading('Yeni lisans anahtarı üretiliyor...');
    try {
      const res = await fetch(`/api/user/licenses/${selectedLicenseToRotate.id}/rotate`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Lisans anahtarı yenilenemedi');
      }
      const newKey = json.data.license.key;
      setLicenseList((prev) =>
        prev.map((l) =>
          l.id === selectedLicenseToRotate.id
            ? { ...l, key: newKey, currentActivations: 0 }
            : l
        )
      );
      toast.success('Lisans anahtarınız başarıyla yenilendi!', { id: toastId });
      setSelectedLicenseToRotate(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'İşlem başarısız', { id: toastId });
    } finally {
      setIsRotating(false);
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
          Lisanslar ({licenseList.length})
        </button>
      </div>

      {activeTab === 'orders' && <OrdersTab orders={orders} />}

      {activeTab === 'licenses' && (
        <LicensesTab
          licenses={licenseList}
          onCopy={copyLicense}
          onRotatePrompt={(l) => setSelectedLicenseToRotate(l)}
        />
      )}

      {/* Lisans Anahtarı Yenileme Onay Modalı */}
      <Modal
        open={!!selectedLicenseToRotate}
        onClose={() => !isRotating && setSelectedLicenseToRotate(null)}
        title="Lisans Anahtarını Yenile"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              disabled={isRotating}
              onClick={() => setSelectedLicenseToRotate(null)}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              Vazgeç
            </button>
            <button
              type="button"
              disabled={isRotating}
              onClick={handleRotateConfirm}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors inline-flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isRotating ? (
                <>
                  <ButtonSpinner size="small" />
                  <span>Yenileniyor...</span>
                </>
              ) : (
                <>
                  <FaSync className="w-3.5 h-3.5" />
                  <span>Evet, Anahtarı Yenile</span>
                </>
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-sm">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 text-amber-800 dark:text-amber-300">
            <FaExclamationTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1">
              <p className="font-semibold text-xs sm:text-sm">Önemli Bilgilendirme</p>
              <p className="text-xs text-amber-700 dark:text-amber-300/90 leading-relaxed">
                Yeni bir lisans anahtarı üretildiğinde, mevcut anahtarınız <strong>derhal geçersiz kılınır</strong> ve eski cihaz aktivasyonları sıfırlanır.
              </p>
            </div>
          </div>

          <div className="p-3 bg-muted/60 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ürün:</span>
              <span className="font-semibold text-foreground">{selectedLicenseToRotate?.product?.title ?? 'Ürün'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mevcut Anahtar:</span>
              <span className="font-mono text-foreground font-semibold">{selectedLicenseToRotate?.key}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Haklar ve Süre:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Kalan süreniz ve lisans haklarınız aynen korunur.</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Bu işlemi anahtarınızın başkaları tarafından ele geçirildiğini düşündüğünüzde veya temiz bir kurulum yapmak istediğinizde dilediğiniz zaman gerçekleştirebilirsiniz.
          </p>
        </div>
      </Modal>
    </div>
  );
}

function OrdersTab({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) {
    return (
      <EmptyState
        title="Henüz siparişin yok"
        description="Mağazadan dijital ürün satın alarak başlayabilirsin."
        icon="📦"
        action={{ label: 'Mağazaya Git', href: '/magaza' }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const statusClass =
          ORDER_STATUS_STYLES[order.status] ??
          'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';

            const items = resolveOrderItems(order);

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
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm"
                    >
                      <span className="min-w-0 flex-1 truncate flex items-center gap-1.5">
                        {item.href ? (
                          <Link
                            href={item.href}
                            className="hover:text-brand-primary hover:underline"
                          >
                            {item.productTitle}
                          </Link>
                        ) : (
                          item.productTitle
                        )}
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                            {item.badge}
                          </span>
                        )}
                        <span className="text-muted-foreground ml-1">× {item.quantity}</span>
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
  onRotatePrompt,
}: {
  licenses: LicenseRow[];
  onCopy: (key: string) => void;
  onRotatePrompt: (license: LicenseRow) => void;
}) {
  if (licenses.length === 0) {
    return (
      <EmptyState
        title="Henüz lisansın yok"
        description="Bir ürün satın aldığında lisans anahtarın burada görünecek."
        icon="🔑"
        variant="inline"
      />
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
              {license.status === 'active' && (
                <button
                  type="button"
                  onClick={() => onRotatePrompt(license)}
                  className="px-3 py-1.5 rounded-md border border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 text-xs font-medium transition-colors whitespace-nowrap inline-flex items-center gap-1.5"
                  aria-label="Lisans anahtarını yenile"
                  title="Yeni bir anahtar üretir ve eskisini geçersiz kılar"
                >
                  <FaSync className="inline w-3 h-3" />
                  Yenile
                </button>
              )}
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
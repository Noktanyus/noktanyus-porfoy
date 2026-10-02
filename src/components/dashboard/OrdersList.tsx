/**
 * @file OrdersList - Kullanıcının tüm siparişlerini liste halinde gösterir.
 * Order detayları: order number, tarih, status, item listesi, toplam tutar.
 * Dijital ürünlerin yanı sıra Abonelik, API Kredisi ve Bahşiş siparişlerini de
 * eksiksiz ve zengin rozetlerle görüntüler.
 */

import Link from 'next/link';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { resolveOrderItems, type ResolvedOrderItem } from '@/modules/commerce/orderUtils';
import { UserRefundButton } from '@/components/dashboard/UserRefundButton';

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

interface OrderLicenseRow {
  id: string;
  key: string;
  status?: string | null;
}

interface OrderRow {
  id: string;
  orderNumber: string;
  status: OrderStatus | string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  customerEmail: string;
  createdAt: Date | string;
  notes?: string | null;
  metadata?: unknown;
  items: OrderItemRow[];
  licenses?: OrderLicenseRow[];
}

interface OrdersListProps {
  orders: OrderRow[];
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

export function OrdersList({ orders }: OrdersListProps) {
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

        const items: ResolvedOrderItem[] = resolveOrderItems(order);
        const meta = (order.metadata && typeof order.metadata === 'object'
          ? (order.metadata as Record<string, unknown>)
          : {}) as Record<string, unknown>;
        const metaType = typeof meta.type === 'string' ? meta.type.toLowerCase() : '';
        const notes = (order.notes || '').toLowerCase();
        const isSubOrCredit =
          metaType === 'subscription' ||
          metaType === 'api_topup' ||
          notes.startsWith('abonelik') ||
          notes.startsWith('api kredi') ||
          Boolean(meta.planSlug) ||
          Boolean(meta.planId) ||
          typeof meta.credits === 'number';

        return (
          <article key={order.id} className="glass-card-premium p-5">
            <header className="flex flex-wrap items-start justify-between gap-2 mb-4">
              <div className="min-w-0">
                <h3 className="font-semibold font-mono break-all">{order.orderNumber}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusClass}`}
                >
                  {order.status}
                </span>
                <UserRefundButton
                  orderId={order.id}
                  orderNumber={order.orderNumber}
                  orderDate={order.createdAt}
                  status={order.status}
                  totalCents={order.totalCents}
                  currency={order.currency}
                  isSubscriptionOrCredit={isSubOrCredit}
                />
              </div>
            </header>

            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm min-w-[480px]">
                <thead className="text-muted-foreground text-xs uppercase">
                  <tr>
                    <th scope="col" className="text-left p-2 font-medium">Ürün</th>
                    <th scope="col" className="text-center p-2 font-medium w-20">Adet</th>
                    <th scope="col" className="text-right p-2 font-medium w-32">Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-border/40">
                      <td className="p-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.href ? (
                            <Link
                              href={item.href}
                              className="hover:text-brand-primary hover:underline font-medium"
                            >
                              {item.productTitle}
                            </Link>
                          ) : (
                            <span className="font-medium">{item.productTitle}</span>
                          )}
                          {item.badge && (
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide',
                                item.badgeTone === 'brand' &&
                                  'bg-brand-primary/10 text-brand-primary border border-brand-primary/20',
                                item.badgeTone === 'info' &&
                                  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-500/20',
                                item.badgeTone === 'success' &&
                                  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20',
                                (!item.badgeTone || item.badgeTone === 'neutral') &&
                                  'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-border/50'
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        )}
                      </td>
                      <td className="p-2 text-center tabular-nums">{item.quantity}</td>
                      <td className="p-2 text-right font-semibold tabular-nums">
                        {formatCurrency(item.totalCents, order.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {order.taxCents > 0 && (
                    <tr className="border-t border-border/40">
                      <td colSpan={2} className="p-2 text-right text-muted-foreground text-xs">
                        Ara Toplam
                      </td>
                      <td className="p-2 text-right text-sm tabular-nums">
                        {formatCurrency(order.subtotalCents, order.currency)}
                      </td>
                    </tr>
                  )}
                  {order.taxCents > 0 && (
                    <tr>
                      <td colSpan={2} className="p-2 text-right text-muted-foreground text-xs">
                        Vergi
                      </td>
                      <td className="p-2 text-right text-sm tabular-nums">
                        {formatCurrency(order.taxCents, order.currency)}
                      </td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-brand-primary/20">
                    <td colSpan={2} className="p-2 text-right font-bold">
                      Toplam
                    </td>
                    <td className="p-2 text-right text-lg font-bold text-brand-primary tabular-nums">
                      {formatCurrency(order.totalCents, order.currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {order.licenses && order.licenses.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border/40 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Lisans Anahtarı:</span>
                {order.licenses.map((lic) => (
                  <code
                    key={lic.id}
                    className="px-2 py-0.5 rounded bg-muted/70 font-mono text-xs font-semibold text-foreground select-all border border-border/40"
                  >
                    {lic.key}
                  </code>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
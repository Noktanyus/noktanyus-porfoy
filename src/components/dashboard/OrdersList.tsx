/**
 * @file OrdersList - Kullanıcının tüm siparişlerini liste halinde gösterir.
 * Order detayları: order number, tarih, status, item listesi, toplam tutar.
 */

import Link from 'next/link';
import { formatCurrency, formatDateTime } from '@/lib/utils';

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
  customerEmail: string;
  createdAt: Date | string;
  items: OrderItemRow[];
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
            <header className="flex flex-wrap items-start justify-between gap-2 mb-4">
              <div className="min-w-0">
                <h3 className="font-semibold font-mono break-all">{order.orderNumber}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusClass}`}
              >
                {order.status}
              </span>
            </header>

            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm min-w-[480px]">
                <thead className="text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="text-left p-2 font-medium">Ürün</th>
                    <th className="text-center p-2 font-medium w-20">Adet</th>
                    <th className="text-right p-2 font-medium w-32">Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-t border-border/40">
                      <td className="p-2">
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
          </article>
        );
      })}
    </div>
  );
}
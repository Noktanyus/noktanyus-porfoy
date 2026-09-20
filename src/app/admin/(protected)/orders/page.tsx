/**
 * Admin — Siparişler Yönetimi.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { ResponsiveTable } from '@/components/ui/ResponsiveTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Siparişler | Admin',
  description: 'Tüm mağaza ve ürün siparişlerinin listesi ve durumu.',
};

const STATUS_MAP: Record<string, { label: string; tone: StatusTone }> = {
  PAID: { label: 'Ödendi', tone: 'success' },
  PENDING: { label: 'Bekliyor', tone: 'warning' },
  FAILED: { label: 'Başarısız', tone: 'danger' },
  REFUNDED: { label: 'İade Edildi', tone: 'info' },
  PARTIALLY_REFUNDED: { label: 'Kısmi İade', tone: 'info' },
  FULFILLED: { label: 'Tamamlandı', tone: 'success' },
  CANCELED: { label: 'İptal', tone: 'danger' },
};

export default async function AdminOrdersPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return null;
  }

  const orders = await prisma.order.findMany({
    include: {
      items: { include: { product: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="admin-content-spacing space-y-6">
      <PageHeader
        title="Siparişler"
        description="Mağaza üzerinden oluşturulan tüm siparişler, ödeme durumları ve ürün içerikleri."
        breadcrumb={<span>Admin / Siparişler</span>}
      />

      <DashboardSection title={`Toplam ${orders.length} Sipariş`}>
        {orders.length === 0 ? (
          <EmptyState
            variant="card"
            icon="inbox"
            title="Henüz sipariş yok"
            description="Müşteriler ürün veya kredi satın aldığında siparişler burada listelenecektir."
          />
        ) : (
          <ResponsiveTable
            minWidth="780px"
            caption="Mağaza Siparişleri"
            className="rounded-none border-0"
          >
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Sipariş No
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Müşteri
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">
                  Ürünler
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Tutar
                </th>
                <th scope="col" className="px-4 py-3 text-center font-semibold">
                  Durum
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Tarih
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const statusInfo = STATUS_MAP[order.status] ?? {
                  label: order.status,
                  variant: 'default',
                };
                const customerDisplay =
                  order.user?.name ||
                  order.customerName ||
                  order.customerEmail ||
                  'Misafir';

                return (
                  <tr
                    key={order.id}
                    className="border-t border-border/40 transition-colors hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-foreground">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <p className="font-medium text-foreground">{customerDisplay}</p>
                      {order.customerEmail && (
                        <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {order.items.length === 0 ? (
                        <span className="italic text-xs">Paket / Kredi</span>
                      ) : (
                        <div className="space-y-0.5">
                          {order.items.map((item) => (
                            <p key={item.id} className="text-xs truncate max-w-xs">
                              {item.product?.title || 'Dijital Ürün'} × {item.quantity}
                            </p>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(order.totalCents, order.currency)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge
                        size="sm"
                        tone={statusInfo.tone}
                        label={statusInfo.label}
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </ResponsiveTable>
        )}
      </DashboardSection>
    </div>
  );
}

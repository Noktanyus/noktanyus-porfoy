/**
 * @file Admin — Sipariş Detay Sayfası
 * @description Sipariş kalemleri, müşteri bilgileri, üretilen lisanslar, PayTR ödeme dökümü ve iade yönetimi.
 */

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { ResponsiveTable } from '@/components/ui/ResponsiveTable';
import { StatusBadge, type StatusTone } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { resolveOrderItems } from '@/modules/commerce/orderUtils';
import { OrderDetailActions } from '@/components/admin/orders/OrderDetailActions';
import {
  FaArrowLeft,
  FaReceipt,
  FaKey,
  FaUser,
  FaCreditCard,
  FaExternalLinkAlt,
  FaCopy,
} from 'react-icons/fa';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: { orderNumber: true },
  });
  return {
    title: order ? `${order.orderNumber} | Sipariş Detayı | Admin` : 'Sipariş Detayı | Admin',
    description: 'Sipariş ayrıntıları ve yönetim paneli.',
  };
}

const STATUS_MAP: Record<string, { label: string; tone: StatusTone }> = {
  PAID: { label: 'Ödendi', tone: 'success' },
  PENDING: { label: 'Bekliyor', tone: 'warning' },
  FAILED: { label: 'Başarısız', tone: 'danger' },
  REFUNDED: { label: 'İade Edildi', tone: 'info' },
  PARTIALLY_REFUNDED: { label: 'Kısmi İade', tone: 'info' },
  FULFILLED: { label: 'Tamamlandı', tone: 'success' },
  CANCELED: { label: 'İptal', tone: 'danger' },
};

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/giris');
  }
  if (session.user.role !== 'admin') {
    return redirect('/dashboard');
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: { include: { product: true } },
      licenses: {
        include: {
          product: { select: { id: true, title: true, slug: true } },
        },
      },
      user: { select: { id: true, name: true, email: true, role: true } },
      customer: true,
      coupon: true,
    },
  });

  if (!order) {
    notFound();
  }

  const statusInfo = STATUS_MAP[order.status] ?? {
    label: order.status,
    tone: 'default' as StatusTone,
  };

  const customerName =
    order.user?.name || order.customerName || order.customerEmail || 'Bilinmiyor';

  const orderMeta =
    order.metadata && typeof order.metadata === 'object'
      ? (order.metadata as Record<string, any>)
      : {};

  const resolvedItems = resolveOrderItems(order);

  return (
    <div className="admin-content-spacing space-y-6">
      {/* Üst Bar & Geri Dön Linki */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <FaArrowLeft className="text-[10px]" />
            <span>Tüm Siparişlere Dön</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {order.orderNumber}
            </h1>
            <StatusBadge size="md" tone={statusInfo.tone} label={statusInfo.label} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Oluşturulma: {formatDateTime(order.createdAt)}
            {order.deliveredAt && ` • Teslimat: ${formatDateTime(order.deliveredAt)}`}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Toplam Tutar</p>
          <p className="text-2xl font-black text-foreground tabular-nums">
            {formatCurrency(order.totalCents, order.currency)}
          </p>
        </div>
      </div>

      {/* 4 Özet Kartı */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">Ödeme Durumu</span>
            <FaCreditCard className="text-sm" />
          </div>
          <p className="mt-2 text-lg font-bold text-foreground">{statusInfo.label}</p>
          <p className="text-[11px] text-muted-foreground truncate font-mono">
            {order.stripeSessionId ? `OID: ${order.stripeSessionId}` : 'İşlem no yok'}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">Müşteri</span>
            <FaUser className="text-sm" />
          </div>
          <p className="mt-2 text-lg font-bold text-foreground truncate">{customerName}</p>
          <p className="text-[11px] text-muted-foreground truncate">{order.customerEmail}</p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">Ürün / Kalem</span>
            <FaReceipt className="text-sm" />
          </div>
          <p className="mt-2 text-lg font-bold text-foreground">
            {resolvedItems.reduce((acc, i) => acc + i.quantity, 0)} Adet
          </p>
          <p className="text-[11px] text-muted-foreground">
            {resolvedItems.length} farklı sipariş kalemi
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">Lisans Durumu</span>
            <FaKey className="text-sm" />
          </div>
          <p className="mt-2 text-lg font-bold text-foreground">
            {order.licenses.length} Üretildi
          </p>
          <p className="text-[11px] text-muted-foreground">
            {order.licenses.filter((l) => l.status === 'active').length} aktif lisans
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon: Ürünler ve Lisanslar (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sipariş Edilen Ürünler */}
          <DashboardSection title="Sipariş Kalemleri">
            <ResponsiveTable minWidth="550px">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-semibold">Ürün Adı</th>
                  <th scope="col" className="px-4 py-3 text-center font-semibold">Adet</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Birim Fiyat</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Toplam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {resolvedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.productSlug ? (
                          <Link
                            href={`/magaza/${item.productSlug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 hover:text-brand-primary transition-colors"
                          >
                            <span>{item.productTitle}</span>
                            <FaExternalLinkAlt className="text-[10px] text-muted-foreground" />
                          </Link>
                        ) : (
                          <span>{item.productTitle}</span>
                        )}
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {formatCurrency(item.unitPriceCents, order.currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                      {formatCurrency(item.totalCents, order.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </ResponsiveTable>
          </DashboardSection>

          {/* Üretilen Lisanslar */}
          {order.licenses.length > 0 && (
            <DashboardSection title="Siparişe Bağlı Lisans Anahtarları">
              <div className="space-y-3">
                {order.licenses.map((lic) => {
                  const licMeta =
                    lic.metadata && typeof lic.metadata === 'object'
                      ? (lic.metadata as Record<string, any>)
                      : {};
                  const productTitle =
                    (typeof lic.product?.title === 'string' ? lic.product.title : '') ||
                    (typeof licMeta.productTitle === 'string' ? licMeta.productTitle : '') ||
                    'Sanal Ürün Lisansı';
                  const tierLabel = typeof licMeta.tierLabel === 'string' ? licMeta.tierLabel : '';
                  const thirdPartyAppName =
                    typeof licMeta.thirdPartyAppName === 'string' ? licMeta.thirdPartyAppName : '';
                  return (
                    <div
                      key={lic.id}
                      className="rounded-xl border border-border/60 bg-card p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-muted px-2 py-1 font-mono text-sm font-bold text-foreground tracking-wider select-all">
                            {lic.key}
                          </code>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              lic.status === 'active'
                                ? 'bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/20'
                                : 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20'
                            }`}
                          >
                            {lic.status === 'active' ? 'Aktif' : 'İptal Edildi'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {productTitle}
                          {tierLabel ? ` • Paket: ${tierLabel}` : ''}
                          {thirdPartyAppName ? ` • Uygulama: ${thirdPartyAppName}` : ''}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {lic.expiresAt
                            ? `Bitiş: ${formatDateTime(lic.expiresAt)}`
                            : 'Süresiz (Ömür Boyu)'}
                          {` • Maksimum Aktivasyon: ${lic.maxActivations}`}
                        </p>
                      </div>

                      <div>
                        <Link
                          href="/admin/licenses"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition"
                        >
                          <FaKey className="text-[10px]" />
                          <span>Lisans Yönetimi</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DashboardSection>
          )}

          {/* İade ve Not Yönetim Aksiyonları */}
          <DashboardSection title="Sipariş Yönetimi ve Aksiyonlar">
            <OrderDetailActions
              orderId={order.id}
              orderNumber={order.orderNumber}
              status={order.status}
              totalCents={order.totalCents}
              currency={order.currency}
              initialNotes={order.notes}
              refundedAt={order.refundedAt}
              refundReason={order.refundReason}
              metadata={order.metadata}
            />
          </DashboardSection>
        </div>

        {/* Sağ Kolon: Müşteri & Ödeme Bilgileri (1/3) */}
        <div className="space-y-6">
          {/* Finansal Döküm */}
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Ödeme ve Finansal Döküm
            </h3>
            <div className="space-y-2 text-xs divide-y divide-border/40">
              <div className="flex justify-between py-1.5 text-muted-foreground">
                <span>Ara Toplam</span>
                <span className="font-medium tabular-nums text-foreground">
                  {formatCurrency(order.subtotalCents, order.currency)}
                </span>
              </div>

              {order.discountCents > 0 && (
                <div className="flex justify-between py-1.5 text-green-600 dark:text-green-400">
                  <span className="flex items-center gap-1">
                    <span>Kupon İndirimi</span>
                    {order.coupon && (
                      <code className="rounded bg-green-500/10 px-1 py-0.2 font-mono text-[10px]">
                        {order.coupon.code}
                      </code>
                    )}
                  </span>
                  <span className="font-semibold tabular-nums">
                    -{formatCurrency(order.discountCents, order.currency)}
                  </span>
                </div>
              )}

              {order.taxCents > 0 && (
                <div className="flex justify-between py-1.5 text-muted-foreground">
                  <span>KDV / Vergi</span>
                  <span className="font-medium tabular-nums text-foreground">
                    {formatCurrency(order.taxCents, order.currency)}
                  </span>
                </div>
              )}

              <div className="flex justify-between pt-2 text-sm font-bold text-foreground">
                <span>Genel Toplam</span>
                <span className="text-base font-black tabular-nums text-brand-primary">
                  {formatCurrency(order.totalCents, order.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Müşteri Bilgileri */}
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Müşteri Bilgileri
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Ad Soyad:</span>
                <span className="font-semibold text-foreground">{customerName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">E-posta:</span>
                <a
                  href={`mailto:${order.customerEmail}`}
                  className="font-medium text-brand-primary hover:underline"
                >
                  {order.customerEmail}
                </a>
              </div>
              {order.user && (
                <div>
                  <span className="text-muted-foreground block text-[11px]">Sistem Kullanıcısı:</span>
                  <Link
                    href={`/admin/users?q=${order.user.email}`}
                    className="inline-flex items-center gap-1 font-semibold text-brand-primary hover:underline"
                  >
                    <span>{order.user.name || order.user.email}</span>
                    <FaExternalLinkAlt className="text-[10px]" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* PayTR / Ağ Bilgileri */}
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Ağ ve Ödeme Sağlayıcı
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Ödeme Sağlayıcı:</span>
                <span className="font-semibold text-foreground uppercase">
                  {String(orderMeta.provider || 'PayTR')}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">PayTR Merchant OID:</span>
                <code className="font-mono text-[11px] text-foreground block truncate select-all">
                  {order.stripeSessionId || 'Yok'}
                </code>
              </div>
              {order.stripePaymentIntent && (
                <div>
                  <span className="text-muted-foreground block text-[11px]">Ödeme Intent:</span>
                  <code className="font-mono text-[11px] text-foreground block truncate select-all">
                    {order.stripePaymentIntent}
                  </code>
                </div>
              )}
              {Boolean(orderMeta.mode) && (
                <div>
                  <span className="text-muted-foreground block text-[11px]">Ödeme Modu:</span>
                  <span className="font-medium text-foreground">{String(orderMeta.mode)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

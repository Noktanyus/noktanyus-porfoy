/**
 * Dashboard Genel Bakış — sipariş, abonelik ve API özeti.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiKeyService } from '@/modules/api-keys/service';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  FaShoppingCart,
  FaBox,
  FaKey,
  FaCreditCard,
  FaStore,
  FaBook,
} from 'react-icons/fa';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function formatTry(cents: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(cents / 100);
}

export default async function DashboardOverviewPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as { id: string }).id;
  const email = session!.user?.email?.trim().toLowerCase() ?? null;

  const customer = email
    ? await prisma.customer.findFirst({
        where: { OR: [{ userId }, { email }] },
        select: { id: true },
      })
    : await prisma.customer.findFirst({
        where: { userId },
        select: { id: true },
      });

  const orderWhere = {
    OR: [
      { userId },
      ...(email ? [{ customerEmail: email }] : []),
      ...(customer ? [{ customerId: customer.id }] : []),
    ],
  };

  const licenseWhere = {
    OR: [
      { userId },
      ...(customer ? [{ customerId: customer.id }] : []),
    ],
  };

  const [orderCount, licenseCount, apiKeys, subscription, recentOrders, plans] =
    await Promise.all([
      prisma.order.count({ where: orderWhere }),
      prisma.license.count({ where: licenseWhere }),
      apiKeyService.listApiKeys(userId),
      prisma.userSubscription.findFirst({
        where: { userId, status: { in: ['active', 'trialing'] } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.findMany({
        where: orderWhere,
        include: {
          items: { include: { product: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.plan.findMany({ where: { active: true } }),
    ]);

  const planName =
    plans.find((p) => p.slug === subscription?.planSlug)?.name ??
    subscription?.planSlug ??
    null;

  const cards = [
    {
      label: 'Siparişler',
      value: orderCount,
      href: '/dashboard/orders',
      icon: FaShoppingCart,
    },
    {
      label: 'Ürün / Lisans',
      value: licenseCount,
      href: '/dashboard/products',
      icon: FaBox,
    },
    {
      label: 'API Anahtarı',
      value: apiKeys.length,
      href: '/dashboard/api-keys',
      icon: FaKey,
    },
    {
      label: 'Abonelik',
      value: planName ?? 'Yok',
      href: '/dashboard/billing',
      icon: FaCreditCard,
      isText: true,
    },
  ] as const;

  const quickLinks = [
    { href: '/magaza', label: 'Mağazaya git', icon: FaStore },
    { href: '/magaza/abonelikler', label: 'API planları', icon: FaCreditCard },
    { href: '/docs', label: 'API dokümantasyon', icon: FaBook },
    { href: '/dashboard/api-keys/new', label: 'Yeni API anahtarı', icon: FaKey },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Merhaba, ${session?.user?.name ?? 'kullanıcı'}`}
        description="Siparişlerin, ürünlerin ve API erişimin tek yerde"
        actions={
          <Link href="/magaza" className="admin-btn admin-btn-primary self-start">
            Mağazaya Git
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              href={c.href}
              className="glass-card-premium p-4 hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-brand-primary" aria-hidden="true" />
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
              <p
                className={
                  'isText' in c && c.isText
                    ? 'text-lg font-bold truncate'
                    : 'text-2xl font-bold'
                }
              >
                {c.value}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 glass-card-premium p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Son siparişler</h2>
            <Link
              href="/dashboard/orders"
              className="text-sm text-brand-primary hover:underline"
            >
              Tümü
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <EmptyState
              variant="inline"
              title="Henüz sipariş yok"
              description="Mağazadan hazır paket veya API aboneliği satın alabilirsiniz."
              icon="inbox"
              action={{ label: 'Mağazaya Git', href: '/magaza' }}
            />
          ) : (
            <ul className="space-y-2">
              {recentOrders.map((order) => {
                const firstItem =
                  order.items[0]?.productTitle ??
                  order.items[0]?.product?.title ??
                  'Sipariş';
                const extra =
                  order.items.length > 1 ? ` +${order.items.length - 1}` : '';
                return (
                  <li
                    key={order.id}
                    className="flex items-center justify-between gap-3 py-2 border-b last:border-0 border-border/30"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {firstItem}
                        {extra}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('tr-TR')} ·{' '}
                        {order.status}
                      </p>
                    </div>
                    <span className="text-sm font-semibold shrink-0">
                      {formatTry(order.totalCents)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="glass-card-premium p-5 space-y-4">
          <h2 className="font-semibold">Hızlı işlemler</h2>
          <ul className="space-y-2">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 min-h-[44px] text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Icon className="w-4 h-4 text-brand-primary" aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          {planName ? (
            <p className="text-xs text-muted-foreground pt-2 border-t border-border/40">
              Aktif plan:{' '}
              <span className="font-medium text-foreground">{planName}</span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground pt-2 border-t border-border/40">
              API kullanmak için{' '}
              <Link href="/magaza/abonelikler" className="text-brand-primary hover:underline">
                bir plan seçin
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

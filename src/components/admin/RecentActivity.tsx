/**
 * @file Admin Dashboard için son aktiviteler bileşeni.
 * @description Son kayıt olan kullanıcıları, son siparişleri ve son gelen mesajları
 *              üç kolon halinde gösterir. Her kolon kendi başına server-renderable
 *              bir karttır.
 *
 *              Server-renderable (no "use client"): sadece Link ve statik görüntüleme.
 *              Type-safe: Prisma'dan dönen Prisma.JsonObject yerine kendi tiplerimizi kullanır.
 */

import type { ComponentType, SVGProps } from 'react';
import Link from 'next/link';
import { FaUserPlus, FaShoppingCart, FaEnvelope, FaArrowRight } from 'react-icons/fa';
import { formatDate } from '@/lib/utils';

type IconType = ComponentType<SVGProps<SVGSVGElement> & { size?: string | number }>;

export interface RecentUser {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalCents: number;
  currency: string;
  createdAt: Date;
  customerEmail: string;
}

export interface RecentMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  isRead: boolean;
  timestamp: Date;
}

export interface RecentActivityProps {
  users: RecentUser[];
  orders: RecentOrder[];
  messages: RecentMessage[];
}

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    PAID: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    REFUNDED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    FULFILLED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    CANCELED: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };
  const cls = classes[status] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${cls}`}>{status}</span>
  );
}

interface ActivityColumnProps {
  title: string;
  icon: IconType;
  iconColor: string;
  viewAllHref: string;
  emptyText: string;
  children: React.ReactNode;
}

function ActivityColumn({
  title,
  icon: Icon,
  iconColor,
  viewAllHref,
  emptyText,
  children,
}: ActivityColumnProps) {
  return (
    <section className="admin-section flex flex-col">
      <div className="admin-section-header flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="admin-section-title flex items-center gap-2 text-base font-semibold">
          <Icon className={iconColor} aria-hidden="true" />
          <span>{title}</span>
        </h2>
        <Link
          href={viewAllHref}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
        >
          Tümünü Gör
          <FaArrowRight className="w-3 h-3" aria-hidden="true" />
        </Link>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700 flex-1">
        {children ?? <p className="p-4 text-sm text-muted-foreground">{emptyText}</p>}
      </div>
    </section>
  );
}

export function RecentActivity({ users, orders, messages }: RecentActivityProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Son Kullanıcılar */}
      <ActivityColumn
        title="Son Kullanıcılar"
        icon={FaUserPlus}
        iconColor="text-blue-500"
        viewAllHref="/admin/messages"
        emptyText="Henüz kullanıcı yok"
      >
        {users.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Henüz kullanıcı yok</p>
        ) : (
          users.map((u) => (
            <div key={u.id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate text-gray-900 dark:text-white">
                  {u.name ?? 'İsimsiz'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {formatDate(u.createdAt)}
              </span>
            </div>
          ))
        )}
      </ActivityColumn>

      {/* Son Siparişler */}
      <ActivityColumn
        title="Son Siparişler"
        icon={FaShoppingCart}
        iconColor="text-green-500"
        viewAllHref="/admin/messages"
        emptyText="Henüz sipariş yok"
      >
        {orders.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Henüz sipariş yok</p>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm truncate text-gray-900 dark:text-white">
                  {o.orderNumber}
                </p>
                <p className="text-xs text-muted-foreground truncate">{o.customerEmail}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: o.currency?.toUpperCase() ?? 'TRY',
                    maximumFractionDigits: 2,
                  }).format(o.totalCents / 100)}
                </p>
                <div className="mt-1">
                  <StatusBadge status={o.status} />
                </div>
              </div>
            </div>
          ))
        )}
      </ActivityColumn>

      {/* Son Mesajlar */}
      <ActivityColumn
        title="Son Mesajlar"
        icon={FaEnvelope}
        iconColor="text-pink-500"
        viewAllHref="/admin/messages"
        emptyText="Henüz mesaj yok"
      >
        {messages.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Henüz mesaj yok</p>
        ) : (
          messages.map((m) => (
            <Link
              key={m.id}
              href="/admin/messages"
              className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate text-gray-900 dark:text-white">
                    {m.subject}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {m.name} - {m.email}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!m.isRead && (
                    <span
                      className="w-2 h-2 rounded-full bg-blue-500"
                      aria-label="Okunmamış"
                      title="Okunmamış"
                    />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(m.timestamp)}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </ActivityColumn>
    </div>
  );
}

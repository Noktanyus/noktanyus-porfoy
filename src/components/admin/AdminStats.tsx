/**
 * @file Admin Dashboard için istatistik kartları bileşeni.
 * @description Tüm modüllerin (kullanıcı, içerik, ticaret, monitoring, API,
 *              newsletter, lisans) özet istatistiklerini bölümler halinde gösterir.
 *
 *              Server-renderable (no "use client"): sadece Link ve statik görüntüleme.
 *              Type-safe: Prisma'dan dönen veri tiplerini kullanır.
 *              Performans: Hiçbir client-side state yok, sıfır JS bundle.
 */

import type { ComponentType, SVGProps } from 'react';
import {
  FaUsers,
  FaBlog,
  FaProjectDiagram,
  FaStore,
  FaShoppingCart,
  FaMoneyBillWave,
  FaHeartbeat,
  FaKey,
  FaEnvelope,
  FaCertificate,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaFire,
  FaTrophy,
} from 'react-icons/fa';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

// react-icons'dan gelen IconType bir ComponentType<SVGProps<SVGSVGElement>>
type IconType = ComponentType<SVGProps<SVGSVGElement> & { size?: string | number }>;

interface StatCardProps {
  label: string;
  value: string | number;
  icon: IconType;
  color: string;
  href?: string;
  change?: { value: number; suffix?: string };
}

function StatCard({ label, value, icon: Icon, color, href, change }: StatCardProps) {
  const content = (
    <div className="admin-card hover:shadow-md transition-shadow h-full">
      <div className="flex items-start justify-between mb-3">
        <Icon className={`w-6 h-6 ${color}`} aria-hidden="true" />
        {change && (
          <span
            className={`text-xs font-medium flex items-center gap-1 ${
              change.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {change.value >= 0 ? (
              <FaArrowUp className="w-3 h-3" aria-hidden="true" />
            ) : (
              <FaArrowDown className="w-3 h-3" aria-hidden="true" />
            )}
            {Math.abs(change.value)}
            {change.suffix ?? ''}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
      >
        {content}
      </Link>
    );
  }
  return content;
}

interface SectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
        <span aria-hidden="true">{icon}</span>
        <span>{title}</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">{children}</div>
    </section>
  );
}

export interface AdminStatsProps {
  users: {
    total: number;
    newToday: number;
    active: number;
  };
  content: {
    blogs: number;
    projects: number;
    products: number;
    blogViews: number;
    topPost: { title: string; views: number; slug: string } | null;
  };
  commerce: {
    orders: number;
    pending: number;
    paid: number;
    totalRevenueCents: number;
    monthRevenueCents: number;
  };
  monitoring: {
    total: number;
    up: number;
    down: number;
  };
  api: {
    keys: number;
    subscriptions: number;
  };
  newsletter: {
    total: number;
    verified: number;
  };
  licenses: number;
}

export function AdminStats({
  users,
  content,
  commerce,
  monitoring,
  api,
  newsletter,
  licenses,
}: AdminStatsProps) {
  return (
    <div className="space-y-6">
      {/* KULLANICILAR */}
      <Section title="Kullanıcılar" icon="👥">
        <StatCard
          label="Toplam Kullanıcı"
          value={users.total}
          icon={FaUsers}
          color="text-blue-500"
        />
        <StatCard
          label="Bugün Yeni"
          value={users.newToday}
          icon={FaUsers}
          color="text-green-500"
        />
        <StatCard
          label="Aktif (7 gün)"
          value={users.active}
          icon={FaUsers}
          color="text-purple-500"
        />
      </Section>

      {/* İÇERİK */}
      <Section title="İçerik" icon="📝">
        <StatCard
          label="Blog Yazısı"
          value={content.blogs}
          icon={FaBlog}
          color="text-orange-500"
          href="/admin/blog"
        />
        <StatCard
          label="Proje"
          value={content.projects}
          icon={FaProjectDiagram}
          color="text-cyan-500"
          href="/admin/projects"
        />
        <StatCard
          label="Ürün"
          value={content.products}
          icon={FaStore}
          color="text-pink-500"
          href="/admin/products"
        />
      </Section>

      {/* BLOG ANALYTICS (Phase 6) */}
      <Section title="Blog Analytics" icon="📊">
        <StatCard
          label="Toplam Görüntülenme"
          value={content.blogViews.toLocaleString('tr-TR')}
          icon={FaEye}
          color="text-indigo-500"
          href="/admin/blog"
        />
        <StatCard
          label="Blog Yazısı"
          value={content.blogs}
          icon={FaBlog}
          color="text-orange-500"
          href="/admin/blog"
        />
        <StatCard
          label="En Popüler Yazı"
          value={content.topPost ? content.topPost.views.toLocaleString('tr-TR') : '—'}
          icon={FaFire}
          color="text-red-500"
          href={content.topPost ? `/admin/blog/edit/${content.topPost.slug}` : '/admin/blog'}
        />
        {content.topPost && (
          <div className="admin-card h-full flex flex-col justify-center">
            <FaTrophy className="w-5 h-5 text-amber-500 mb-2" aria-hidden="true" />
            <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
              {content.topPost.title}
            </p>
            <p className="text-xs text-muted-foreground mt-1">En çok okunan yazı</p>
          </div>
        )}
      </Section>

      {/* TİCARET */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
          <span aria-hidden="true">💰</span>
          <span>Ticaret</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard
            label="Toplam Sipariş"
            value={commerce.orders}
            icon={FaShoppingCart}
            color="text-blue-500"
          />
          <StatCard
            label="Bekleyen"
            value={commerce.pending}
            icon={FaShoppingCart}
            color="text-yellow-500"
          />
          <StatCard
            label="Tamamlanan"
            value={commerce.paid}
            icon={FaShoppingCart}
            color="text-green-500"
          />
          <StatCard
            label="Toplam Gelir"
            value={formatCurrency(commerce.totalRevenueCents, 'TRY')}
            icon={FaMoneyBillWave}
            color="text-emerald-500"
          />
          <StatCard
            label="Bu Ay Gelir"
            value={formatCurrency(commerce.monthRevenueCents, 'TRY')}
            icon={FaMoneyBillWave}
            color="text-emerald-600"
          />
        </div>
      </section>

      {/* MONİTORİNG */}
      <Section title="Monitoring" icon="📡">
        <StatCard
          label="Toplam Monitör"
          value={monitoring.total}
          icon={FaHeartbeat}
          color="text-blue-500"
        />
        <StatCard
          label="Çalışıyor"
          value={monitoring.up}
          icon={FaHeartbeat}
          color="text-green-500"
        />
        <StatCard
          label="Çalışmıyor"
          value={monitoring.down}
          icon={FaHeartbeat}
          color="text-red-500"
        />
      </Section>

      {/* API & ABONELİKLER + NEWSLETTER + LİSANSLAR */}
      <Section title="API, Abonelikler, Newsletter ve Lisanslar" icon="🔌">
        <StatCard
          label="Aktif API Anahtarı"
          value={api.keys}
          icon={FaKey}
          color="text-purple-500"
        />
        <StatCard
          label="Aktif Abonelik"
          value={api.subscriptions}
          icon={FaCertificate}
          color="text-indigo-500"
        />
        <StatCard
          label="Newsletter Abonesi"
          value={newsletter.total}
          icon={FaEnvelope}
          color="text-pink-500"
          href="/admin/newsletter"
        />
        <StatCard
          label="Doğrulanmış Abone"
          value={newsletter.verified}
          icon={FaEnvelope}
          color="text-rose-500"
          href="/admin/newsletter"
        />
        <StatCard
          label="Toplam Lisans"
          value={licenses}
          icon={FaCertificate}
          color="text-amber-500"
        />
      </Section>
    </div>
  );
}

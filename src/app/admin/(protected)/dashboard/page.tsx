/**
 * @file Yönetim paneli ana gösterge sayfası (server component).
 * @description Bu sayfa, tüm modüller için özet istatistikleri ve son aktiviteleri
 *              tek bir sayfada sunar. Veriler Prisma üzerinden server-side olarak
 *              paralel sorgularla çekilir (force-dynamic: her istekte fresh data).
 *
 *              Bölümler:
 *              - Kullanıcılar (toplam, bugün yeni, 7 gün aktif)
 *              - İçerik (blog, proje, ürün)
 *              - Ticaret (siparişler, gelir)
 *              - Monitoring (toplam, çalışıyor, çalışmıyor)
 *              - API & Abonelikler
 *              - Newsletter & Lisanslar
 *              - Son Aktiviteler (kullanıcılar, siparişler, mesajlar)
 */

import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { AdminStats } from '@/components/admin/AdminStats';
import { RecentActivity } from '@/components/admin/RecentActivity';

// Her istekte fresh data (dashboard için gerekli)
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Sistem özeti ve son aktiviteler',
};

export default async function AdminDashboardPage() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Tüm sorguları paralel çalıştır (performans)
  const [
    totalUsers,
    newUsersToday,
    activeUsers,
    totalBlogs,
    totalProjects,
    totalProducts,
    totalOrders,
    pendingOrders,
    paidOrders,
    revenueAgg,
    monthRevenueAgg,
    totalMonitors,
    upMonitors,
    downMonitors,
    totalApiKeys,
    activeSubscriptions,
    newsletterSubscribers,
    activeNewsletter,
    totalLicenses,
    recentUsers,
    recentOrders,
    recentMessages,
    // Blog analytics (Phase 6)
    blogViewsAgg,
    topBlog,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.user.count({ where: { updatedAt: { gte: weekStart } } }),
    prisma.blog.count(),
    prisma.project.count(),
    prisma.digitalProduct.count({ where: { active: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'PAID' } }),
    prisma.order.aggregate({
      where: { status: 'PAID' },
      _sum: { totalCents: true },
    }),
    prisma.order.aggregate({
      where: { status: 'PAID', createdAt: { gte: monthStart } },
      _sum: { totalCents: true },
    }),
    prisma.monitor.count(),
    prisma.monitor.count({ where: { status: 'UP' } }),
    prisma.monitor.count({ where: { status: 'DOWN' } }),
    prisma.apiKey.count({ where: { revokedAt: null } }),
    prisma.userSubscription.count({ where: { status: 'active' } }),
    prisma.newsletterSubscriber.count(),
    prisma.newsletterSubscriber.count({ where: { active: true, verifiedAt: { not: null } } }),
    prisma.license.count(),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalCents: true,
        currency: true,
        createdAt: true,
        customerEmail: true,
      },
    }),
    prisma.message.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
        isRead: true,
        timestamp: true,
      },
    }),
    // Blog analytics
    prisma.blog.aggregate({ _sum: { viewCount: true } }),
    prisma.blog.findFirst({
      orderBy: { viewCount: 'desc' },
      select: { title: true, viewCount: true, slug: true },
    }),
  ]);

  const totalRevenueCents = revenueAgg._sum.totalCents ?? 0;
  const monthRevenueCents = monthRevenueAgg._sum.totalCents ?? 0;
  const totalBlogViews = blogViewsAgg._sum.viewCount ?? 0;

  return (
    <div className="admin-content-spacing">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-subtitle">Sistem özeti ve son aktiviteler</p>
        </div>
      </div>

      <AdminStats
        users={{ total: totalUsers, newToday: newUsersToday, active: activeUsers }}
        content={{
          blogs: totalBlogs,
          projects: totalProjects,
          products: totalProducts,
          blogViews: totalBlogViews,
          topPost: topBlog ? { title: topBlog.title, views: topBlog.viewCount, slug: topBlog.slug } : null,
        }}
        commerce={{
          orders: totalOrders,
          pending: pendingOrders,
          paid: paidOrders,
          totalRevenueCents,
          monthRevenueCents,
        }}
        monitoring={{ total: totalMonitors, up: upMonitors, down: downMonitors }}
        api={{ keys: totalApiKeys, subscriptions: activeSubscriptions }}
        newsletter={{ total: newsletterSubscribers, verified: activeNewsletter }}
        licenses={totalLicenses}
      />

      <RecentActivity
        users={recentUsers}
        orders={recentOrders}
        messages={recentMessages}
      />
    </div>
  );
}

/**
 * @file Revenue Service
 * @description G1: Subscription + Order verilerinden gerçek metrikleri hesaplar.
 *              Prisma üzerinden aylık agregasyon yapar.
 */

import { prisma } from "@/lib/prisma";
import { computeMetrics, trendPercent, type RevenueMetrics, type RevenueInputs } from "./metrics";
import type { SubscriptionStatus } from "@prisma/client";

export interface RevenueTrend {
  current: RevenueMetrics;
  previous: RevenueMetrics;
  trend: {
    mrr: number;
    arr: number;
    churnRate: number;
    ltv: number;
    arpu: number;
  };
}

export const revenueService = {
  /**
   * Şu anki metrikler. DB'den aktif abonelik + order verilerini çeker.
   */
  async getCurrentMetrics(): Promise<RevenueMetrics> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Aktif abonelikler
    const activeSubs = await prisma.subscription.findMany({
      where: { status: "active" },
      include: { plan: true },
    });

    // Her aktif abonelik için plan fiyatını aylık olarak hesapla
    const monthlyRevenue = activeSubs.reduce((sum, sub) => {
      const planPrice = Number(sub.plan.price);
      const intervalFactor =
        sub.plan.interval === "year"
          ? 1 / 12
          : sub.plan.interval === "month"
          ? 1
          : 1; // week için de 1 (basit yaklaşım)
      return sum + planPrice * intervalFactor;
    }, 0);

    // Bu ay churn'lenen abonelikler
    const churnedThisMonth = await prisma.subscription.count({
      where: {
        status: { in: ["canceled", "expired"] },
        updatedAt: { gte: monthStart },
      },
    });

    // Ay başındaki aktif abonelikler (şimdi aktif + bu ay churn)
    const activeAtStartOfMonth = activeSubs.length + churnedThisMonth;

    // Toplam müşteri
    const totalCustomers = await prisma.customer.count();

    // Ortalama ömür — en eski aktif abonelik ile şimdi arasındaki fark
    const oldestActive = activeSubs
      .map((s) => s.createdAt)
      .sort((a, b) => a.getTime() - b.getTime())[0];
    const averageLifetimeMonths = oldestActive
      ? Math.max(
          1,
          Math.round(
            (now.getTime() - oldestActive.getTime()) / (1000 * 60 * 60 * 24 * 30)
          )
        )
      : 12; // Default 12 ay

    const inputs: RevenueInputs = {
      monthlyRecurringRevenue: monthlyRevenue,
      churnedThisMonth,
      activeAtStartOfMonth,
      totalCustomers,
      averageLifetimeMonths,
    };

    return computeMetrics(inputs);
  },

  /**
   * Trend analizi — şu anki ve önceki dönem karşılaştırması.
   */
  async getTrend(): Promise<RevenueTrend> {
    const current = await this.getCurrentMetrics();
    const previous = await this.getPreviousMonthMetrics();

    return {
      current,
      previous,
      trend: {
        mrr: trendPercent(current.mrr, previous.mrr),
        arr: trendPercent(current.arr, previous.arr),
        churnRate: trendPercent(current.churnRate, previous.churnRate),
        ltv: trendPercent(current.ltv, previous.ltv),
        arpu: trendPercent(current.arpu, previous.arpu),
      },
    };
  },

  /**
   * Önceki ayın metrikleri (karşılaştırma için).
   */
  async getPreviousMonthMetrics(): Promise<RevenueMetrics> {
    const now = new Date();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

    const prevActiveSubs = await prisma.subscription.findMany({
      where: {
        createdAt: { lt: prevMonthEnd },
        OR: [
          { status: "active" },
          { updatedAt: { gte: prevMonthStart, lt: prevMonthEnd } },
        ],
      },
      include: { plan: true },
    });

    const monthlyRevenue = prevActiveSubs.reduce((sum, sub) => {
      const planPrice = Number(sub.plan.price);
      const intervalFactor =
        sub.plan.interval === "year" ? 1 / 12 : sub.plan.interval === "month" ? 1 : 1;
      return sum + planPrice * intervalFactor;
    }, 0);

    const churned = prevActiveSubs.filter((s) => s.status === "canceled" || s.status === "expired").length;
    const totalActive = prevActiveSubs.length;

    const inputs: RevenueInputs = {
      monthlyRecurringRevenue: monthlyRevenue,
      churnedThisMonth: churned,
      activeAtStartOfMonth: totalActive + churned,
      totalCustomers: totalActive,
      averageLifetimeMonths: 12,
    };

    return computeMetrics(inputs);
  },

  /**
   * Subscription durumuna göre dağılım.
   */
  async getSubscriptionDistribution(): Promise<Record<SubscriptionStatus, number>> {
    const subs = await prisma.subscription.groupBy({
      by: ["status"],
      _count: true,
    });

    const result: Record<string, number> = {};
    subs.forEach((s) => {
      result[s.status] = s._count;
    });

    return result as Record<SubscriptionStatus, number>;
  },
};
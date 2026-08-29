/**
 * @file GraphQL Resolvers
 * @description D1: GraphQL resolver implementasyonları.
 *              Prisma + mevcut servisler üzerinden veri sağlar.
 */

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { computeMetrics, type RevenueInputs } from "@/modules/revenue/metrics";
import type { GraphQLContext } from "./context";

export const resolvers = {
  Query: {
    user: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      if (!ctx.userId) throw new Error("Authentication required");
      return prisma.user.findUnique({ where: { id: args.id } });
    },

    users: async (
      _: unknown,
      args: { limit?: number; offset?: number },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId || ctx.role !== "admin") throw new Error("Admin only");
      return prisma.user.findMany({
        take: args.limit ?? 20,
        skip: args.offset ?? 0,
        orderBy: { createdAt: "desc" },
      });
    },

    order: async (_: unknown, args: { id: string }) => {
      return prisma.order.findUnique({
        where: { id: args.id },
        include: { items: true },
      });
    },

    orders: async (
      _: unknown,
      args: {
        status?: string;
        customerId?: string;
        limit?: number;
        offset?: number;
      }
    ) => {
      const where: Record<string, unknown> = {};
      if (args.status) where.status = args.status;
      if (args.customerId) where.customerId = args.customerId;

      return prisma.order.findMany({
        where,
        take: args.limit ?? 20,
        skip: args.offset ?? 0,
        orderBy: { createdAt: "desc" },
        include: { items: true },
      });
    },

    plans: async () => {
      return prisma.plan.findMany({
        where: { active: true },
        orderBy: { price: "asc" },
      });
    },

    revenueMetrics: async () => {
      // Active subscriptions
      const activeSubs = await prisma.subscription.findMany({
        where: { status: "active" },
        include: { plan: true },
      });

      const monthlyRevenue = activeSubs.reduce((sum, sub) => {
        const planPrice = Number(sub.plan.price);
        const intervalFactor =
          sub.plan.interval === "year"
            ? 1 / 12
            : sub.plan.interval === "month"
            ? 1
            : 1;
        return sum + planPrice * intervalFactor;
      }, 0);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const churnedThisMonth = await prisma.subscription.count({
        where: {
          status: { in: ["canceled", "expired"] },
          updatedAt: { gte: monthStart },
        },
      });

      const totalCustomers = await prisma.customer.count();

      const inputs: RevenueInputs = {
        monthlyRecurringRevenue: monthlyRevenue,
        churnedThisMonth,
        activeAtStartOfMonth: activeSubs.length + churnedThisMonth,
        totalCustomers,
        averageLifetimeMonths: 12,
      };

      return computeMetrics(inputs);
    },

    health: () => "ok",
  },

  Mutation: {
    updateOrderStatus: async (
      _: unknown,
      args: { orderId: string; status: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId || ctx.role !== "admin") {
        throw new Error("Admin only");
      }
      return prisma.order.update({
        where: { id: args.orderId },
        data: { status: args.status as "pending" | "paid" | "failed" | "refunded" | "canceled" },
        include: { items: true },
      });
    },

    updateUserRole: async (
      _: unknown,
      args: { userId: string; role: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId || ctx.role !== "admin") {
        throw new Error("Admin only");
      }
      return prisma.user.update({
        where: { id: args.userId },
        data: { role: args.role },
      });
    },
  },

  Order: {
    items: async (parent: { id: string }) => {
      return prisma.orderItem.findMany({ where: { orderId: parent.id } });
    },
  },
};

/**
 * GraphQL context — her request'te oluşturulur.
 * NextAuth session'ından user bilgisi alınır.
 */
export async function createGraphQLContext(): Promise<GraphQLContext> {
  let userId: string | null = null;
  let role: string | null = null;

  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      userId = (session.user as { id?: string }).id ?? null;
      role = (session.user as { role?: string }).role ?? null;
    }
  } catch {
    // Auth opsiyonel — public query'ler de çalışmalı
  }

  return { userId, role };
}
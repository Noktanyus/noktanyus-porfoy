/**
 * @file GraphQL resolvers
 * @description Thin resolver layer mapping GraphQL queries to Prisma access.
 *              All queries are read-only; mutations are intentionally not
 *              exposed in this version (write operations should use REST).
 */

import { prisma } from '@/lib/prisma';

interface BlogFilterInput {
  category?: string;
  search?: string;
}

export const resolvers = {
  Query: {
    blogs: (_: unknown, { limit = 10 }: { limit?: number }) =>
      prisma.blog.findMany({
        take: limit,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          date: true,
          category: true,
        },
      }),

    blog: (_: unknown, { slug }: { slug: string }) =>
      prisma.blog.findUnique({
        where: { slug },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          date: true,
          category: true,
        },
      }),

    projects: (_: unknown, { limit = 10 }: { limit?: number }) =>
      prisma.project.findMany({
        take: limit,
        orderBy: { order: 'asc' },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          featured: true,
          isLive: true,
        },
      }),

    project: (_: unknown, { slug }: { slug: string }) =>
      prisma.project.findUnique({
        where: { slug },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          featured: true,
          isLive: true,
        },
      }),

    products: (
      _: unknown,
      { activeOnly = true, limit = 10 }: { activeOnly?: boolean; limit?: number }
    ) =>
      prisma.digitalProduct.findMany({
        where: { active: activeOnly },
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          shortDescription: true,
          priceCents: true,
          currency: true,
          active: true,
        },
      }),

    product: (_: unknown, { slug }: { slug: string }) =>
      prisma.digitalProduct.findUnique({
        where: { slug },
        select: {
          id: true,
          slug: true,
          title: true,
          shortDescription: true,
          priceCents: true,
          currency: true,
          active: true,
        },
      }),

    plans: () =>
      prisma.plan.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          slug: true,
          name: true,
          priceCents: true,
          currency: true,
          features: true,
        },
      }),

    plan: (_: unknown, { slug }: { slug: string }) =>
      prisma.plan.findUnique({
        where: { slug },
        select: {
          id: true,
          slug: true,
          name: true,
          priceCents: true,
          currency: true,
          features: true,
        },
      }),

    monitors: (_: unknown, { activeOnly = true }: { activeOnly?: boolean }) =>
      prisma.monitor.findMany({
        where: activeOnly ? { status: { not: 'PAUSED' } } : undefined,
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          name: true,
          url: true,
          status: true,
        },
      }),

    blogsConnection: async (
      _: unknown,
      { filter, limit = 10 }: { filter?: BlogFilterInput; limit?: number }
    ) => {
      const where: Record<string, unknown> = {};
      if (filter?.category) {
        where.category = filter.category;
      }
      if (filter?.search) {
        where.OR = [
          { title: { contains: filter.search, mode: 'insensitive' } },
          { description: { contains: filter.search, mode: 'insensitive' } },
        ];
      }

      const [nodes, totalCount] = await Promise.all([
        prisma.blog.findMany({
          where,
          take: limit,
          orderBy: { date: 'desc' },
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            date: true,
            category: true,
          },
        }),
        prisma.blog.count({ where }),
      ]);

      return { nodes, totalCount };
    },
  },

  // Field-level resolvers — convert DateTime to ISO string for stable GraphQL output
  Blog: {
    date: (parent: { date: Date | string }) =>
      parent.date instanceof Date ? parent.date.toISOString() : String(parent.date),
  },

  // features is stored as JSON; coerce to string[] for the schema contract
  Plan: {
    features: (parent: { features: unknown }) => {
      if (Array.isArray(parent.features)) {
        return parent.features as string[];
      }
      if (typeof parent.features === 'string') {
        try {
          const parsed = JSON.parse(parent.features);
          return Array.isArray(parsed) ? (parsed as string[]) : [];
        } catch {
          return [];
        }
      }
      return [];
    },
  },
};
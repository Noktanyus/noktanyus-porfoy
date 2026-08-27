/**
 * GET /api/search
 *
 * Global arama: blog, proje, dijital ürün ve planlar içinde arama yapar.
 * Query params:
 *   - q (zorunlu): arama terimi (2-100 karakter)
 *   - type (opsiyonel): "all" | "blog" | "project" | "product" | "plan" (default: all)
 *   - limit (opsiyonel): her kategori için max sonuç (1-50, default: 10)
 *
 * Rate-limited (genel API limiti). Tüm kategoriler paralel sorgulanır.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ok, withErrorHandling } from '@/lib/apiResponse';
import { withRateLimit } from '@/lib/rateLimitMiddleware';
import { RateLimits } from '@/lib/rateLimit';

const SearchSchema = z.object({
  q: z.string().min(2).max(100),
  type: z.enum(['all', 'blog', 'project', 'product', 'plan']).optional().default('all'),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export const GET = withRateLimit(RateLimits.api, async (req: NextRequest) => {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(req.url);
    const data = SearchSchema.parse({
      q: searchParams.get('q') ?? '',
      type: searchParams.get('type') ?? 'all',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 10,
    });

    const q = data.q.toLowerCase().trim();

    const [blogs, projects, products, plans] = await Promise.all([
      data.type === 'all' || data.type === 'blog'
        ? prisma.blog.findMany({
            where: {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            },
            take: data.limit,
            orderBy: { date: 'desc' },
          })
        : Promise.resolve([]),
      data.type === 'all' || data.type === 'project'
        ? prisma.project.findMany({
            where: {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            },
            take: data.limit,
            orderBy: { order: 'asc' },
          })
        : Promise.resolve([]),
      data.type === 'all' || data.type === 'product'
        ? prisma.digitalProduct.findMany({
            where: {
              active: true,
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { shortDescription: { contains: q, mode: 'insensitive' } },
              ],
            },
            take: data.limit,
            orderBy: { order: 'asc' },
          })
        : Promise.resolve([]),
      data.type === 'all' || data.type === 'plan'
        ? prisma.plan.findMany({
            where: {
              active: true,
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            },
            take: data.limit,
            orderBy: { order: 'asc' },
          })
        : Promise.resolve([]),
    ]);

    return ok({
      blog: blogs.map((b) => ({
        type: 'blog' as const,
        id: b.id,
        slug: b.slug,
        title: b.title,
        description: b.description,
        thumbnail: b.thumbnail,
        category: b.category,
      })),
      project: projects.map((p) => ({
        type: 'project' as const,
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: p.description,
        thumbnail: p.mainImage,
        technologies: p.technologies,
      })),
      product: products.map((p) => ({
        type: 'product' as const,
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: p.shortDescription,
        thumbnail: p.thumbnail,
        priceCents: p.priceCents,
        currency: p.currency,
      })),
      plan: plans.map((p) => ({
        type: 'plan' as const,
        id: p.id,
        slug: p.slug,
        title: p.name,
        description: p.description ?? '',
        priceCents: p.priceCents,
        currency: p.currency,
      })),
      total: blogs.length + projects.length + products.length + plans.length,
    });
  });
});
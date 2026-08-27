/**
 * Comments Module — Repository Layer
 *
 * Blog yorumlarına erişim. BaseRepository + domain method'ları
 * (findByBlogId, countByBlogId, listForAdmin).
 */

import { BaseRepository } from '../shared/repository';
import type { Comment } from '@prisma/client';

export class CommentRepository extends BaseRepository<Comment> {
  protected get model() {
    return this.prisma.comment;
  }

  /**
   * Blog yazısına ait top-level yorumları, onaylı yanıtlarla birlikte getir.
   */
  async findByBlogId(blogId: string, opts?: { limit?: number; approved?: boolean }) {
    return this.prisma.comment.findMany({
      where: {
        blogId,
        parentId: null,
        ...(opts?.approved !== false ? { approved: true } : {}),
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        replies: {
          where: { approved: true },
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: opts?.limit ?? 50,
    });
  }

  /**
   * Blog'daki onaylı yorum sayısı (top-level + replies dahil).
   */
  async countByBlogId(blogId: string): Promise<number> {
    return this.prisma.comment.count({
      where: { blogId, approved: true },
    });
  }

  /**
   * Admin paneli için tüm yorumları listele.
   */
  async listForAdmin(blogId?: string) {
    return this.prisma.comment.findMany({
      where: blogId ? { blogId } : undefined,
      include: {
        user: { select: { name: true, email: true } },
        blog: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}

export const commentRepository = new CommentRepository();

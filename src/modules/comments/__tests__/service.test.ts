/**
 * Comment Service — Unit Tests
 *
 * Test edilenler:
 *   - Module exports & surface
 *   - Profanity guard
 *   - Ownership check
 *   - Reply parent validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Prisma mock
vi.mock('@/lib/prisma', () => ({
  prisma: {
    comment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Logger mock
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { commentService } from '../service';

describe('CommentService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('module surface', () => {
    it('exposes core functions', () => {
      expect(typeof commentService.addComment).toBe('function');
      expect(typeof commentService.getComments).toBe('function');
      expect(typeof commentService.getCommentCount).toBe('function');
      expect(typeof commentService.updateComment).toBe('function');
      expect(typeof commentService.deleteComment).toBe('function');
    });
  });

  describe('addComment', () => {
    it('yeni yorum oluşturur', async () => {
      vi.mocked(prisma.comment.create).mockResolvedValue({
        id: 'c-1',
        blogId: 'b-1',
        userId: 'u-1',
        content: 'Harika yazı',
        parentId: null,
        approved: true,
        flagged: false,
        editedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await commentService.addComment('u-1', {
        blogId: 'b-1',
        content: 'Harika yazı',
      });

      expect(result.id).toBe('c-1');
      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          blogId: 'b-1',
          userId: 'u-1',
          content: 'Harika yazı',
          parentId: null,
        }),
      });
    });

    it('profanity içeren yorumu reddeder', async () => {
      await expect(
        commentService.addComment('u-1', {
          blogId: 'b-1',
          content: 'Bu spam casino reklamıdır',
        })
      ).rejects.toThrow();
      expect(prisma.comment.create).not.toHaveBeenCalled();
    });

    it('parentId verilmişse parent yorumu doğrular', async () => {
      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 'p-1',
        blogId: 'b-1',
        userId: 'u-2',
        content: 'parent',
        parentId: null,
        approved: true,
        flagged: false,
        editedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.mocked(prisma.comment.create).mockResolvedValue({} as any);

      await commentService.addComment('u-1', {
        blogId: 'b-1',
        content: 'Yanıt yorum',
        parentId: 'p-1',
      });

      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ parentId: 'p-1' }),
      });
    });

    it('farklı blogId parent için hata fırlatır', async () => {
      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 'p-1',
        blogId: 'OTHER-BLOG',
        userId: 'u-2',
        content: 'parent',
        parentId: null,
        approved: true,
        flagged: false,
        editedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await expect(
        commentService.addComment('u-1', {
          blogId: 'b-1',
          content: 'Yanıt yorum',
          parentId: 'p-1',
        })
      ).rejects.toThrow();
      expect(prisma.comment.create).not.toHaveBeenCalled();
    });
  });

  describe('updateComment', () => {
    it('sahibi düzenleyebilir', async () => {
      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 'c-1',
        userId: 'u-1',
        blogId: 'b-1',
        content: 'eski',
        parentId: null,
        approved: true,
        flagged: false,
        editedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.mocked(prisma.comment.update).mockResolvedValue({} as any);

      await commentService.updateComment('u-1', 'c-1', 'yeni içerik');

      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: 'c-1' },
        data: expect.objectContaining({
          content: 'yeni içerik',
          editedAt: expect.any(Date),
        }),
      });
    });

    it('başka kullanıcı düzenleyemez', async () => {
      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 'c-1',
        userId: 'u-1',
        blogId: 'b-1',
        content: 'eski',
        parentId: null,
        approved: true,
        flagged: false,
        editedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await expect(
        commentService.updateComment('u-2', 'c-1', 'hacklendi')
      ).rejects.toThrow();
      expect(prisma.comment.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteComment', () => {
    it('sahibi silebilir', async () => {
      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 'c-1',
        userId: 'u-1',
        blogId: 'b-1',
        content: '',
        parentId: null,
        approved: true,
        flagged: false,
        editedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.mocked(prisma.comment.delete).mockResolvedValue({} as any);

      await commentService.deleteComment('u-1', false, 'c-1');

      expect(prisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 'c-1' },
      });
    });

    it('admin başkasının yorumunu silebilir', async () => {
      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 'c-1',
        userId: 'u-1',
        blogId: 'b-1',
        content: '',
        parentId: null,
        approved: true,
        flagged: false,
        editedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.mocked(prisma.comment.delete).mockResolvedValue({} as any);

      await commentService.deleteComment('u-admin', true, 'c-1');

      expect(prisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 'c-1' },
      });
    });

    it('yetkisiz kullanıcı silemez', async () => {
      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        id: 'c-1',
        userId: 'u-1',
        blogId: 'b-1',
        content: '',
        parentId: null,
        approved: true,
        flagged: false,
        editedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await expect(
        commentService.deleteComment('u-2', false, 'c-1')
      ).rejects.toThrow();
      expect(prisma.comment.delete).not.toHaveBeenCalled();
    });
  });

  describe('getComments', () => {
    it('repository.findByBlogId çağırır', async () => {
      vi.mocked(prisma.comment.findMany).mockResolvedValue([]);

      const result = await commentService.getComments('b-1');

      expect(prisma.comment.findMany).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});

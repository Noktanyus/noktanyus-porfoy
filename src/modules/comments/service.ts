/**
 * Comments Module — Service Layer
 *
 * Yorum business logic: ekleme, düzenleme, silme, moderasyon.
 * Profanity guard, ownership kontrolü, admin bypass.
 */

import { commentRepository } from './repository';
import type { CreateCommentInput } from './schemas';
import { NotFoundError, ValidationError, ForbiddenError } from '@/modules/shared/errors';
import { logger } from '@/lib/logger';

const BANNED_WORDS = ['spam', 'casino', 'viagra'];

export const commentService = {
  /**
   * Blog yazısının tüm yorumlarını getir (top-level + replies).
   */
  async getComments(blogId: string) {
    return commentRepository.findByBlogId(blogId);
  },

  /**
   * Blog yazısının onaylı yorum sayısı.
   */
  async getCommentCount(blogId: string) {
    return commentRepository.countByBlogId(blogId);
  },

  /**
   * Yeni yorum ekle. Profanity kontrolü yapar.
   */
  async addComment(userId: string, input: CreateCommentInput) {
    const lowerContent = input.content.toLowerCase();
    const hasBanned = BANNED_WORDS.some((w) => lowerContent.includes(w));
    if (hasBanned) {
      throw new ValidationError('Yorum uygunsuz içerik barındırıyor');
    }

    // Parent comment aynı blog'da mı kontrol et (nested reply ise)
    if (input.parentId) {
      const parent = await commentRepository.findById(input.parentId);
      if (!parent) {
        throw new NotFoundError('Yanıtlanan yorum');
      }
      if (parent.blogId !== input.blogId) {
        throw new ValidationError('Yanıt farklı bir yazıya ait olamaz');
      }
    }

    const comment = await commentRepository.create({
      blogId: input.blogId,
      userId,
      content: input.content.trim(),
      parentId: input.parentId ?? null,
    });

    logger.info('Comment created', {
      commentId: comment.id,
      userId,
      blogId: input.blogId,
      isReply: Boolean(input.parentId),
    });

    return comment;
  },

  /**
   * Yorum düzenle. Sadece sahibi düzenleyebilir.
   */
  async updateComment(userId: string, commentId: string, content: string) {
    const existing = await commentRepository.findById(commentId);
    if (!existing) throw new NotFoundError('Yorum');
    if (existing.userId !== userId) {
      throw new ForbiddenError('Bu yorumu düzenleme yetkiniz yok');
    }

    const lowerContent = content.toLowerCase();
    const hasBanned = BANNED_WORDS.some((w) => lowerContent.includes(w));
    if (hasBanned) {
      throw new ValidationError('Yorum uygunsuz içerik barındırıyor');
    }

    const updated = await commentRepository.update(commentId, {
      content: content.trim(),
      editedAt: new Date(),
    });

    logger.info('Comment updated', { commentId, userId });
    return updated;
  },

  /**
   * Yorum sil. Sahibi veya admin silebilir.
   */
  async deleteComment(userId: string, isAdmin: boolean, commentId: string) {
    const existing = await commentRepository.findById(commentId);
    if (!existing) throw new NotFoundError('Yorum');
    if (existing.userId !== userId && !isAdmin) {
      throw new ForbiddenError('Bu yorumu silme yetkiniz yok');
    }

    await commentRepository.delete(commentId);
    logger.info('Comment deleted', { commentId, userId, byAdmin: isAdmin });
  },

  /**
   * Yorumu şikayet et (flag).
   */
  async flagComment(commentId: string) {
    const existing = await commentRepository.findById(commentId);
    if (!existing) throw new NotFoundError('Yorum');

    return commentRepository.update(commentId, { flagged: true });
  },

  /**
   * Yorumu onayla (admin moderation).
   */
  async approveComment(commentId: string) {
    const existing = await commentRepository.findById(commentId);
    if (!existing) throw new NotFoundError('Yorum');

    return commentRepository.update(commentId, {
      approved: true,
      flagged: false,
    });
  },

  /**
   * Admin için tüm yorumları listele.
   */
  async listForAdmin(blogId?: string) {
    return commentRepository.listForAdmin(blogId);
  },
};

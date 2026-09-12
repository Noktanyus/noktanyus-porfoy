/**
 * Mağaza — ürün Q&A.
 * Soru: giriş yapmış kullanıcı. Cevap: ürün sahibi (admin) veya admin rolü API katmanında.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ValidationError, NotFoundError, ForbiddenError } from '@/modules/shared/errors';

export const questionService = {
  async ask(askerId: string, productId: string, question: string) {
    if (!question || question.trim().length < 5) {
      throw new ValidationError('Soru en az 5 karakter olmalı');
    }
    if (question.length > 1000) {
      throw new ValidationError('Soru en fazla 1000 karakter olabilir');
    }

    const product = await prisma.digitalProduct.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) throw new NotFoundError('Ürün');

    const created = await prisma.productQuestion.create({
      data: {
        productId,
        askerId,
        question: question.trim(),
      },
      include: {
        asker: { select: { id: true, name: true, image: true } },
      },
    });

    logger.info('Product question asked', { questionId: created.id, productId });
    return created;
  },

  /**
   * Ürün sahibi (admin) veya açıkça yetkili kullanıcı cevaplar.
   */
  async answer(questionId: string, responderId: string, answerText: string, opts?: { isAdmin?: boolean }) {
    if (!answerText || answerText.trim().length < 2) {
      throw new ValidationError('Cevap en az 2 karakter olmalı');
    }

    const question = await prisma.productQuestion.findUnique({
      where: { id: questionId },
      include: { product: { select: { ownerId: true } } },
    });
    if (!question) throw new NotFoundError('Soru');

    const isOwner = question.product.ownerId === responderId;
    if (!isOwner && !opts?.isAdmin) {
      throw new ForbiddenError('Bu soruyu cevaplayamazsınız');
    }

    return prisma.productQuestion.update({
      where: { id: questionId },
      data: {
        answer: answerText.trim(),
        answeredAt: new Date(),
        answeredBy: responderId,
      },
    });
  },

  async listForProduct(productId: string) {
    return prisma.productQuestion.findMany({
      where: { productId },
      include: {
        asker: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};

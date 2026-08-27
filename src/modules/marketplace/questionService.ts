/**
 * Marketplace 2.0 — Product Question (Q&A) Service
 *
 * Kullanıcıların ürün hakkında soru sorması, vendor'ların cevap vermesi.
 * - Public okuma: cevaplanmış + onaylı sorular
 * - Auth gerekli: soru sormak için
 * - Vendor: kendi ürününe cevap verebilir
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ValidationError, NotFoundError, ForbiddenError } from '@/modules/shared/errors';

export const questionService = {
  /**
   * Kullanıcı bir ürüne soru sorar.
   */
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
   * Vendor kendi ürününe cevap verir.
   */
  async answer(questionId: string, vendorUserId: string, answerText: string) {
    if (!answerText || answerText.trim().length < 2) {
      throw new ValidationError('Cevap en az 2 karakter olmalı');
    }

    const question = await prisma.productQuestion.findUnique({
      where: { id: questionId },
      include: { product: { select: { vendorId: true, ownerId: true } } },
    });
    if (!question) throw new NotFoundError('Soru');

    // Vendor (veya owner) cevaplayabilir
    const isVendor = question.product.vendorId
      ? await prisma.vendorProfile.findFirst({
          where: { id: question.product.vendorId, userId: vendorUserId },
        })
      : null;

    if (!isVendor && question.product.ownerId !== vendorUserId) {
      throw new ForbiddenError('Bu soruyu cevaplayamazsınız');
    }

    return prisma.productQuestion.update({
      where: { id: questionId },
      data: {
        answer: answerText.trim(),
        answeredAt: new Date(),
        answeredBy: vendorUserId,
      },
    });
  },

  /**
   * Ürünün tüm sorularını listeler (cevaplanmış + cevaplanmamış).
   * Public erişim için cevaplanmamış sorular gizlenebilir, ama burada hepsi dönülüyor.
   */
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
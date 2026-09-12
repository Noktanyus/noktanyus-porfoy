import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    productQuestion: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    digitalProduct: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { prisma } from '@/lib/prisma';
import { questionService } from '../questionService';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('questionService — ask', () => {
  it('throws when question too short', async () => {
    await expect(questionService.ask('u-1', 'p-1', 'kısa')).rejects.toThrow();
  });

  it('throws when product not found', async () => {
    (prisma.digitalProduct.findUnique as any).mockResolvedValueOnce(null);
    await expect(
      questionService.ask('u-1', 'p-1', 'Geçerli bir soru metni')
    ).rejects.toThrow(/Ürün/);
  });

  it('creates question when input is valid', async () => {
    (prisma.digitalProduct.findUnique as any).mockResolvedValueOnce({ id: 'p-1' });
    (prisma.productQuestion.create as any).mockResolvedValueOnce({
      id: 'q-1',
      productId: 'p-1',
      askerId: 'u-1',
      question: 'Bu ürün ne işe yarar?',
    });
    const result = await questionService.ask('u-1', 'p-1', 'Bu ürün ne işe yarar?');
    expect(result.id).toBe('q-1');
  });
});

describe('questionService — answer', () => {
  it('throws when answer text is too short', async () => {
    await expect(questionService.answer('q-1', 'admin-1', 'a')).rejects.toThrow();
  });

  it('throws when question not found', async () => {
    (prisma.productQuestion.findUnique as any).mockResolvedValueOnce(null);
    await expect(questionService.answer('q-1', 'admin-1', 'Cevap metni')).rejects.toThrow(/Soru/);
  });

  it('throws when answerer is not owner and not admin', async () => {
    (prisma.productQuestion.findUnique as any).mockResolvedValueOnce({
      id: 'q-1',
      product: { ownerId: 'owner-1' },
    });

    await expect(questionService.answer('q-1', 'random-user', 'Cevap metni')).rejects.toThrow(
      /cevaplayamazsınız/i
    );
  });

  it('allows product owner to answer', async () => {
    (prisma.productQuestion.findUnique as any).mockResolvedValueOnce({
      id: 'q-1',
      product: { ownerId: 'owner-1' },
    });
    (prisma.productQuestion.update as any).mockResolvedValueOnce({
      id: 'q-1',
      answer: 'Cevap metni',
    });

    const result = await questionService.answer('q-1', 'owner-1', 'Cevap metni');
    expect(result.answer).toBe('Cevap metni');
  });

  it('allows admin flag to answer', async () => {
    (prisma.productQuestion.findUnique as any).mockResolvedValueOnce({
      id: 'q-1',
      product: { ownerId: 'owner-1' },
    });
    (prisma.productQuestion.update as any).mockResolvedValueOnce({
      id: 'q-1',
      answer: 'Admin cevabı',
    });

    const result = await questionService.answer('q-1', 'admin-x', 'Admin cevabı', {
      isAdmin: true,
    });
    expect(result.answer).toBe('Admin cevabı');
  });
});

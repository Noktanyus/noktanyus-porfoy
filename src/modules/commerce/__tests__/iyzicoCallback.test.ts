/**
 * iyzico callback fulfillment tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/modules/commerce/iyzicoService', () => ({
  iyzicoService: {
    retrieveCheckout: vi.fn(),
  },
  IYZICO_MOCK_TOKEN_PREFIX: 'mock_iyzico_',
}));

vi.mock('@/modules/commerce/service', () => ({
  commerceService: {
    handleCheckoutCompleted: vi.fn(),
    activateIyzicoSubscription: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { prisma } from '@/lib/prisma';
import { iyzicoService } from '@/modules/commerce/iyzicoService';
import { commerceService } from '@/modules/commerce/service';
import { fulfillIyzicoToken } from '../iyzicoCallback';

describe('fulfillIyzicoToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects empty token', async () => {
    const result = await fulfillIyzicoToken('  ');
    expect(result).toEqual({ ok: false, reason: 'invalid_token' });
  });

  it('returns failed when retrieve is not SUCCESS', async () => {
    vi.mocked(iyzicoService.retrieveCheckout).mockResolvedValue({
      status: 'failure',
      errorMessage: 'nope',
    });
    const result = await fulfillIyzicoToken('tok_1');
    expect(result).toEqual({ ok: false, reason: 'failed' });
  });

  it('completes a matching PENDING order', async () => {
    vi.mocked(iyzicoService.retrieveCheckout).mockResolvedValue({
      status: 'success',
      paymentStatus: 'SUCCESS',
      token: 'tok_1',
      itemTransactions: [
        {
          itemId: 'p1',
          paymentTransactionId: 'tx_99',
          transactionStatus: 1,
          price: '10.00',
          paidPrice: '10.00',
        },
      ],
    });
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'ord_1',
      orderNumber: 'NK-01',
      metadata: {},
    } as never);
    vi.mocked(prisma.order.update).mockResolvedValue({} as never);

    const result = await fulfillIyzicoToken('tok_1');

    expect(commerceService.handleCheckoutCompleted).toHaveBeenCalledWith({
      id: 'tok_1',
      payment_intent: 'tx_99',
    });
    expect(result).toEqual({ ok: true, kind: 'order', orderNumber: 'NK-01' });
  });

  it('activates matching incomplete subscription when no order', async () => {
    vi.mocked(iyzicoService.retrieveCheckout).mockResolvedValue({
      status: 'success',
      paymentStatus: 'SUCCESS',
      token: 'tok_sub',
    });
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
      id: 'sub_1',
      plan: { slug: 'pro' },
    } as never);

    const result = await fulfillIyzicoToken('tok_sub');

    expect(commerceService.activateIyzicoSubscription).toHaveBeenCalledWith('sub_1', {
      paymentTransactionId: undefined,
    });
    expect(result).toEqual({ ok: true, kind: 'subscription', planSlug: 'pro' });
  });
});

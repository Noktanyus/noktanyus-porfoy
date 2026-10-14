/**
 * PayTR Webhook Route Security Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/paytr', () => ({
  isPaytrConfigured: vi.fn(() => true),
}));

vi.mock('@/modules/commerce/paytrService', () => ({
  paytrService: {
    verifyCallback: vi.fn(),
  },
}));

vi.mock('@/modules/commerce/service', () => ({
  commerceService: {
    handleCheckoutCompleted: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { paytrService } from '@/modules/commerce/paytrService';
import { commerceService } from '@/modules/commerce/service';
import { POST } from '../route';

function createFormRequest(fields: Record<string, string>): NextRequest {
  const params = new URLSearchParams(fields);
  return new NextRequest('http://localhost:3000/api/webhooks/paytr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
}

describe('POST /api/webhooks/paytr', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid hash with 400', async () => {
    vi.mocked(paytrService.verifyCallback).mockReturnValue({
      ok: false,
      merchantOid: 'OID1',
      status: 'failed',
      totalAmount: '1000',
    });

    const req = createFormRequest({ merchant_oid: 'OID1', hash: 'badhash' });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain('bad hash');
    expect(commerceService.handleCheckoutCompleted).not.toHaveBeenCalled();
  });

  it('returns OK for unknown merchant_oid without infinite retry', async () => {
    vi.mocked(paytrService.verifyCallback).mockReturnValue({
      ok: true,
      merchantOid: 'OID_NOT_FOUND',
      status: 'success',
      totalAmount: '1000',
    });
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

    const req = createFormRequest({ merchant_oid: 'OID_NOT_FOUND' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('OK');
    expect(commerceService.handleCheckoutCompleted).not.toHaveBeenCalled();
  });

  it('rejects amount mismatch with 400 and cancels order', async () => {
    vi.mocked(paytrService.verifyCallback).mockReturnValue({
      ok: true,
      merchantOid: 'OID1',
      status: 'success',
      totalAmount: '100', // 1 TL sent by attacker
    });

    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'ord_1',
      stripeSessionId: 'OID1',
      status: 'PENDING',
      totalCents: 50000, // Expected 500 TL
      notes: null,
    } as any);

    const req = createFormRequest({ merchant_oid: 'OID1' });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain('amount mismatch');

    // Must mark order CANCELED with note
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ord_1' },
        data: expect.objectContaining({
          status: 'CANCELED',
        }),
      })
    );
    expect(commerceService.handleCheckoutCompleted).not.toHaveBeenCalled();
  });

  it('approves order and calls handleCheckoutCompleted on valid hash and matching amount', async () => {
    vi.mocked(paytrService.verifyCallback).mockReturnValue({
      ok: true,
      merchantOid: 'OID1',
      status: 'success',
      totalAmount: '50000', // Exactly 500 TL (50000 kuruş)
    });

    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'ord_1',
      stripeSessionId: 'OID1',
      status: 'PENDING',
      totalCents: 50000,
    } as any);

    const req = createFormRequest({ merchant_oid: 'OID1' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('OK');
    expect(commerceService.handleCheckoutCompleted).toHaveBeenCalledWith({
      id: 'OID1',
      payment_intent: 'paytr_OID1',
    });
  });

  it('cancels order when PayTR returns status failed', async () => {
    vi.mocked(paytrService.verifyCallback).mockReturnValue({
      ok: true,
      merchantOid: 'OID1',
      status: 'failed',
      totalAmount: '50000',
      failedReasonCode: '101',
      failedReasonMsg: 'Insufficient balance',
    });

    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'ord_1',
      stripeSessionId: 'OID1',
      status: 'PENDING',
      totalCents: 50000,
      notes: null,
    } as any);

    const req = createFormRequest({ merchant_oid: 'OID1' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('OK');
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ord_1' },
        data: expect.objectContaining({
          status: 'CANCELED',
          notes: expect.stringContaining('Insufficient balance'),
        }),
      })
    );
    expect(commerceService.handleCheckoutCompleted).not.toHaveBeenCalled();
  });
});

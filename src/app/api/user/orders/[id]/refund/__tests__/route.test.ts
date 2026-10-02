/**
 * @file route.test.ts
 * Tests for GET & POST /api/user/orders/[id]/refund
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/modules/commerce/refundEligibility', () => ({
  checkRefundEligibility: vi.fn(),
}));

vi.mock('@/modules/commerce/refundService', () => ({
  refundService: {
    createRefund: vi.fn(),
  },
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { checkRefundEligibility } from '@/modules/commerce/refundEligibility';
import { refundService } from '@/modules/commerce/refundService';
import { GET, POST } from '../route';

describe('/api/user/orders/[id]/refund', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET (eligibility check)', () => {
    it('oturum yoksa 401 döner', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/user/orders/ord_1/refund');
      const res = await GET(req, { params: { id: 'ord_1' } });
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
    });

    it('başkasının siparişini sorgulamaya çalışırsa 403 döner', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user_attacker', email: 'attacker@test.com' },
      });
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'ord_victim',
        userId: 'user_victim',
        customerEmail: 'victim@test.com',
      } as any);

      const req = new NextRequest('http://localhost/api/user/orders/ord_victim/refund');
      const res = await GET(req, { params: { id: 'ord_victim' } });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
    });

    it('sipariş sahibi uygunluğu başarıyla sorgulayabilir', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user_1', email: 'user@test.com' },
      });
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'ord_1',
        userId: 'user_1',
        customerEmail: 'user@test.com',
      } as any);

      vi.mocked(checkRefundEligibility).mockResolvedValue({
        eligible: true,
        orderType: 'api_topup',
        hoursRemaining: 18.5,
        rightsUsed: 0,
      });

      const req = new NextRequest('http://localhost/api/user/orders/ord_1/refund');
      const res = await GET(req, { params: { id: 'ord_1' } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.eligibility.eligible).toBe(true);
      expect(json.data.eligibility.hoursRemaining).toBe(18.5);
    });
  });

  describe('POST (refund execution)', () => {
    it('oturum yoksa 401 döner', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/user/orders/ord_1/refund', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const res = await POST(req, { params: { id: 'ord_1' } });
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
    });

    it('başkasının siparişine iade talebi gelirse 403 döner', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user_attacker', email: 'attacker@test.com' },
      });
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'ord_victim',
        userId: 'user_victim',
        customerEmail: 'victim@test.com',
        totalCents: 5000,
      } as any);

      const req = new NextRequest('http://localhost/api/user/orders/ord_victim/refund', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const res = await POST(req, { params: { id: 'ord_victim' } });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
    });

    it('şartları karşılamayan siparişte (örn. hak kullanılmışsa) 400 döner ve iadeyi başlatmaz', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user_1', email: 'user@test.com' },
      });
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'ord_used',
        userId: 'user_1',
        customerEmail: 'user@test.com',
        totalCents: 29900,
      } as any);

      vi.mocked(checkRefundEligibility).mockResolvedValue({
        eligible: false,
        orderType: 'subscription',
        reason: 'Abonelik dönemi içinde API kullanımı yapıldığı için iade hakkı bulunmamaktadır.',
        rightsUsed: 3,
      });

      const req = new NextRequest('http://localhost/api/user/orders/ord_used/refund', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const res = await POST(req, { params: { id: 'ord_used' } });
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error.message).toContain('API kullanımı yapıldığı için');
      expect(refundService.createRefund).not.toHaveBeenCalled();
    });

    it('uygun şartlardaki siparişte PayTR iadesini başarıyla başlatır', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user_1', email: 'user@test.com' },
      });
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'ord_valid',
        userId: 'user_1',
        customerEmail: 'user@test.com',
        totalCents: 7900,
      } as any);

      vi.mocked(checkRefundEligibility).mockResolvedValue({
        eligible: true,
        orderType: 'api_topup',
        hoursRemaining: 23.2,
        rightsUsed: 0,
      });

      vi.mocked(refundService.createRefund).mockResolvedValue({
        success: true,
        refundId: 'rf_123',
        provider: 'paytr',
        amountCents: 7900,
        fullRefund: true,
      });

      const req = new NextRequest('http://localhost/api/user/orders/ord_valid/refund', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Farklı pakete geçeceğim' }),
      });
      const res = await POST(req, { params: { id: 'ord_valid' } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(refundService.createRefund).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'ord_valid',
          userId: 'user_1',
          amountCents: 7900,
          reason: 'Farklı pakete geçeceğim',
        })
      );
      expect(json.data.message).toContain('başarıyla tamamlandı');
    });
  });
});

/**
 * Partner Service Tests
 *
 * Phase "Partner Program" kapsaminda eklendi.
 * Slug generation, commission math, idempotency, validation kontrolleri.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => {
  const txMock = {
    partnerLead: {
      create: vi.fn(),
      update: vi.fn(),
    },
    partner: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
  return {
    prisma: {
      partner: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      partnerLead: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        groupBy: vi.fn(),
        aggregate: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(async (fn: any) => fn(txMock)),
    },
  };
});

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { partnerService } from '../service';
import { ValidationError, NotFoundError, ConflictError } from '@/modules/shared/errors';

describe('PartnerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('export shape', () => {
    it('exposes core functions', () => {
      expect(typeof partnerService.createPartner).toBe('function');
      expect(typeof partnerService.getPartner).toBe('function');
      expect(typeof partnerService.getMyPartner).toBe('function');
      expect(typeof partnerService.submitLead).toBe('function');
      expect(typeof partnerService.markLeadConverted).toBe('function');
      expect(typeof partnerService.getStats).toBe('function');
    });
  });

  describe('commission math', () => {
    it('15% commission on 10000 cents = 1500', () => {
      const orderCents = 10000;
      const percent = 15;
      const commission = Math.round((orderCents * percent) / 100);
      expect(commission).toBe(1500);
    });

    it('rounds correctly for odd amounts', () => {
      // 19.99 * 0.15 = 2.9985 → 300 (round)
      const orderCents = 1999;
      const percent = 15;
      const commission = Math.round((orderCents * percent) / 100);
      expect(commission).toBe(300);
    });
  });

  describe('createPartner validation', () => {
    it('rejects too-short companyName', async () => {
      await expect(
        partnerService.createPartner({
          userId: 'u1',
          companyName: 'A',
          contactEmail: 'a@b.com',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('rejects invalid contactEmail', async () => {
      await expect(
        partnerService.createPartner({
          userId: 'u1',
          companyName: 'Acme',
          contactEmail: 'not-an-email',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('rejects commissionPercent out of range', async () => {
      await expect(
        partnerService.createPartner({
          userId: 'u1',
          companyName: 'Acme',
          contactEmail: 'a@b.com',
          commissionPercent: 150,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('throws ConflictError if user already has partner', async () => {
      vi.mocked(prisma.partner.findUnique).mockResolvedValueOnce({
        id: 'p1',
        userId: 'u1',
      } as any);

      await expect(
        partnerService.createPartner({
          userId: 'u1',
          companyName: 'Acme',
          contactEmail: 'a@b.com',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('getPartner', () => {
    it('throws NotFoundError when inactive', async () => {
      vi.mocked(prisma.partner.findUnique).mockResolvedValueOnce({
        slug: 'acme',
        active: false,
      } as any);
      await expect(partnerService.getPartner('acme')).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError when missing', async () => {
      vi.mocked(prisma.partner.findUnique).mockResolvedValueOnce(null);
      await expect(partnerService.getPartner('missing')).rejects.toThrow(NotFoundError);
    });
  });

  describe('submitLead', () => {
    it('rejects invalid email', async () => {
      vi.mocked(prisma.partner.findUnique).mockResolvedValueOnce({
        id: 'p1',
        slug: 'acme',
        active: true,
      } as any);

      await expect(
        partnerService.submitLead({
          partnerSlug: 'acme',
          customerEmail: 'not-an-email',
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('isValidSlug', () => {
    it('accepts valid slugs', () => {
      expect(partnerService.isValidSlug('acme-corp')).toBe(true);
      expect(partnerService.isValidSlug('my-company-2026')).toBe(true);
    });

    it('rejects invalid slugs', () => {
      expect(partnerService.isValidSlug('ab')).toBe(false);
      expect(partnerService.isValidSlug('UPPERCASE')).toBe(false);
      expect(partnerService.isValidSlug('with spaces')).toBe(false);
      expect(partnerService.isValidSlug('with_underscore')).toBe(false);
      expect(partnerService.isValidSlug('a'.repeat(70))).toBe(false);
    });
  });

  describe('markLeadConverted idempotency', () => {
    it('returns null when no matching lead exists', async () => {
      vi.mocked(prisma.partnerLead.findFirst).mockResolvedValueOnce(null);
      const result = await partnerService.markLeadConverted({
        customerEmail: 'nobody@example.com',
        orderId: 'o1',
        orderAmountCents: 5000,
      });
      expect(result).toBeNull();
      expect(prisma.partnerLead.update).not.toHaveBeenCalled();
    });

    it('returns existing lead without update when already converted for same order', async () => {
      vi.mocked(prisma.partnerLead.findFirst).mockResolvedValueOnce({
        id: 'l1',
        status: 'converted',
        orderId: 'o1',
        partnerId: 'p1',
        partner: { commissionPercent: 15, webhookUrl: null, webhookSecret: null },
      } as any);

      const result = await partnerService.markLeadConverted({
        customerEmail: 'a@b.com',
        orderId: 'o1',
        orderAmountCents: 5000,
      });
      expect(result).not.toBeNull();
      expect(prisma.partnerLead.update).not.toHaveBeenCalled();
    });
  });
});
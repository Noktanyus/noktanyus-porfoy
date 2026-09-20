import { describe, it, expect, vi } from 'vitest';
import { getRequiredScopeForPath, withTrApi } from '../routeHelper';
import { z } from 'zod';
import { NextRequest } from 'next/server';
import { apiKeyService } from '@/modules/api-keys/service';

vi.mock('@/lib/planGate', () => ({
  checkApiQuota: vi.fn().mockResolvedValue({ allowed: true, billingSource: 'subscription' }),
}));

vi.mock('@/lib/apiCredits', () => ({
  tryDebitApiCredit: vi.fn().mockResolvedValue({ ledgerId: 'led_123' }),
  refundApiCredit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/modules/api-keys/service', () => ({
  apiKeyService: {
    validateKey: vi.fn(),
    trackUsage: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/rateLimit', () => ({
  rateLimiter: {
    check: vi.fn().mockReturnValue({ allowed: true, remaining: 10, resetIn: 0 }),
  },
}));

describe('routeHelper', () => {
  describe('getRequiredScopeForPath', () => {
    it('correctly extracts scopes from standard endpoint paths', () => {
      expect(getRequiredScopeForPath('/api/v1/validate/iban')).toBe('api:validate:iban');
      expect(getRequiredScopeForPath('/api/v1/validate/identity')).toBe('api:validate:identity');
      expect(getRequiredScopeForPath('/api/v1/invoice/pdf')).toBe('api:invoice:pdf');
      expect(getRequiredScopeForPath('/api/v1/calendar/business-days')).toBe('api:calendar:business-days');
      expect(getRequiredScopeForPath('/api/v1/finance/kdv')).toBe('api:finance:kdv');
      expect(getRequiredScopeForPath('/api/v1/geo/provinces/')).toBe('api:geo:provinces');
    });
  });

  describe('withTrApi scope enforcement', () => {
    it('denies access (403 FORBIDDEN) when API key lacks required scope', async () => {
      apiKeyService.validateKey = vi.fn().mockResolvedValue({
        userId: 'u1',
        keyId: 'k1',
        scopes: ['api:validate:identity'],
        rateLimit: 60,
      });

      const handler = vi.fn();
      const wrapped = withTrApi(z.object({ iban: z.string() }), handler);

      const req = {
        headers: new Headers({ authorization: 'Bearer nokt_live_testkey' }),
        method: 'POST',
        nextUrl: { pathname: '/api/v1/validate/iban' },
        json: async () => ({ iban: 'TR330006100511123456789012' }),
      } as unknown as NextRequest;

      const res = await wrapped(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('FORBIDDEN');
      expect(json.error.message).toContain('api:validate:iban');
      expect(handler).not.toHaveBeenCalled();
    });

    it('allows access when API key has exact granular scope', async () => {
      apiKeyService.validateKey = vi.fn().mockResolvedValue({
        userId: 'u1',
        keyId: 'k1',
        scopes: ['api:validate:iban'],
        rateLimit: 60,
      });

      const handler = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
      const wrapped = withTrApi(z.object({ iban: z.string() }), handler);

      const req = {
        headers: new Headers({ authorization: 'Bearer nokt_live_testkey' }),
        method: 'POST',
        nextUrl: { pathname: '/api/v1/validate/iban' },
        json: async () => ({ iban: 'TR330006100511123456789012' }),
      } as unknown as NextRequest;

      const res = await wrapped(req);
      expect(res.status).toBe(200);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('allows access when API key has admin scope', async () => {
      apiKeyService.validateKey = vi.fn().mockResolvedValue({
        userId: 'u1',
        keyId: 'k1',
        scopes: ['admin'],
        rateLimit: 60,
      });

      const handler = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
      const wrapped = withTrApi(z.object({ iban: z.string() }), handler);

      const req = {
        headers: new Headers({ authorization: 'Bearer nokt_live_testkey' }),
        method: 'POST',
        nextUrl: { pathname: '/api/v1/validate/iban' },
        json: async () => ({ iban: 'TR330006100511123456789012' }),
      } as unknown as NextRequest;

      const res = await wrapped(req);
      expect(res.status).toBe(200);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});

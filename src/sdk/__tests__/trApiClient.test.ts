import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NoktanyusTrClient, NoktanyusApiError } from '../trApiClient';

describe('NoktanyusTrClient', () => {
  const mockApiKey = 'nok_live_test1234567890';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('throws when initialized without apiKey', () => {
    expect(() => new NoktanyusTrClient({ apiKey: '' })).toThrow(
      'NoktanyusTrClient: apiKey parametresi zorunludur.'
    );
  });

  it('executes validateIban and returns data on 200 OK', async () => {
    const mockSuccessResponse = {
      success: true,
      data: {
        valid: true,
        iban: 'TR330006100511123456789012',
        formatted: 'TR33 0006 1005 1112 3456 7890 12',
        bankCode: '0061',
        bankName: 'Türkiye Garanti Bankası A.Ş.',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockSuccessResponse,
    } as unknown as Response);

    const client = new NoktanyusTrClient({ apiKey: mockApiKey, baseUrl: 'https://test.noktanyus.com' });
    const result = await client.validateIban('TR330006100511123456789012');

    expect(result.valid).toBe(true);
    expect(result.bankName).toBe('Türkiye Garanti Bankası A.Ş.');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://test.noktanyus.com/api/v1/validate/iban',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-api-key': mockApiKey,
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('throws NoktanyusApiError with fieldErrors on 400 Bad Request', async () => {
    const mockErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION',
        message: {
          formErrors: [],
          fieldErrors: {
            iban: ['Geçersiz IBAN formatı'],
          },
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => mockErrorResponse,
    } as unknown as Response);

    const client = new NoktanyusTrClient({ apiKey: mockApiKey });

    await expect(client.validateIban('invalid_iban')).rejects.toThrow(NoktanyusApiError);

    try {
      await client.validateIban('invalid_iban');
    } catch (err) {
      const apiErr = err as NoktanyusApiError;
      expect(apiErr.code).toBe('VALIDATION');
      expect(apiErr.statusCode).toBe(400);
      expect(apiErr.fieldErrors?.iban).toContain('Geçersiz IBAN formatı');
    }
  });

  it('throws NoktanyusApiError on 401 Unauthorized', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'API key required' },
      }),
    } as unknown as Response);

    const client = new NoktanyusTrClient({ apiKey: 'invalid_key' });

    await expect(client.validateIban('TR330006100511123456789012')).rejects.toThrow(
      'API key required'
    );
  });
});

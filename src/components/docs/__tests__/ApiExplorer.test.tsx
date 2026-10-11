import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ApiExplorer } from '../ApiExplorer';

const MOCK_OPENAPI = {
  openapi: '3.1.0',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {
    '/api/v1/validate/iban': {
      post: {
        summary: 'TR IBAN Doğrulama',
        description: '26 karakterlik IBAN mod97 kontrolü',
        tags: ['TR API'],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['iban'],
                properties: {
                  iban: { type: 'string', description: 'TR IBAN' },
                },
              },
              example: { iban: 'TR330006100511123456789012' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Başarılı',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    valid: { type: 'boolean' },
                  },
                },
                example: { success: true, data: { valid: true } },
              },
            },
          },
        },
      },
    },
    '/api/v1/finance/kdv': {
      post: {
        summary: 'KDV Hesaplama',
        description: 'KDV dahil ve hariç tutar hesaplama',
        tags: ['TR API'],
        requestBody: {
          content: {
            'application/json': {
              example: { amount: 1000, rate: 20 },
            },
          },
        },
        responses: {
          '200': {
            content: {
              'application/json': {
                example: { success: true, data: { kdvAmount: 200 } },
              },
            },
          },
        },
      },
    },
  },
};

describe('ApiExplorer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_OPENAPI,
    } as Response);
  });

  it('renders loading state then endpoint list', async () => {
    render(<ApiExplorer />);

    expect(screen.getByText(/API uç noktaları ve istek\/yanıt şemaları yükleniyor/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('/api/v1/validate/iban')).toBeInTheDocument();
      expect(screen.getByText('/api/v1/finance/kdv')).toBeInTheDocument();
    });
  });

  it('filters endpoints by search query', async () => {
    render(<ApiExplorer />);

    await waitFor(() => {
      expect(screen.getByText('/api/v1/validate/iban')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Endpoint adı, yol/i);
    fireEvent.change(searchInput, { target: { value: 'kdv' } });

    expect(screen.queryByText('/api/v1/validate/iban')).not.toBeInTheDocument();
    expect(screen.getByText('/api/v1/finance/kdv')).toBeInTheDocument();
  });

  it('toggles tabs for request, response, and error details', async () => {
    render(<ApiExplorer />);

    await waitFor(() => {
      expect(screen.getByText('/api/v1/validate/iban')).toBeInTheDocument();
    });

    // Check request tab content
    expect(screen.getByText(/Zorunlu İstek Başlıkları/i)).toBeInTheDocument();

    // Click response tab
    const resTab = screen.getByRole('button', { name: /Başarılı Yanıt \(200 OK\)/i });
    fireEvent.click(resTab);

    expect(screen.getByText(/HTTP 200 OK/i)).toBeInTheDocument();

    // Click errors tab
    const errTab = screen.getByRole('button', { name: /Olası Hata Yanıtları/i });
    fireEvent.click(errTab);

    expect(screen.getByText(/HTTP 400 — Doğrulama Hatası/i)).toBeInTheDocument();
    expect(screen.getByText(/HTTP 401 — Yetkilendirme Hatası/i)).toBeInTheDocument();
  });
});

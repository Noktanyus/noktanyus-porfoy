import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewApiKeyForm } from '../NewApiKeyForm';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('NewApiKeyForm (Granular Scopes)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders name input and granular API permissions catalog', () => {
    render(<NewApiKeyForm />);
    expect(screen.getByPlaceholderText(/Mobil Uygulama/i)).toBeInTheDocument();
    expect(screen.getByText(/Granüler API İzinleri/i)).toBeInTheDocument();
    expect(screen.getByText(/TCKN \/ VKN Doğrulama/i)).toBeInTheDocument();
    expect(screen.getByText(/TR IBAN Doğrulama/i)).toBeInTheDocument();
  });

  it('filters API scopes when typing in search input', () => {
    render(<NewApiKeyForm />);
    const searchInput = screen.getByPlaceholderText(/API adı veya uç nokta ara/i);
    fireEvent.change(searchInput, { target: { value: 'KDV Hesaplama' } });

    expect(screen.getByText('KDV Hesaplama')).toBeInTheDocument();
    expect(screen.queryByText('TCKN / VKN Doğrulama')).not.toBeInTheDocument();
  });

  it('selects all scopes on "Tümünü Seç" and clears on "Temizle"', () => {
    render(<NewApiKeyForm />);
    const selectAllBtn = screen.getByRole('button', { name: /Tümünü Seç/i });
    fireEvent.click(selectAllBtn);

    expect(screen.getByText(/İzin Seçili/i).textContent).toContain('İzin Seçili');

    const clearBtn = screen.getByRole('button', { name: /Temizle/i });
    fireEvent.click(clearBtn);

    expect(screen.getByText(/0 \/ \d+ İzin Seçili/i)).toBeInTheDocument();
  });

  it('toggles an individual scope checkbox', () => {
    render(<NewApiKeyForm />);
    const searchInput = screen.getByPlaceholderText(/API adı veya uç nokta ara/i);
    fireEvent.change(searchInput, { target: { value: 'KDV Hesaplama' } });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('submits form with selected granular scopes and displays created key', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 'k1',
          name: 'Finans Botu',
          key: 'nokt_live_99887766554433221100',
          prefix: 'nokt_live_9988',
          warning: 'Bu anahtarı kaydedin',
        },
      }),
    });

    render(<NewApiKeyForm />);

    const nameInput = screen.getByPlaceholderText(/Mobil Uygulama/i);
    fireEvent.change(nameInput, { target: { value: 'Finans Botu' } });

    const submitBtn = screen.getByRole('button', { name: /API Anahtarını Oluştur/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('nokt_live_99887766554433221100')).toBeInTheDocument();
    });

    expect(screen.getByText(/API Anahtarı Başarıyla Oluşturuldu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Kopyala/i })).toBeInTheDocument();
  });
});

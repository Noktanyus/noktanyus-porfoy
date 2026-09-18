/**
 * @file UserLimitActions & UserLimitModal birim testi.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserLimitActions } from '../UserLimitActions';

// next/navigation mock
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

// react-hot-toast mock
vi.mock('react-hot-toast', () => {
  const toast: any = vi.fn();
  toast.loading = vi.fn(() => 'toast-id');
  toast.success = vi.fn();
  toast.error = vi.fn();
  return { default: toast };
});

describe('UserLimitActions & UserLimitModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Özel Limit Tanımla" button when user has no custom limit', () => {
    render(
      <table>
        <tbody>
          <tr>
            <td id="test-cell">
              <UserLimitActions
                user={{
                  id: 'u1',
                  email: 'test@example.com',
                  name: 'Test User',
                  customApiMonthlyLimit: null,
                }}
              />
            </td>
          </tr>
        </tbody>
      </table>
    );

    expect(screen.getByRole('button', { name: /özel limit tanımla/i })).toBeInTheDocument();
  });

  it('opens modal in document.body via portal and outside table cell when button is clicked', async () => {
    const { container } = render(
      <table id="test-table">
        <tbody>
          <tr>
            <td id="test-cell">
              <UserLimitActions
                user={{
                  id: 'u1',
                  email: 'test@example.com',
                  name: 'Test User',
                  customApiMonthlyLimit: null,
                }}
              />
            </td>
          </tr>
        </tbody>
      </table>
    );

    const btn = screen.getByRole('button', { name: /özel limit tanımla/i });
    fireEvent.click(btn);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Critical assertion: The modal is NOT rendered inside the table or td
    const table = container.querySelector('#test-table');
    expect(table?.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.contains(dialog)).toBe(true);

    // Check modal contents
    expect(screen.getByText('Kullanıcı API Kotası & Kredi Yönetimi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /üstüne ekle/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /limiti düzenle/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /kredi yönetimi/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /kes \/ süre bitir/i })).toBeInTheDocument();

    // Switch tab to "Limiti Düzenle"
    fireEvent.click(screen.getByRole('button', { name: /limiti düzenle/i }));
    expect(screen.getByLabelText(/yeni özel aylık kota/i)).toBeInTheDocument();

    // Close modal via "Vazgeç"
    fireEvent.click(screen.getByRole('button', { name: /vazgeç/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});

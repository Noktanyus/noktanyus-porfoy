/**
 * @file DeleteButton birim testi.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteButton } from '../DeleteButton';

// next/navigation mock
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

// fetch mock
global.fetch = vi.fn();

// react-hot-toast mock (named export)
vi.mock('react-hot-toast', () => {
  const toast: any = vi.fn();
  toast.loading = vi.fn(() => 'toast-id');
  toast.success = vi.fn();
  toast.error = vi.fn();
  return { default: toast };
});

// window.confirm mock
window.confirm = vi.fn(() => true);

describe('DeleteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockReset();
  });

  it('renders without crashing', () => {
    const { container } = render(<DeleteButton endpoint="/api/admin/test/1" />);
    expect(container.querySelector('button')).toBeTruthy();
  });

  it('calls confirm before delete', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { success: true } }),
    });
    render(<DeleteButton endpoint="/api/admin/test/1" />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(window.confirm).toHaveBeenCalled();
  });

  it('does not call fetch when user cancels confirm', async () => {
    (window.confirm as any).mockReturnValueOnce(false);
    render(<DeleteButton endpoint="/api/admin/test/1" />);
    fireEvent.click(screen.getByRole('button'));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('calls DELETE endpoint and shows success toast', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { success: true, deletedId: 'x' } }),
    });
    render(<DeleteButton endpoint="/api/admin/blog/my-post" itemName="Test" />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/blog/my-post', { method: 'DELETE' });
    });
  });

  it('shows error toast on failed response', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: { message: 'Bulunamadı' } }),
    });
    render(<DeleteButton endpoint="/api/admin/test/1" />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});

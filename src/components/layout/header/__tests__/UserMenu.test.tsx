import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockUseSession = vi.hoisted(() => vi.fn());

vi.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
  signOut: vi.fn(),
}));

import { UserMenu } from '../UserMenu';

describe('UserMenu', () => {
  beforeEach(() => {
    mockUseSession.mockReset();
  });

  it('oturumsuz Giriş Yap gösterir', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    render(<UserMenu />);
    expect(screen.getByRole('link', { name: 'Giriş Yap' })).toHaveAttribute('href', '/giris');
  });

  it('admin hesap menüsünde Yönetim linki gösterir', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'u1', name: 'Ali', email: 'ali@example.com', role: 'admin' },
      },
      status: 'authenticated',
    });
    const user = userEvent.setup();
    render(<UserMenu />);
    await user.click(screen.getByRole('button', { name: 'Hesap menüsü' }));
    const link = screen.getByRole('menuitem', { name: /Yönetim/ });
    expect(link).toHaveAttribute('href', '/admin');
  });

  it('normal kullanıcıda Yönetim göstermez', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'u2', name: 'Veli', email: 'veli@example.com', role: 'user' },
      },
      status: 'authenticated',
    });
    const user = userEvent.setup();
    render(<UserMenu />);
    await user.click(screen.getByRole('button', { name: 'Hesap menüsü' }));
    expect(screen.queryByRole('menuitem', { name: /Yönetim/ })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Hesabım/ })).toBeInTheDocument();
  });
});

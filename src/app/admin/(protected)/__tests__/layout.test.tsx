import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

const mockSession = vi.hoisted(() => ({
  current: null as { user: { id: string; email: string; role: string } } | null,
}));

const mockRedirect = vi.hoisted(() => vi.fn());

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => mockSession.current),
}));

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/admin/dashboard',
}));

vi.mock('@/lib/auth', () => ({ authOptions: {} }));

// Mock AdminLayoutClient to simplify component testing
vi.mock('@/components/admin/AdminLayoutClient', () => ({
  AdminLayoutClient: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="admin-layout-client">{children}</div>
  ),
}));

import ProtectedAdminLayout from '../layout';

describe('ProtectedAdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.current = null;
  });

  it('oturum olmadığında /giris sayfasına callbackUrl ile yönlendirir', async () => {
    mockSession.current = null;

    await ProtectedAdminLayout({
      children: <div>İçerik</div>,
    });

    expect(mockRedirect).toHaveBeenCalledWith('/giris?callbackUrl=/admin/dashboard');
  });

  it('kullanıcı rolü admin değilse "Yetkisiz erişim" EmptyState bileşeni render eder', async () => {
    mockSession.current = {
      user: { id: 'u1', email: 'user@example.com', role: 'user' },
    };

    const jsx = await ProtectedAdminLayout({
      children: <div>Korumalı İçerik</div>,
    });

    render(jsx);

    expect(screen.getByText('Yetkisiz erişim')).toBeInTheDocument();
    expect(
      screen.getByText(/Bu sayfa yalnızca yönetici yetkisi verilen hesaplara açıktır/)
    ).toBeInTheDocument();
    expect(screen.queryByText('Korumalı İçerik')).not.toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('kullanıcı rolü admin olduğunda AdminLayoutClient içinde children render eder', async () => {
    mockSession.current = {
      user: { id: 'admin-1', email: 'admin@noktanyus.com', role: 'admin' },
    };

    const jsx = await ProtectedAdminLayout({
      children: <div data-testid="test-child">Admin Dashboard Paneli</div>,
    });

    render(jsx);

    expect(screen.getByTestId('admin-layout-client')).toBeInTheDocument();
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Admin Dashboard Paneli')).toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});

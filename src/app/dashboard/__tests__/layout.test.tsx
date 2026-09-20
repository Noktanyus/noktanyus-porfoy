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
  usePathname: () => '/dashboard',
}));

vi.mock('@/lib/auth', () => ({ authOptions: {} }));

vi.mock('@/components/dashboard/DashboardSidebar', () => ({
  DashboardSidebar: () => <div data-testid="dashboard-sidebar">Sidebar</div>,
}));

vi.mock('@/components/onboarding/OnboardingFlow', () => ({
  OnboardingFlow: () => <div data-testid="onboarding-flow" />,
}));

import DashboardLayout from '../layout';

describe('DashboardLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.current = null;
  });

  it('oturum olmadığında /giris sayfasına yönlendirir', async () => {
    mockSession.current = null;

    await DashboardLayout({
      children: <div>İçerik</div>,
    });

    expect(mockRedirect).toHaveBeenCalledWith('/giris');
  });

  it('admin rolündeki kullanıcı /dashboard eriştiğinde /admin sayfasına zorla yönlendirilmez, dashboardu görebilir', async () => {
    mockSession.current = {
      user: { id: 'admin', email: 'admin@noktanyus.com', role: 'admin' },
    };

    const jsx = await DashboardLayout({
      children: <div data-testid="dashboard-content">Müşteri Dashboard İçeriği</div>,
    });

    render(jsx);

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(screen.getByTestId('dashboard-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    expect(screen.getByText('Müşteri Dashboard İçeriği')).toBeInTheDocument();
  });

  it('normal kullanıcı /dashboard eriştiğinde dashboard içeriğini görür', async () => {
    mockSession.current = {
      user: { id: 'u-1', email: 'user@example.com', role: 'user' },
    };

    const jsx = await DashboardLayout({
      children: <div data-testid="dashboard-content">Kullanıcı Siparişleri</div>,
    });

    render(jsx);

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(screen.getByTestId('dashboard-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
  });
});

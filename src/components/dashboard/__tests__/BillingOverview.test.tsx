import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BillingOverview } from '../BillingOverview';

// react-hot-toast mock
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// jsdom'da window.location.href atanamaz, Object.defineProperty ile stub'luyoruz
let hrefValue = '';
Object.defineProperty(window, 'location', {
  configurable: true,
  writable: true,
  value: {
    get href() {
      return hrefValue;
    },
    set href(v: string) {
      hrefValue = v;
    },
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
});

afterEach(() => {
  hrefValue = '';
  vi.clearAllMocks();
});

describe('BillingOverview', () => {
  const baseProps = {
    subscription: null,
    orders: [],
    licenses: [],
    plans: [],
    userEmail: 'test@example.com',
  };

  it('renders without crashing', () => {
    const { container } = render(<BillingOverview {...baseProps} />);
    expect(container).toBeTruthy();
  });

  it('shows tabs for overview, orders, and licenses', () => {
    render(<BillingOverview {...baseProps} />);
    expect(screen.getByRole('tab', { name: /Genel Bakış/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Siparişler/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Lisanslar/i })).toBeInTheDocument();
  });

  it('shows store channel cards redirecting to subscriptions and credits', () => {
    render(<BillingOverview {...baseProps} apiCreditBalance={150} />);
    expect(screen.getByText('150 kredi')).toBeInTheDocument();
    
    const abonelikLink = screen.getByRole('link', { name: /Abonelik Paketlerini İncele/i });
    expect(abonelikLink).toBeInTheDocument();
    expect(abonelikLink).toHaveAttribute('href', '/magaza/abonelikler');

    const krediLink = screen.getByRole('link', { name: /Kredi Paketlerini İncele/i });
    expect(krediLink).toBeInTheDocument();
    expect(krediLink).toHaveAttribute('href', '/magaza/krediler');
  });

  it('switches to the orders tab when clicked', () => {
    render(<BillingOverview {...baseProps} />);
    fireEvent.click(screen.getByRole('tab', { name: /Siparişler/i }));
    expect(screen.getByText(/Henüz sipariş yok/i)).toBeInTheDocument();
  });

  it('switches to the licenses tab when clicked', () => {
    render(<BillingOverview {...baseProps} />);
    fireEvent.click(screen.getByRole('tab', { name: /Lisanslar/i }));
    expect(screen.getByText(/Henüz lisans yok/i)).toBeInTheDocument();
  });

  it('renders an active subscription card when subscription is provided', () => {
    render(
      <BillingOverview
        {...baseProps}
        subscription={{
          id: 's1',
          planSlug: 'pro',
          status: 'active',
          startedAt: '2026-01-01T00:00:00.000Z',
          expiresAt: '2026-12-31T00:00:00.000Z',
          autoRenew: true,
        }}
      />
    );
    expect(screen.getByText(/Aktif Abonelik/i)).toBeInTheDocument();
    expect(screen.getByText(/pro/i)).toBeInTheDocument();
    expect(screen.getByText(/Açık/i)).toBeInTheDocument();
  });
});
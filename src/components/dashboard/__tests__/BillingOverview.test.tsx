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

  it('shows the empty plans message when no plans are available', () => {
    render(<BillingOverview {...baseProps} />);
    expect(screen.getByText(/Aktif plan bulunamadı/i)).toBeInTheDocument();
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

  it('renders plans and marks the current plan as such', () => {
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
        plans={[
          {
            id: 'p1',
            slug: 'starter',
            name: 'Starter',
            description: 'Küçük projeler için',
            priceCents: 9900,
            currency: 'TRY',
            interval: 'month',
            features: ['1 kullanıcı', '10GB alan'],
            isFeatured: false,
          },
          {
            id: 'p2',
            slug: 'pro',
            name: 'Pro',
            description: 'Büyüyen ekipler için',
            priceCents: 49900,
            currency: 'TRY',
            interval: 'month',
            features: ['Sınırsız kullanıcı', '100GB alan'],
            isFeatured: true,
          },
        ]}
      />
    );

    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText(/ÖNERİLEN/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mevcut Plan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Geçiş Yap/i })).toBeInTheDocument();
  });
});
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrdersList } from '../OrdersList';

describe('OrdersList', () => {
  it('renders empty state when orders list is empty', () => {
    render(<OrdersList orders={[]} />);
    expect(screen.getByText('Henüz siparişin yok')).toBeInTheDocument();
  });

  it('renders order with digital product items', () => {
    const orders = [
      {
        id: 'ord-1',
        orderNumber: 'NK-2609-001',
        status: 'PAID',
        subtotalCents: 19900,
        taxCents: 0,
        totalCents: 19900,
        currency: 'try',
        customerEmail: 'test@example.com',
        createdAt: '2026-09-12T10:00:00.000Z',
        items: [
          {
            id: 'item-1',
            productTitle: 'Next.js 14 SaaS Starter Kit',
            productSlug: 'nextjs-saas-starter',
            quantity: 1,
            unitPriceCents: 19900,
            totalCents: 19900,
          },
        ],
      },
    ];

    render(<OrdersList orders={orders} />);
    expect(screen.getByText('NK-2609-001')).toBeInTheDocument();
    expect(screen.getByText('Next.js 14 SaaS Starter Kit')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Next.js 14 SaaS Starter Kit' })).toHaveAttribute(
      'href',
      '/magaza/nextjs-saas-starter'
    );
  });

  it('renders subscription order with resolved title and badge when items array is empty', () => {
    const orders = [
      {
        id: 'ord-sub-1',
        orderNumber: 'NK-2610-1B783F',
        status: 'PAID',
        subtotalCents: 29900,
        taxCents: 0,
        totalCents: 29900,
        currency: 'try',
        customerEmail: 'test@example.com',
        createdAt: '2026-10-01T08:12:00.000Z',
        notes: 'Abonelik: Pro',
        metadata: {
          type: 'subscription',
          planSlug: 'pro',
          interval: 'MONTH',
        },
        items: [],
      },
    ];

    render(<OrdersList orders={orders} />);
    expect(screen.getByText('NK-2610-1B783F')).toBeInTheDocument();
    expect(screen.getByText('PAID')).toBeInTheDocument();
    expect(screen.getByText('Abonelik: Pro')).toBeInTheDocument();
    expect(screen.getByText('Abonelik')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Abonelik: Pro/i })).toHaveAttribute(
      'href',
      '/magaza/abonelikler'
    );
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders license key when present on the order', () => {
    const orders = [
      {
        id: 'ord-lic-1',
        orderNumber: 'NK-2609-LIC',
        status: 'PAID',
        subtotalCents: 10000,
        taxCents: 0,
        totalCents: 10000,
        currency: 'try',
        customerEmail: 'test@example.com',
        createdAt: '2026-09-15T12:00:00.000Z',
        items: [
          {
            id: 'it-1',
            productTitle: 'Yazılım Lisansı',
            productSlug: 'yazilim-lisansi',
            quantity: 1,
            unitPriceCents: 10000,
            totalCents: 10000,
          },
        ],
        licenses: [
          {
            id: 'lic-1',
            key: 'NOKT-XXXX-YYYY-ZZZZ',
          },
        ],
      },
    ];

    render(<OrdersList orders={orders} />);
    expect(screen.getByText('NOKT-XXXX-YYYY-ZZZZ')).toBeInTheDocument();
  });
});

/**
 * EmptyState + SkeletonCard — Unit Test
 *
 * Test edilenler:
 *   - EmptyState title/description/icon render
 *   - EmptyState action button rendering
 *   - SkeletonCard animate-pulse class'ı içerir
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '../EmptyState';
import { SkeletonCard } from '../SkeletonCard';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="Boş" description="Burada bir şey yok" />);
    expect(screen.getByText('Boş')).toBeInTheDocument();
    expect(screen.getByText('Burada bir şey yok')).toBeInTheDocument();
  });

  it('renders default icon when not provided', () => {
    render(<EmptyState title="X" description="Y" />);
    // default icon 📦
    expect(screen.getByText('📦')).toBeInTheDocument();
  });

  it('renders custom icon', () => {
    render(<EmptyState title="X" description="Y" icon="🔍" />);
    expect(screen.getByText('🔍')).toBeInTheDocument();
  });

  it('renders action link when provided', () => {
    render(
      <EmptyState
        title="X"
        description="Y"
        action={{ label: 'Mağazaya git', href: '/magaza' }}
      />,
    );
    const link = screen.getByRole('link', { name: 'Mağazaya git' });
    expect(link).toHaveAttribute('href', '/magaza');
  });

  it('does not render action link when not provided', () => {
    render(<EmptyState title="X" description="Y" />);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('renders secondary action link alongside primary action', () => {
    render(
      <EmptyState
        title="X"
        description="Y"
        action={{ label: 'Geri Dön', href: '/dashboard' }}
        secondaryAction={{ label: 'Destek Al', href: '/iletisim' }}
      />,
    );
    expect(screen.getByRole('link', { name: 'Geri Dön' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: 'Destek Al' })).toHaveAttribute('href', '/iletisim');
  });

  it('renders only secondary action when primary action is omitted', () => {
    render(
      <EmptyState
        title="X"
        description="Y"
        secondaryAction={{ label: 'Yardım', href: '/help' }}
      />,
    );
    expect(screen.getByRole('link', { name: 'Yardım' })).toHaveAttribute('href', '/help');
  });
});

describe('SkeletonCard', () => {
  it('renders with animate-pulse class', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelector('.animate-pulse')).not.toBeNull();
  });

  it('renders multiple skeleton lines based on lines prop', () => {
    const { container } = render(<SkeletonCard lines={4} />);
    // Her satır bg-muted rounded shimmer class'ına sahip olmalı
    const lines = container.querySelectorAll('.h-4.bg-muted');
    expect(lines.length).toBeGreaterThanOrEqual(4);
  });

  it('uses default image height class', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelector('.h-48')).not.toBeNull();
  });

  it('accepts custom className', () => {
    const { container } = render(<SkeletonCard className="mt-4" />);
    expect(container.firstChild).toHaveClass('mt-4');
  });
});

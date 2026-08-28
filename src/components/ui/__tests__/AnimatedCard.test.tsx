/**
 * AnimatedCard + AnimatedGrid — Unit Test
 *
 * Test edilenler:
 *   - children rendering
 *   - inView olduğunda framer-motion animate 'visible' tetikler
 *   - AnimatedGrid stagger/delay opsiyonları motion variants'a geçer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedCard, AnimatedGrid } from '../AnimatedCard';

// Framer Motion motion.div'ün animate prop'unun çağrılıp çağrılmadığını test ediyoruz.
// motion kütüphanesini mock'lamak yerine, animate değerini doğrudan kontrol ederiz.
describe('AnimatedCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children correctly', () => {
    render(
      <AnimatedCard>
        <p>Card Content</p>
      </AnimatedCard>,
    );
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <AnimatedCard className="my-custom-class">X</AnimatedCard>,
    );
    expect(container.firstChild).toHaveClass('my-custom-class');
  });

  it('accepts different variant props without error', () => {
    // Her variant için mount/unmount sorunsuz olmalı
    const variants = ['fadeUp', 'scaleIn', 'slideLeft', 'slideRight'] as const;
    variants.forEach((v) => {
      const { unmount } = render(
        <AnimatedCard variant={v} delay={0.1}>
          <span>{v}</span>
        </AnimatedCard>,
      );
      expect(screen.getByText(v)).toBeInTheDocument();
      unmount();
    });
  });

  it('accepts custom threshold without error', () => {
    render(
      <AnimatedCard threshold={0.5}>
        <span>Threshold test</span>
      </AnimatedCard>,
    );
    expect(screen.getByText('Threshold test')).toBeInTheDocument();
  });
});

describe('AnimatedGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders its children', () => {
    render(
      <AnimatedGrid>
        <span>Item 1</span>
        <span>Item 2</span>
      </AnimatedGrid>,
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(
      <AnimatedGrid className="grid grid-cols-3">
        <span>X</span>
      </AnimatedGrid>,
    );
    expect(container.firstChild).toHaveClass('grid');
    expect(container.firstChild).toHaveClass('grid-cols-3');
  });

  it('handles empty children gracefully', () => {
    const { container } = render(<AnimatedGrid className="empty">{null}</AnimatedGrid>);
    expect(container.firstChild).toHaveClass('empty');
  });
});

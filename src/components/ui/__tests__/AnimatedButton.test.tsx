/**
 * AnimatedButton — Unit Test
 *
 * Test edilenler:
 *   - href rendering (internal vs external)
 *   - variant primary/secondary farklı class üretir
 *   - showArrow koşullu olarak ikon ekler
 *   - aria-label desteği
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedButton } from '../AnimatedButton';

describe('AnimatedButton', () => {
  it('renders an internal link with the correct href', () => {
    render(<AnimatedButton href="/iletisim">İletişim</AnimatedButton>);
    const link = screen.getByRole('link', { name: 'İletişim' });
    expect(link).toHaveAttribute('href', '/iletisim');
  });

  it('renders an external link with target/rel attrs', () => {
    render(
      <AnimatedButton href="https://example.com" external>
        External
      </AnimatedButton>,
    );
    const link = screen.getByRole('link', { name: 'External' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('applies primary variant styling by default', () => {
    render(<AnimatedButton href="/x">X</AnimatedButton>);
    const link = screen.getByRole('link', { name: 'X' });
    expect(link.className).toContain('bg-brand-primary');
  });

  it('applies secondary variant styling when variant=secondary', () => {
    render(
      <AnimatedButton href="/x" variant="secondary">
        Secondary
      </AnimatedButton>,
    );
    const link = screen.getByRole('link', { name: 'Secondary' });
    expect(link.className).toContain('bg-muted');
    expect(link.className).not.toContain('bg-brand-primary');
  });

  it('does not render arrow icon when showArrow is false', () => {
    const { container } = render(<AnimatedButton href="/x">No Arrow</AnimatedButton>);
    // SVG yok
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders arrow icon when showArrow is true', () => {
    const { container } = render(
      <AnimatedButton href="/x" showArrow>
        With Arrow
      </AnimatedButton>,
    );
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('uses ariaLabel when provided', () => {
    render(
      <AnimatedButton href="/x" ariaLabel="Contact me">
        Click
      </AnimatedButton>,
    );
    expect(screen.getByLabelText('Contact me')).toBeInTheDocument();
  });
});

/**
 * ProgressBar — Unit Test
 *
 * Test edilenler:
 *   - role="progressbar" + aria-valuenow/min/max
 *   - aria-label (zorunlu label prop'undan)
 *   - clampPercent: aralık dışı / NaN / Infinity değerleri güvenli
 *   - showValue ile yüzde metni görünür olur (bilgi yalnız renkle aktarılmaz)
 *   - tone="auto" eşik renkleri (%90+ kırmızı, %70+ amber, altı yeşil)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar, clampPercent } from '../ProgressBar';

describe('clampPercent', () => {
  it('keeps values inside 0-100', () => {
    expect(clampPercent(50)).toBe(50);
    expect(clampPercent(-20)).toBe(0);
    expect(clampPercent(140)).toBe(100);
  });

  it('rounds fractional values', () => {
    expect(clampPercent(33.4)).toBe(33);
    expect(clampPercent(33.6)).toBe(34);
  });

  it('handles non-finite values safely', () => {
    // NaN -> 0: "width: NaN%" gibi bozuk stil uretilmemeli
    expect(clampPercent(Number.NaN)).toBe(0);
    // +Infinity -> 100: limit ustu "dolu" demektir
    expect(clampPercent(Number.POSITIVE_INFINITY)).toBe(100);
    expect(clampPercent(Number.NEGATIVE_INFINITY)).toBe(0);
  });
});

describe('ProgressBar', () => {
  it('exposes progressbar semantics with the given label', () => {
    render(<ProgressBar value={42} label="İş ilerlemesi" />);
    const bar = screen.getByRole('progressbar', { name: 'İş ilerlemesi' });
    expect(bar).toHaveAttribute('aria-valuenow', '42');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('clamps out-of-range values in aria-valuenow', () => {
    render(<ProgressBar value={250} label="Kullanım" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('does not render the percentage text by default', () => {
    render(<ProgressBar value={42} label="X" />);
    expect(screen.queryByText('42%')).toBeNull();
  });

  it('renders visible percentage text when showValue is set', () => {
    render(<ProgressBar value={42} label="X" showValue />);
    expect(screen.getByText('42%')).toBeInTheDocument();
  });

  it('uses a danger colour at or above 90% when tone is auto', () => {
    const { container } = render(<ProgressBar value={95} label="X" tone="auto" />);
    expect(container.querySelector('.bg-rose-500')).not.toBeNull();
  });

  it('uses a warning colour between 70% and 90% when tone is auto', () => {
    const { container } = render(<ProgressBar value={75} label="X" tone="auto" />);
    expect(container.querySelector('.bg-amber-500')).not.toBeNull();
  });

  it('uses a success colour below 70% when tone is auto', () => {
    const { container } = render(<ProgressBar value={10} label="X" tone="auto" />);
    expect(container.querySelector('.bg-emerald-500')).not.toBeNull();
  });

  it('respects an explicit tone over the auto thresholds', () => {
    const { container } = render(<ProgressBar value={95} label="X" tone="success" />);
    expect(container.querySelector('.bg-emerald-500')).not.toBeNull();
    expect(container.querySelector('.bg-rose-500')).toBeNull();
  });

  it('sets the fill width from the clamped percentage', () => {
    const { container } = render(<ProgressBar value={33.6} label="X" />);
    const fill = container.querySelector('[style]') as HTMLElement | null;
    expect(fill?.style.width).toBe('34%');
  });
});

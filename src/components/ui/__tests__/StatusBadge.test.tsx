/**
 * StatusBadge — Unit Test
 *
 * Test edilenler:
 *   - label render
 *   - srLabel yalnızca ekran okuyucuya eklenir
 *   - dot ikinci görsel ipucu olarak render edilir (renk körlüğü)
 *   - icon aria-hidden ile render edilir
 *   - tone -> renk sınıfı eşlemesi
 *   - domain resolver'ları (job / active / order / health) doğru etiket+ton döner
 *   - bilinmeyen statüler ham değeriyle ve nötr tonla döner (bilgi kaybı yok)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  StatusBadge,
  resolveJobStatus,
  resolveActiveStatus,
  resolveOrderStatus,
  resolveHealthStatus,
} from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders the label text', () => {
    render(<StatusBadge label="Aktif" />);
    expect(screen.getByText('Aktif')).toBeInTheDocument();
  });

  it('renders srLabel for screen readers only', () => {
    render(<StatusBadge label="Ödendi" srLabel="Sipariş durumu:" />);
    const sr = screen.getByText('Sipariş durumu:');
    expect(sr).toBeInTheDocument();
    expect(sr).toHaveClass('sr-only');
  });

  it('renders a decorative dot when dot is true', () => {
    const { container } = render(<StatusBadge label="Aktif" tone="success" dot />);
    const dot = container.querySelector('span[aria-hidden="true"]');
    expect(dot).not.toBeNull();
    expect(dot).toHaveClass('bg-emerald-500');
  });

  it('omits the dot by default', () => {
    const { container } = render(<StatusBadge label="Aktif" />);
    expect(container.querySelector('span[aria-hidden="true"]')).toBeNull();
  });

  it('applies the tone colour class', () => {
    const { container } = render(<StatusBadge label="Başarısız" tone="danger" />);
    expect(container.firstChild).toHaveClass('bg-rose-500/15');
  });

  it('renders an icon hidden from assistive tech', () => {
    const { container } = render(
      <StatusBadge label="Doğrulandı" icon={<svg data-testid="check" />} />,
    );
    expect(screen.getByTestId('check')).toBeInTheDocument();
    // icon bir aria-hidden sarmalayıcı içinde olmalı
    expect(container.querySelector('span[aria-hidden="true"]')).not.toBeNull();
  });

  it('supports the small size variant', () => {
    const { container } = render(<StatusBadge label="X" size="sm" />);
    expect(container.firstChild).toHaveClass('text-[11px]');
  });
});

describe('resolveJobStatus', () => {
  it.each([
    ['completed', 'Tamamlandı', 'success'],
    ['processing', 'İşleniyor', 'warning'],
    ['failed', 'Başarısız', 'danger'],
    ['pending', 'Bekliyor', 'neutral'],
  ])('maps %s to "%s" with %s tone', (status, label, tone) => {
    expect(resolveJobStatus(status)).toEqual({ label, tone, dot: true });
  });

  it('falls back to the raw status with a neutral tone', () => {
    expect(resolveJobStatus('archived')).toEqual({
      label: 'archived',
      tone: 'neutral',
      dot: true,
    });
  });
});

describe('resolveActiveStatus', () => {
  it('maps true to Aktif/success', () => {
    expect(resolveActiveStatus(true)).toEqual({ label: 'Aktif', tone: 'success', dot: true });
  });

  it('maps false to Pasif/neutral', () => {
    expect(resolveActiveStatus(false)).toEqual({ label: 'Pasif', tone: 'neutral', dot: true });
  });
});

describe('resolveOrderStatus', () => {
  it('is case-insensitive', () => {
    expect(resolveOrderStatus('paid').label).toBe('Ödendi');
    expect(resolveOrderStatus('PAID').label).toBe('Ödendi');
  });

  it.each([
    ['PENDING', 'Bekliyor', 'warning'],
    ['FAILED', 'Başarısız', 'danger'],
    ['REFUNDED', 'İade', 'info'],
    ['CANCELLED', 'İptal', 'neutral'],
  ])('maps %s to "%s"/%s', (status, label, tone) => {
    expect(resolveOrderStatus(status)).toEqual({ label, tone, dot: true });
  });
});

describe('resolveHealthStatus', () => {
  it('treats degraded as a warning, not a failure', () => {
    // Regression: onceden 'up' olmayan her sey kirmizi "calismiyor" idi
    expect(resolveHealthStatus('degraded')).toEqual({
      label: 'Kısmi',
      tone: 'warning',
      dot: true,
    });
  });

  it.each(['up', 'ok', 'healthy'])('maps %s to a success tone', (status) => {
    expect(resolveHealthStatus(status).tone).toBe('success');
  });

  it.each(['down', 'error'])('maps %s to a danger tone', (status) => {
    expect(resolveHealthStatus(status).tone).toBe('danger');
  });
});

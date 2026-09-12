/**
 * StatCard — Unit Test
 *
 * Test edilenler:
 *   - label + value render
 *   - hint render
 *   - definition modu <dt>/<dd> semantiği üretir (<dl> içinde kullanım)
 *   - sample=true "Örnek veri" işareti gösterir (gerçek metrik ayrımı)
 *   - sample varsayılan olarak KAPALI (yanlışlıkla işaret basılmaz)
 *   - tone -> değer rengi
 *   - StatCardGrid kolon sayısı ve dl/div etiketi
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard, StatCardGrid } from '../StatCard';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Toplam" value={12} />);
    expect(screen.getByText('Toplam')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders the hint when provided', () => {
    render(<StatCard label="Toplam" value={12} hint="son 7 gün" />);
    expect(screen.getByText('son 7 gün')).toBeInTheDocument();
  });

  it('uses p elements by default', () => {
    const { container } = render(<StatCard label="Toplam" value={1} />);
    expect(container.querySelector('dt')).toBeNull();
    expect(container.querySelector('dd')).toBeNull();
  });

  it('uses dt/dd when definition is set', () => {
    const { container } = render(<StatCard definition label="Toplam satır" value={40} />);
    expect(container.querySelector('dt')).toHaveTextContent('Toplam satır');
    expect(container.querySelector('dd')).toHaveTextContent('40');
  });

  it('does not show the sample marker by default', () => {
    render(<StatCard label="Gelir" value="₺100" />);
    expect(screen.queryByText('Örnek veri')).toBeNull();
  });

  it('shows a visible sample marker when sample is set', () => {
    // Gercek metrik ile temsili metrigin arayuzde ayrilmasi zorunlu
    render(<StatCard label="Gelir" value="₺100" sample />);
    expect(screen.getByText('Örnek veri')).toBeInTheDocument();
  });

  it('applies the tone colour to the value', () => {
    const { container } = render(<StatCard label="Hata" value={3} tone="danger" />);
    expect(container.querySelector('.text-rose-600')).not.toBeNull();
  });
});

describe('StatCardGrid', () => {
  it('renders a div by default', () => {
    const { container } = render(
      <StatCardGrid>
        <StatCard label="a" value={1} />
      </StatCardGrid>,
    );
    expect(container.firstChild?.nodeName).toBe('DIV');
  });

  it('renders a dl when as="dl"', () => {
    const { container } = render(
      <StatCardGrid as="dl">
        <StatCard definition label="a" value={1} />
      </StatCardGrid>,
    );
    expect(container.firstChild?.nodeName).toBe('DL');
  });

  it('applies the requested column count', () => {
    const { container } = render(
      <StatCardGrid columns={3}>
        <StatCard label="a" value={1} />
      </StatCardGrid>,
    );
    expect(container.firstChild).toHaveClass('sm:grid-cols-3');
  });
});

/**
 * PageHeader — Unit Test
 *
 * Test edilenler:
 *   - h1 title render
 *   - description render
 *   - back link nav rendering (aria-label)
 *   - breadcrumb render
 *   - actions render
 *   - h2 alternatifi
 *   - breadcrumb olmadan back link yok
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from '../PageHeader';

describe('PageHeader', () => {
  it('renders the title as h1 by default', () => {
    render(<PageHeader title="Monitörler" />);
    const heading = screen.getByRole('heading', { level: 1, name: 'Monitörler' });
    expect(heading).toBeInTheDocument();
  });

  it('renders the title as h2 when as="h2"', () => {
    render(<PageHeader title="Bölüm" as="h2" />);
    const heading = screen.getByRole('heading', { level: 2, name: 'Bölüm' });
    expect(heading).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<PageHeader title="X" description="Toplam 5 kayıt" />);
    expect(screen.getByText('Toplam 5 kayıt')).toBeInTheDocument();
  });

  it('renders back link with aria-label', () => {
    render(<PageHeader title="Detay" backHref="/dashboard" backLabel="Listeye Dön" />);
    const link = screen.getByRole('link', { name: 'Listeye Dön' });
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('omits back link when backHref is not provided', () => {
    const { container } = render(<PageHeader title="Y" />);
    expect(container.querySelector('a[aria-label]')).toBeNull();
  });

  it('renders breadcrumb content inside a nav landmark', () => {
    render(
      <PageHeader
        title="Branding"
        breadcrumb={<span>Workspace / Branding</span>}
      />
    );
    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveTextContent('Workspace / Branding');
  });

  it('renders actions when provided', () => {
    render(
      <PageHeader
        title="Sayfa"
        actions={<a href="/yeni">Yeni Ekle</a>}
      />
    );
    const link = screen.getByRole('link', { name: 'Yeni Ekle' });
    expect(link).toHaveAttribute('href', '/yeni');
  });
});

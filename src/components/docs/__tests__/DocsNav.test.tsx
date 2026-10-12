import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DocsNav, DOCS_SECTIONS } from '../DocsNav';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/docs'),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('DocsNav component', () => {
  it('renders all documentation sections', () => {
    render(<DocsNav />);

    DOCS_SECTIONS.forEach((sec) => {
      expect(screen.getByText(sec.label)).toBeInTheDocument();
    });
  });

  it('highlights the active link according to pathname', () => {
    render(<DocsNav />);

    const apiRefLink = screen.getByRole('link', { name: /API Referansı/i });
    expect(apiRefLink).toHaveClass('bg-brand-primary');
  });

  it('renders quick action buttons for API key, openapi and postman', () => {
    render(<DocsNav />);

    expect(screen.getByText('API Key Al')).toBeInTheDocument();
    expect(screen.getByText('openapi.json')).toBeInTheDocument();
    expect(screen.getByText('Postman')).toBeInTheDocument();
  });
});

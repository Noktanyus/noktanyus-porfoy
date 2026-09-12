/**
 * FormErrorSummary — Unit Test
 *
 * Test edilenler:
 *   - Boş error objesi render etmez
 *   - Sadece tanımlı hataları listeler (null/undefined atlanır)
 *   - role="alert" ile ekran okuyucuya duyurulur
 *   - fieldLabels map'inde label kullanılır
 *   - fieldLabels yoksa field adı kullanılır (fallback)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormErrorSummary } from '../FormErrorSummary';

describe('FormErrorSummary', () => {
  it('renders nothing when there are no errors', () => {
    const { container } = render(<FormErrorSummary errors={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when all error values are empty', () => {
    const { container } = render(
      <FormErrorSummary
        errors={{ email: '', password: undefined, name: null }}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders alert with errors', () => {
    render(
      <FormErrorSummary
        errors={{ email: 'Geçersiz e-posta', password: 'En az 8 karakter' }}
      />
    );
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText('Geçersiz e-posta')).toBeInTheDocument();
    expect(screen.getByText('En az 8 karakter')).toBeInTheDocument();
  });

  it('uses fieldLabels mapping when available', () => {
    render(
      <FormErrorSummary
        errors={{ email: 'Geçersiz' }}
        fieldLabels={{ email: 'E-posta Adresi' }}
      />
    );
    expect(screen.getByText('E-posta Adresi:')).toBeInTheDocument();
  });

  it('falls back to field name when label is not provided', () => {
    render(<FormErrorSummary errors={{ email: 'Geçersiz' }} />);
    expect(screen.getByText('email:')).toBeInTheDocument();
  });

  it('shows a count of errors in the heading', () => {
    render(
      <FormErrorSummary
        errors={{ a: 'Hata 1', b: 'Hata 2', c: 'Hata 3' }}
      />
    );
    expect(screen.getByText('(3)')).toBeInTheDocument();
  });
});

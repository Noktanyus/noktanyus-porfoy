/**
 * ResetPasswordForm — minimal unit test
 *
 * FormField + PasswordInput + FormSubmitButton entegrasyonu ve validasyon.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as navigation from 'next/navigation';
import type { ReadonlyURLSearchParams } from 'next/navigation';
import ResetPasswordForm from '../ResetPasswordForm';

describe('ResetPasswordForm', () => {
  it('shows invalid link view when token missing', () => {
    vi.spyOn(navigation, 'useSearchParams').mockReturnValue(
      new URLSearchParams() as unknown as ReadonlyURLSearchParams,
    );
    render(<ResetPasswordForm />);
    expect(screen.getByText(/Geçersiz Link/i)).toBeInTheDocument();
  });

  it('renders password fields when token is present', () => {
    const params = new URLSearchParams();
    params.set('token', 'valid-token');
    vi.spyOn(navigation, 'useSearchParams').mockReturnValue(
      params as unknown as ReadonlyURLSearchParams,
    );
    render(<ResetPasswordForm />);
    const inputs = screen.getAllByLabelText(/^Yeni Şifre/i);
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });
});

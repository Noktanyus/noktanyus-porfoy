/**
 * ForgotPasswordForm — minimal unit test
 *
 * FormField + FormSubmitButton entegrasyonunu ve email validasyonunu doğrular.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPasswordForm from '../ForgotPasswordForm';

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ sent: true }),
    });
  });

  it('renders email field with required label', () => {
    const { container } = render(<ForgotPasswordForm />);
    const input = container.querySelector('input[type="email"]');
    expect(input).not.toBeNull();
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('autocomplete', 'email');
  });

  it('shows validation error for invalid email', async () => {
    const { container } = render(<ForgotPasswordForm />);
    const input = container.querySelector('input[type="email"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'invalid-email' } });
    const form = container.querySelector('form')!;
    fireEvent.submit(form);
    await waitFor(() => {
      const alert = screen.getAllByRole('alert').find(
        (el) => el.textContent?.includes('Geçerli'),
      );
      expect(alert).toBeDefined();
    });
  });

  it('submits valid email and shows success state', async () => {
    const { container } = render(<ForgotPasswordForm />);
    const input = container.querySelector('input[type="email"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    const form = container.querySelector('form')!;
    fireEvent.submit(form);
    await waitFor(() => {
      expect(screen.getByText(/E-posta gönderildi/i)).toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as nextAuthReact from 'next-auth/react';
import { SocialAuthButtons, AuthDivider } from '../SocialAuthButtons';

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('SocialAuthButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Google sign-in button in login mode', () => {
    render(<SocialAuthButtons mode="login" providers={['google']} />);

    const button = screen.getByRole('button', { name: /Google ile Giriş Yap/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('data-testid', 'social-btn-google');
    expect(button).toHaveAttribute('data-provider', 'google');
  });

  it('renders Google sign-up button in register mode', () => {
    render(<SocialAuthButtons mode="register" providers={['google']} />);

    const button = screen.getByRole('button', { name: /Google ile Kayıt Ol/i });
    expect(button).toBeInTheDocument();
  });

  it('calls signIn("google", { callbackUrl }) on click', async () => {
    const signInMock = vi.mocked(nextAuthReact.signIn);
    render(
      <SocialAuthButtons
        mode="login"
        providers={['google']}
        callbackUrl="/dashboard/billing"
      />
    );

    const button = screen.getByRole('button', { name: /Google ile Giriş Yap/i });
    fireEvent.click(button);

    expect(signInMock).toHaveBeenCalledWith('google', {
      callbackUrl: '/dashboard/billing',
    });
  });

  it('renders multiple providers if specified', () => {
    render(<SocialAuthButtons mode="login" providers={['google', 'github']} />);

    expect(screen.getByRole('button', { name: /Google ile Giriş Yap/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /GitHub ile Giriş Yap/i })).toBeInTheDocument();
  });
});

describe('AuthDivider', () => {
  it('renders divider with default label', () => {
    render(<AuthDivider />);
    expect(screen.getByText('veya e-posta ile devam et')).toBeInTheDocument();
  });

  it('renders custom divider label', () => {
    render(<AuthDivider label="veya e-posta ile giriş yap" />);
    expect(screen.getByText('veya e-posta ile giriş yap')).toBeInTheDocument();
  });
});

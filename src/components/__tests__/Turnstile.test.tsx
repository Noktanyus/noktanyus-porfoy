// src/components/__tests__/Turnstile.test.tsx

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Turnstile, { TurnstileScript } from '../Turnstile';

// Mock window.turnstile
const mockTurnstile = {
  render: jest.fn().mockReturnValue('widget-id-123'),
  reset: jest.fn(),
  remove: jest.fn(),
  getResponse: jest.fn().mockReturnValue('test-token'),
};

// Global window mock
Object.defineProperty(window, 'turnstile', {
  value: mockTurnstile,
  writable: true,
});

describe('Turnstile', () => {
  const mockProps = {
    sitekey: 'test-site-key',
    onVerify: jest.fn(),
    onError: jest.fn(),
    onExpire: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render turnstile container', () => {
    const { container } = render(<Turnstile {...mockProps} />);
    
    const turnstileDiv = container.querySelector('div');
    expect(turnstileDiv).toBeInTheDocument();
  });

  it('should call turnstile.render with correct options', async () => {
    render(<Turnstile {...mockProps} />);

    await waitFor(() => {
      expect(mockTurnstile.render).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          sitekey: 'test-site-key',
          callback: expect.any(Function),
          'expired-callback': expect.any(Function),
          'error-callback': expect.any(Function),
        })
      );
    });
  });

  it('should handle verify callback', async () => {
    render(<Turnstile {...mockProps} />);

    await waitFor(() => {
      expect(mockTurnstile.render).toHaveBeenCalled();
    });

    // Simulate callback
    const renderCall = mockTurnstile.render.mock.calls[0];
    const options = renderCall[1];
    options.callback('test-token');

    expect(mockProps.onVerify).toHaveBeenCalledWith('test-token');
  });

  it('should handle error callback', async () => {
    render(<Turnstile {...mockProps} />);

    await waitFor(() => {
      expect(mockTurnstile.render).toHaveBeenCalled();
    });

    // Simulate error callback
    const renderCall = mockTurnstile.render.mock.calls[0];
    const options = renderCall[1];
    options['error-callback']();

    expect(mockProps.onError).toHaveBeenCalled();
  });

  it('should handle expire callback and reset widget', async () => {
    render(<Turnstile {...mockProps} />);

    await waitFor(() => {
      expect(mockTurnstile.render).toHaveBeenCalled();
    });

    // Simulate expire callback
    const renderCall = mockTurnstile.render.mock.calls[0];
    const options = renderCall[1];
    options['expired-callback']();

    expect(mockProps.onExpire).toHaveBeenCalled();
    expect(mockTurnstile.reset).toHaveBeenCalledWith('widget-id-123');
  });

  it('should not render when sitekey is missing', () => {
    render(<Turnstile {...mockProps} sitekey="" />);
    
    expect(mockTurnstile.render).not.toHaveBeenCalled();
  });

  it('should cleanup widget on unmount', async () => {
    const { unmount } = render(<Turnstile {...mockProps} />);

    await waitFor(() => {
      expect(mockTurnstile.render).toHaveBeenCalled();
    });

    unmount();

    expect(mockTurnstile.remove).toHaveBeenCalledWith('widget-id-123');
  });
});

describe('TurnstileScript', () => {
  beforeEach(() => {
    // Clear any existing scripts
    document.head.innerHTML = '';
  });

  it('should add turnstile script to document head', () => {
    render(<TurnstileScript />);

    const script = document.getElementById('cf-turnstile-script') as HTMLScriptElement;
    expect(script).toBeInTheDocument();
    expect(script).toHaveAttribute('src', 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit');
    expect(script.async).toBe(true);
    expect(script.defer).toBe(true);
  });

  it('should not add duplicate scripts', () => {
    render(<TurnstileScript />);
    render(<TurnstileScript />);

    const scripts = document.querySelectorAll('#cf-turnstile-script');
    expect(scripts).toHaveLength(1);
  });
});
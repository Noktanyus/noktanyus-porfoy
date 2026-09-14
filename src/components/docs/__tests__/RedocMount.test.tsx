import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import RedocMount from '../RedocMount';

describe('RedocMount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).Redoc;
  });

  it('initializes Redoc with correct parameter signature (spec, options, element)', async () => {
    const initMock = vi.fn();
    (window as any).Redoc = { init: initMock };

    render(<RedocMount />);

    await waitFor(() => {
      expect(initMock).toHaveBeenCalledTimes(1);
    });

    const [spec, options, element] = initMock.mock.calls[0];
    expect(spec).toBe('/api/openapi');
    expect(typeof options).toBe('object');
    expect(options).toHaveProperty('scrollYOffset', 0);
    expect(options).toHaveProperty('hideDownloadButton', false);
    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.getAttribute('data-testid')).toBe('redoc-mount');
  });

  it('renders fallback error message when script loading fails', async () => {
    // CDN script error simülasyonu: window.Redoc tanımsız kalıp script onerror tetiklenmesi
    const originalAppendChild = document.head.appendChild;
    vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      if (node instanceof HTMLScriptElement) {
        setTimeout(() => {
          node.onerror?.(new Event('error') as any);
        }, 10);
      }
      return node;
    });

    render(<RedocMount />);

    await waitFor(() => {
      expect(screen.getByText('API referansı yüklenemedi')).toBeInTheDocument();
    });

    expect(screen.getByText(/Failed to load Redoc CDN bundle/)).toBeInTheDocument();
    document.head.appendChild = originalAppendChild;
  });
});

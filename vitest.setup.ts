import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// iyzico + bazı Node-only paketler jsdom ortamında URL scheme hatası verir.
// Test ortamında bu paketleri minimal mock ile bypass ediyoruz.
vi.mock('iyzico', () => ({
  default: class MockIyzipay {
    checkoutFormInitialize(req: unknown, cb: (err: unknown, res: unknown) => void) {
      cb(null, {
        status: 'success',
        token: 'mock-token-' + Date.now(),
        paymentPageUrl: 'https://mock.iyzipay.com/checkout',
      });
    }
    checkoutForm = {
      retrieve(req: unknown, cb: (err: unknown, res: unknown) => void) {
        cb(null, { status: 'success', paymentStatus: 'SUCCESS', basketId: 'mock' });
      },
    };
  },
}));

// isomorphic-dompurify root-cause fix:
// Production'da isomorphic-dompurify → jsdom@28 → undici@7 kullanır.
// Vitest ise jsdom@30 → undici@8 kullanır. Bu versiyon çakışması
// Node.js'in internal `webidl.util.markAsUncloneable`'ını override edip
// undici'nin WebCrypto API'sini bozuyordu.
//
// Çözüm: Test ortamında isomorphic-dompurify'i no-op mock ile bypass et.
// Production build'de normal çalışır (Next.js serverComponentsExternalPackages).
vi.mock('isomorphic-dompurify', () => ({
  default: {
    sanitize: (html: string) => html,
    setConfig: () => undefined,
  },
}));

// Her testten sonra DOM temizliği
afterEach(() => {
  cleanup();
});

// next/navigation mock (server component testleri için)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

// next/image mock
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return { type: 'img', props: { src, alt, ...props } };
  },
}));

// next-themes mock
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    resolvedTheme: 'light',
    themes: ['light', 'dark'],
    systemTheme: 'light',
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ResizeObserver mock (scroll/observer component'leri için)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// IntersectionObserver mock
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Sentry bundler plugin polyfill — @apm-js-collab/code-transformer-bundler-plugins
// modülü test ortamında webpack dosyalarını yükleyemiyor (ESM/CJS uyumsuz).
// Sentry'yi testlerde tamamen devre dışı bırakıyoruz — production build'inde zaten
// Next.js tarafından farklı bir path'ten yükleniyor.
vi.mock('@sentry/nextjs', () => ({
  withSentryConfig: (config: unknown) => config,
  init: () => {},
  captureException: () => {},
  captureMessage: () => {},
  setUser: () => {},
  startTransaction: () => ({}),
  getCurrentHub: () => ({ getClient: () => null }),
  getClient: () => null,
  close: () => Promise.resolve(true),
  flush: () => Promise.resolve(true),
  browserTracingIntegration: () => ({}),
  replayIntegration: () => ({}),
  httpIntegration: () => ({}),
}));

vi.mock('@apm-js-collab/code-transformer-bundler-plugins', () => ({
  default: {},
  createSentryBuildTimeInjector: () => ({ name: 'mock' }),
}));

// matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

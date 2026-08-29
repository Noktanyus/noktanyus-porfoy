import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// webidl.util polyfill (jsdom'da eksik olabiliyor, WebCrypto API için gerekli)
if (typeof globalThis !== 'undefined' && !(globalThis as any).webidl) {
  (globalThis as any).webidl = {};
}
if (typeof (globalThis as any).webidl !== 'undefined' && !(globalThis as any).webidl.util) {
  (globalThis as any).webidl.util = {};
}
// markAsUncloneable polyfill (Node.js 22+'da WebCrypto için gerekli, jsdom eksik olabilir)
if (typeof (globalThis as any).webidl?.util !== 'undefined' && typeof (globalThis as any).webidl.util.markAsUncloneable !== 'function') {
  (globalThis as any).webidl.util.markAsUncloneable = () => {};
}
// Diğer webidl.util metotları için de minimal polyfill
if (typeof (globalThis as any).webidl?.util !== 'undefined') {
  const webidlUtil = (globalThis as any).webidl.util;
  if (typeof webidlUtil.markAsUncloneable !== 'function') webidlUtil.markAsUncloneable = () => {};
  if (typeof webidlUtil.toString !== 'function') webidlUtil.toString = () => '';
  if (typeof webidlUtil.Transferable !== 'function') webidlUtil.Transferable = function() {};
}

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

import { withSentryConfig } from '@sentry/nextjs';
import bundleAnalyzer from '@next/bundle-analyzer';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Bundle size optimizations: avoid bundling entire icon/util libs
  experimental: {
    optimizePackageImports: [
      'react-icons',
      'framer-motion',
      'date-fns',
      'lucide-react',
    ],
    // iyzipay dynamic fs.readdirSync + require pattern'i webpack/turbopack
    // tarafindan takip edilemiyor. Server Components bunlari external olarak
    // native require ile yukler.
    serverComponentsExternalPackages: [
      'iyzipay',
      '@react-pdf/renderer',
    ],
  },
  // Node-only paketleri server build'inde external et (iyzipay fs/http kullanır)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        'iyzipay',
        'playwright-core',
        'chromium-bidi',
        'kerberos',
        '@react-pdf/renderer',
      ];
    } else {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Strip console.log/debug/info in production (keep error/warn)
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
       {
        protocol: 'http',
        hostname: '**',
        pathname: '/**',
      },
    ],
    // Optimize images for mobile performance
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [320, 375, 390, 414, 640, 768, 1024, 1280, 1440, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com;",
  },
  // Bu satır, belirtilen paketlerin Next.js tarafından (ve dolayısıyla next/jest tarafından)
  // dönüştürülmesini (transpile) sağlar.
  transpilePackages: [
    'next-intl',
    'unified', 'remark', 'rehype', 'unist-util-visit', 'unist-util-is',
    'hast-util-to-string', 'hast-util-has-property', 'hast-util-is-element',
    'hast-util-whitespace', 'hast-util-from-string', 'web-namespaces',
    'vfile', 'vfile-message', 'unist-util-stringify-position', 'unist-util-position',
    'micromark', 'micromark-util-combine-extensions', 'micromark-util-symbol',
    'micromark-util-resolve-all', 'micromark-util-chunked', 'micromark-util-character',
    'micromark-factory-space', 'micromark-core-commonmark', 'decode-named-character-reference',
    'character-entities', 'ccount', 'mdast-util-to-string', 'mdast-util-gfm',
    'mdast-util-from-markdown', 'mdast-util-to-hast', 'mdast-util-find-and-replace',
    'micromark-extension-gfm', 'micromark-extension-gfm-autolink-literal',
    'micromark-extension-gfm-footnote', 'micromark-extension-gfm-strikethrough',
    'micromark-extension-gfm-table', 'micromark-extension-gfm-tagfilter',
    'mdast-util-gfm-autolink-literal', 'mdast-util-gfm-footnote',
    'mdast-util-gfm-strikethrough', 'mdast-util-gfm-table', 'mdast-util-to-markdown',
    'mdast-util-phrasing', 'unist-builder', 'unist-util-visit-parents',
    'unist-util-generated', 'github-slugger', 'refractor', 'hastscript',
    'property-information', 'space-separated-tokens', 'comma-separated-tokens',
    'trough', 'bail', 'is-plain-obj', 'zwitch', 'longest-streak'
  ],
  // Build-time DB errors prevention: disable static pre-rendering globally.
  // All pages that need live data use 'export const dynamic = force-dynamic' in their files.
  // This makes Next.js render all pages on-demand (SSR) instead of at build time.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  // Wildcard subdomain routing (Phase 3 B.6).
  // Prod-only: SUBDOMAIN_ROUTING_ENABLED env ile kontrol edilir.
  // Reverse proxy tarafi (Cloudflare Worker veya Vercel middleware) Host
  // header'ini okuyup /workspace/{slug} path'ine rewrite eder; burada
  // Next.js rewrite sadece path uzerinde olur, Host header Next.js tarafindan
  // dogal olarak okunmaz. Bu nedenle anahtar konfigurasyon proxy tarafidir;
  // Next.js sadece karsilayan route'un varligini saglar.
  async rewrites() {
    if (process.env.SUBDOMAIN_ROUTING_ENABLED !== 'true') {
      return [];
    }
    return [
      {
        source: '/workspace-redirect/:slug',
        destination: '/workspace/:slug',
      },
    ];
  },
  async headers() {
    return [
      // Immutable cache for uploaded images
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Immutable cache for Next.js static assets
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Immutable cache for public assets
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Security headers for all routes (CSP/HSTS/X-Frame-Options/defense-in-depth).
      // CSP ve HSTS ayrıca middleware.ts'de de set ediliyor; burada
      // static/cacheable response'lar (RSC payload, _next/data vb.) için
      // merkezi bir default saglaniyor.
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://static.cloudflareinsights.com https://mc.yandex.ru https://www.youtube.com https://youtube.com https://cdn.redocly.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "media-src 'self' https: http:",
              "frame-src 'self' https://www.youtube.com https://youtube.com https://challenges.cloudflare.com",
              "connect-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com https://cloudflareinsights.com https://mc.yandex.ru https://cdn.redocly.com",
              "worker-src 'self' blob: https://cdn.redocly.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          {
            // HSTS — middleware ile ayni politika; next.config tarafinda
            // tum static response'lara da eklenir. CDN/edge cache'lenmis
            // cevaplar icin merkezi default saglar.
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            // camera, microphone, geolocation, payment, usb, browsing-topics, interest-cohort
            // Tum hassas API'ler kapatildi. Gerekli oldugunda sayfa-bazli
            // Permissions-Policy header ile muafiyet tanimlanabilir.
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), interest-cohort=()'
          },
          {
            // Cross-Origin politika — clickjacking ve cross-origin izolasyon
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin'
          }
        ]
      }
    ];
  },
};

const sentryConfig = withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});

export default withBundleAnalyzer(withNextIntl(sentryConfig));
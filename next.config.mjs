/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    // Enable experimental features for better performance
    unoptimized: false,
    loader: 'default',
    path: '/_next/image',
    domains: [],
  },
  // Bu satır, belirtilen paketlerin Next.js tarafından (ve dolayısıyla next/jest tarafından)
  // dönüştürülmesini (transpile) sağlar.
  transpilePackages: [
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
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://mc.yandex.ru https://www.youtube.com https://youtube.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "media-src 'self' https: http:",
              "frame-src 'self' https://www.youtube.com https://youtube.com https://challenges.cloudflare.com",
              "connect-src 'self' https://challenges.cloudflare.com https://mc.yandex.ru",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
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
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
          }
        ]
      }
    ];
  },
};

export default nextConfig;
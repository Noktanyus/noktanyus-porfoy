/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'mc.yandex.ru',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
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
};

export default nextConfig;
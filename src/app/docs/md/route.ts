import { buildOpenApiIndexMarkdown } from '@/lib/openapiMarkdown';

export const dynamic = 'force-dynamic';

/** Agent-readable OpenAPI index (text/markdown). */
export async function GET() {
  const md = buildOpenApiIndexMarkdown('https://noktanyus.com');
  return new Response(md, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}

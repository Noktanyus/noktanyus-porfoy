import { buildEndpointMarkdown } from '@/lib/openapiMarkdown';

export const dynamic = 'force-dynamic';

type Ctx = { params: { slug: string[] } };

/** Per-endpoint Markdown for coding agents. */
export async function GET(_req: Request, ctx: Ctx) {
  const slug = (ctx.params.slug ?? []).join('/');
  const md = buildEndpointMarkdown(slug, 'https://noktanyus.com');
  if (!md) {
    return new Response('# Not found\n\nUnknown endpoint. See /docs/md\n', {
      status: 404,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
  }
  return new Response(md, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}

/**
 * GET /api/openapi/postman — OpenAPI'den Postman Collection v2.1 üret
 */

import { NextResponse } from 'next/server';
import { OPENAPI_SPEC_JSON } from '@/lib/openapi';

export const dynamic = 'force-dynamic';

type OpenApiPathItem = Record<string, unknown>;

function buildCollection(spec: Record<string, unknown>) {
  const info = (spec.info ?? {}) as { title?: string; version?: string; description?: string };
  const paths = (spec.paths ?? {}) as Record<string, OpenApiPathItem>;
  const servers = (spec.servers as { url?: string }[] | undefined) ?? [
    { url: 'https://noktanyus.com' },
  ];
  const baseUrl = servers[0]?.url ?? 'https://noktanyus.com';

  const items: unknown[] = [];

  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, opRaw] of Object.entries(methods)) {
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;
      const op = (opRaw ?? {}) as {
        summary?: string;
        operationId?: string;
        tags?: string[];
        requestBody?: { content?: Record<string, { example?: unknown; schema?: unknown }> };
      };
      const tag = op.tags?.[0] ?? 'API';
      let folder = items.find(
        (i) => typeof i === 'object' && i && (i as { name?: string }).name === tag
      ) as { name: string; item: unknown[] } | undefined;
      if (!folder) {
        folder = { name: tag, item: [] };
        items.push(folder);
      }

      const content = op.requestBody?.content?.['application/json'];
      const example =
        content?.example ??
        (content?.schema && typeof content.schema === 'object'
          ? undefined
          : undefined);

      folder.item.push({
        name: op.summary || op.operationId || `${method.toUpperCase()} ${path}`,
        request: {
          method: method.toUpperCase(),
          header: [
            { key: 'Content-Type', value: 'application/json' },
            { key: 'x-api-key', value: '{{NOKTANYUS_API_KEY}}', type: 'text' },
          ],
          body:
            method === 'get'
              ? undefined
              : {
                  mode: 'raw',
                  raw: JSON.stringify(example ?? { /* örnek gövde */ }, null, 2),
                  options: { raw: { language: 'json' } },
                },
          url: {
            raw: `${baseUrl}${path}`,
            host: [baseUrl.replace(/\/$/, '')],
            path: path.replace(/^\//, '').split('/'),
          },
          description: op.summary ?? '',
        },
      });
    }
  }

  return {
    info: {
      name: info.title ?? 'Noktanyus API',
      description: info.description ?? 'TR yardımcı API',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      version: info.version ?? '1.0.0',
    },
    variable: [
      { key: 'NOKTANYUS_API_KEY', value: 'nok_live_…' },
      { key: 'baseUrl', value: baseUrl },
    ],
    item: items,
  };
}

export async function GET() {
  const collection = buildCollection(OPENAPI_SPEC_JSON as unknown as Record<string, unknown>);
  return NextResponse.json(collection, {
    headers: {
      'Content-Disposition': 'attachment; filename="noktanyus.postman_collection.json"',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

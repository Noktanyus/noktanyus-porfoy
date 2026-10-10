/**
 * OpenAPI → agent-friendly Markdown (llms.txt / coding agents).
 */

import { OPENAPI_SPEC } from '@/lib/openapi';

type Op = {
  summary?: string;
  description?: string;
  tags?: string[];
  requestBody?: {
    content?: Record<
      string,
      { example?: unknown; schema?: Record<string, unknown> }
    >;
  };
  responses?: Record<
    string,
    {
      description?: string;
      content?: Record<string, { example?: unknown }>;
    }
  >;
  'x-codeSamples'?: Array<{ lang: string; label?: string; source: string }>;
};

function jsonBlock(value: unknown): string {
  return '```json\n' + JSON.stringify(value, null, 2) + '\n```';
}

export function listOpenApiEndpoints(): Array<{
  path: string;
  method: string;
  summary: string;
  mdPath: string;
}> {
  const out: Array<{
    path: string;
    method: string;
    summary: string;
    mdPath: string;
  }> = [];
  const paths = OPENAPI_SPEC.paths ?? {};
  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, op] of Object.entries(methods as Record<string, Op>)) {
      if (!op || typeof op !== 'object') continue;
      const slug = path.replace(/^\//, '');
      out.push({
        path,
        method: method.toUpperCase(),
        summary: op.summary ?? path,
        mdPath: `/docs/md/${slug}`,
      });
    }
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

export function buildOpenApiIndexMarkdown(baseUrl = 'https://noktanyus.com'): string {
  const lines = [
    '# Noktanyus API — Markdown index',
    '',
    `Base: \`${baseUrl}/api/v1\` · Auth: \`x-api-key\` veya \`Authorization: Bearer\``,
    '',
    `HTML docs: ${baseUrl}/docs · OpenAPI JSON: ${baseUrl}/openapi.json · llms.txt: ${baseUrl}/llms.txt · MCP: ${baseUrl}/docs/mcp · tools: ${baseUrl}/api/v1/agent/tools`,
    '',
    '## Endpoints',
    '',
  ];
  for (const e of listOpenApiEndpoints()) {
    lines.push(
      `- [\`${e.method} ${e.path}\`](${baseUrl}${e.mdPath}) — ${e.summary}`
    );
  }
  lines.push('');
  return lines.join('\n');
}

/** slug: "api/v1/validate/iban" (leading slash optional, .md suffix stripped) */
export function buildEndpointMarkdown(
  slugInput: string,
  baseUrl = 'https://noktanyus.com'
): string | null {
  let slug = slugInput.replace(/^\/+/, '').replace(/\.md$/i, '');
  const pathKey = '/' + slug;
  const methods = (OPENAPI_SPEC.paths as Record<string, Record<string, Op>>)[
    pathKey
  ];
  if (!methods) return null;

  const lines: string[] = [
    `# \`${pathKey}\``,
    '',
    `Canonical HTML: ${baseUrl}/docs · Index: ${baseUrl}/docs/md`,
    '',
  ];

  for (const [method, op] of Object.entries(methods)) {
    if (!op) continue;
    lines.push(`## ${method.toUpperCase()}`);
    if (op.summary) lines.push('', op.summary);
    if (op.description) lines.push('', op.description);
    if (op.tags?.length) lines.push('', `Tags: ${op.tags.join(', ')}`);

    const example =
      op.requestBody?.content?.['application/json']?.example ??
      op.requestBody?.content?.['application/json']?.schema;
    if (example !== undefined) {
      lines.push('', '### Request body example', '', jsonBlock(example));
    }

    const ok =
      op.responses?.['200']?.content?.['application/json']?.example ??
      op.responses?.['201']?.content?.['application/json']?.example;
    if (ok !== undefined) {
      lines.push('', '### Success response example', '', jsonBlock(ok));
    } else if (op.responses?.['200']?.description) {
      lines.push('', `### 200`, '', op.responses['200'].description);
    }

    const samples = op['x-codeSamples'];
    if (samples?.length) {
      lines.push('', '### Code samples');
      for (const s of samples) {
        lines.push('', `#### ${s.label ?? s.lang}`, '', '```' + s.lang, s.source, '```');
      }
    }

    lines.push(
      '',
      '### cURL',
      '',
      '```bash',
      `curl -X ${method.toUpperCase()} "${baseUrl}${pathKey}" \\`,
      `  -H "x-api-key: YOUR_API_KEY" \\`,
      `  -H "Content-Type: application/json" \\`,
      `  -d '${JSON.stringify(example ?? {})}'`,
      '```',
      ''
    );
  }

  return lines.join('\n');
}

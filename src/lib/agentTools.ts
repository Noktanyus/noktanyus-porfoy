/**
 * OpenAPI → MCP-style agent tool definitions (no MCP SDK).
 * Used by GET /api/v1/agent/tools and documented at /docs/mcp.
 */

import { OPENAPI_SPEC } from '@/lib/openapi';
import { listOpenApiEndpoints } from '@/lib/openapiMarkdown';

export type AgentToolAuth = 'none' | 'api_key';

export interface AgentToolHttp {
  method: string;
  path: string;
  auth: AgentToolAuth;
}

export interface AgentTool {
  /** MCP tools/list `name` */
  name: string;
  description: string;
  /** JSON Schema object for tools/call arguments */
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
  annotations: {
    readOnlyHint: boolean;
    destructiveHint: boolean;
    openWorldHint: boolean;
  };
  /** How to invoke over HTTP if the host has no MCP bridge */
  http: AgentToolHttp;
  tags?: string[];
}

type Op = {
  summary?: string;
  description?: string;
  tags?: string[];
  security?: Array<Record<string, string[]>>;
  parameters?: Array<{
    name: string;
    in: string;
    required?: boolean;
    description?: string;
    schema?: Record<string, unknown>;
  }>;
  requestBody?: {
    required?: boolean;
    content?: Record<
      string,
      { example?: unknown; schema?: Record<string, unknown> }
    >;
  };
};

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head']);

function toolNameFrom(method: string, path: string): string {
  const slug = path
    .replace(/^\/api\/v1\//, '')
    .replace(/^\/api\//, '')
    .replace(/^\//, '')
    .replace(/\{([^}]+)\}/g, '$1')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
  return `${method.toLowerCase()}_${slug || 'root'}`;
}

function schemaFromExample(example: unknown): Record<string, unknown> {
  if (!example || typeof example !== 'object' || Array.isArray(example)) {
    return {};
  }
  const properties: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(example as Record<string, unknown>)) {
    const t = typeof value;
    if (t === 'string' || t === 'number' || t === 'boolean') {
      properties[key] = { type: t, example: value };
    } else if (Array.isArray(value)) {
      properties[key] = { type: 'array', example: value };
    } else if (value && typeof value === 'object') {
      properties[key] = { type: 'object', example: value };
    } else {
      properties[key] = { type: 'string' };
    }
  }
  return properties;
}

function buildInputSchema(op: Op): AgentTool['inputSchema'] {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const p of op.parameters ?? []) {
    if (p.in !== 'path' && p.in !== 'query') continue;
    properties[p.name] = {
      ...(p.schema ?? { type: 'string' }),
      description: p.description ?? `${p.in} parameter`,
    };
    if (p.required) required.push(p.name);
  }

  const json = op.requestBody?.content?.['application/json'];
  if (json?.schema && typeof json.schema === 'object') {
    const schema = json.schema;
    if (schema.type === 'object' && schema.properties && typeof schema.properties === 'object') {
      Object.assign(properties, schema.properties as Record<string, unknown>);
      if (Array.isArray(schema.required)) {
        for (const r of schema.required as string[]) {
          if (!required.includes(r)) required.push(r);
        }
      }
    } else {
      properties.body = schema;
      if (op.requestBody?.required) required.push('body');
    }
  } else if (json?.example !== undefined) {
    Object.assign(properties, schemaFromExample(json.example));
    if (op.requestBody?.required && Object.keys(properties).length > 0) {
      for (const key of Object.keys(properties)) {
        if (!required.includes(key)) required.push(key);
      }
    }
  }

  return {
    type: 'object',
    properties,
    ...(required.length ? { required } : {}),
    additionalProperties: false,
  };
}

function needsApiKey(op: Op, method: string): boolean {
  if (op.security?.some((s) => 'ApiKeyAuth' in s)) return true;
  if (op.tags?.includes('TR API')) return true;
  // Session-only dashboard ops are not agent-callable with API key
  if (op.security?.some((s) => 'SessionCookie' in s) && !op.security.some((s) => 'ApiKeyAuth' in s)) {
    return false;
  }
  // Default: mutating TR paths under /api/v1 need a key
  return method !== 'get';
}

function isReadOnly(method: string): boolean {
  return method === 'get' || method === 'head';
}

/** Built-in safe tools (no API key) for health + docs discovery. */
export function buildSafeAgentTools(): AgentTool[] {
  return [
    {
      name: 'get_health',
      description:
        'Noktanyus sistem sağlık kontrolü (DB ping). Kimlik gerektirmez. GET /api/health.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      http: { method: 'GET', path: '/api/health', auth: 'none' },
      tags: ['meta'],
    },
    {
      name: 'list_api_docs',
      description:
        'OpenAPI’den üretilen agent Markdown API index’ini döner (endpoint listesi). Kimlik gerektirmez. GET /docs/md.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      http: { method: 'GET', path: '/docs/md', auth: 'none' },
      tags: ['meta', 'docs'],
    },
    {
      name: 'get_llms_txt',
      description:
        'Site özeti (llms.txt) — LLM/agent keşif dosyası. Kimlik gerektirmez. GET /llms.txt.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      http: { method: 'GET', path: '/llms.txt', auth: 'none' },
      tags: ['meta', 'docs'],
    },
  ];
}

/** OpenAPI paths → MCP-ish tool list (skips session-only mutations). */
export function buildOpenApiAgentTools(): AgentTool[] {
  const out: AgentTool[] = [];
  const paths = (OPENAPI_SPEC.paths ?? {}) as Record<string, Record<string, Op>>;

  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, op] of Object.entries(methods)) {
      if (!HTTP_METHODS.has(method) || !op || typeof op !== 'object') continue;

      // Skip pure session-cookie revoke/management that agents shouldn't call
      const sessionOnly =
        op.security?.length === 1 &&
        op.security[0] &&
        'SessionCookie' in op.security[0] &&
        !('ApiKeyAuth' in op.security[0]);
      if (sessionOnly) continue;

      const auth: AgentToolAuth = needsApiKey(op, method) ? 'api_key' : 'none';
      const readOnly = isReadOnly(method);
      const summary = op.summary ?? `${method.toUpperCase()} ${path}`;
      const description = [summary, op.description?.trim()].filter(Boolean).join(' — ');

      out.push({
        name: toolNameFrom(method, path),
        description,
        inputSchema: buildInputSchema(op),
        annotations: {
          readOnlyHint: readOnly,
          destructiveHint: method === 'delete',
          openWorldHint: auth === 'api_key',
        },
        http: {
          method: method.toUpperCase(),
          path,
          auth,
        },
        tags: op.tags,
      });
    }
  }

  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export function buildAgentToolsCatalog(baseUrl = 'https://noktanyus.com') {
  const safe = buildSafeAgentTools();
  const fromOpenApi = buildOpenApiAgentTools();
  const tools = [...safe, ...fromOpenApi];

  return {
    protocol: 'noktanyus.agent-tools/1',
    mcp_hint:
      'Tam MCP SDK sunucusu yok; tool tanımları MCP tools/list ile uyumlu. Host HTTP ile http.path çağırır.',
    base_url: baseUrl.replace(/\/$/, ''),
    auth: {
      type: 'api_key',
      header: 'x-api-key',
      alternate: 'Authorization: Bearer <key>',
      docs: `${baseUrl.replace(/\/$/, '')}/docs/mcp`,
    },
    resources: [
      { name: 'mcp.json', uri: `${baseUrl.replace(/\/$/, '')}/mcp.json` },
      { name: 'llms.txt', uri: `${baseUrl.replace(/\/$/, '')}/llms.txt` },
      { name: 'openapi', uri: `${baseUrl.replace(/\/$/, '')}/openapi.json` },
      { name: 'docs_md', uri: `${baseUrl.replace(/\/$/, '')}/docs/md` },
      { name: 'docs_html', uri: `${baseUrl.replace(/\/$/, '')}/docs` },
    ],
    safe_tool_names: safe.map((t) => t.name),
    endpoint_count: listOpenApiEndpoints().length,
    tools,
  };
}

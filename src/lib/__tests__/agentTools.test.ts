import { describe, expect, it } from 'vitest';
import {
  buildAgentToolsCatalog,
  buildOpenApiAgentTools,
  buildSafeAgentTools,
} from '@/lib/agentTools';

describe('agentTools', () => {
  it('exposes safe read-only meta tools', () => {
    const safe = buildSafeAgentTools();
    expect(safe.map((t) => t.name).sort()).toEqual([
      'get_health',
      'get_llms_txt',
      'list_api_docs',
    ]);
    for (const t of safe) {
      expect(t.http.auth).toBe('none');
      expect(t.annotations.readOnlyHint).toBe(true);
      expect(t.inputSchema.type).toBe('object');
    }
  });

  it('derives OpenAPI tools including validate/iban', () => {
    const tools = buildOpenApiAgentTools();
    expect(tools.length).toBeGreaterThan(5);
    const iban = tools.find((t) => t.http.path.includes('/validate/iban'));
    expect(iban).toBeTruthy();
    expect(iban!.http.method).toBe('POST');
    expect(iban!.http.auth).toBe('api_key');
    expect(iban!.name).toMatch(/validate_iban/);
    expect(iban!.inputSchema.properties).toBeTruthy();
  });

  it('skips session-only revoke endpoints', () => {
    const tools = buildOpenApiAgentTools();
    expect(tools.some((t) => t.http.path.includes('/api/user/api-keys'))).toBe(false);
  });

  it('builds catalog with resources and protocol', () => {
    const catalog = buildAgentToolsCatalog('https://noktanyus.com');
    expect(catalog.protocol).toBe('noktanyus.agent-tools/1');
    expect(catalog.safe_tool_names).toContain('get_health');
    expect(catalog.tools.length).toBeGreaterThan(catalog.safe_tool_names.length);
    expect(catalog.resources.some((r) => r.name === 'mcp.json')).toBe(true);
    expect(catalog.auth.header).toBe('x-api-key');
  });
});

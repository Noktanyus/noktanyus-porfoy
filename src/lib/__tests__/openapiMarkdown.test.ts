import { describe, expect, it } from 'vitest';
import {
  buildEndpointMarkdown,
  buildOpenApiIndexMarkdown,
  listOpenApiEndpoints,
} from '@/lib/openapiMarkdown';

describe('openapiMarkdown', () => {
  it('lists endpoints with md paths', () => {
    const list = listOpenApiEndpoints();
    expect(list.length).toBeGreaterThan(5);
    expect(list.some((e) => e.path.includes('/validate/iban'))).toBe(true);
  });

  it('builds index markdown', () => {
    const md = buildOpenApiIndexMarkdown();
    expect(md).toContain('# Noktanyus API');
    expect(md).toContain('/docs/md/');
    expect(md).toContain('/api/v1/agent/tools');
  });

  it('builds per-endpoint markdown', () => {
    const md = buildEndpointMarkdown('api/v1/validate/iban');
    expect(md).toBeTruthy();
    expect(md!).toContain('POST');
    expect(md!).toContain('curl');
  });

  it('returns null for unknown path', () => {
    expect(buildEndpointMarkdown('api/v1/nope')).toBeNull();
  });
});

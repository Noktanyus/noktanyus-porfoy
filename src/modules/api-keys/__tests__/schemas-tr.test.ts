/**
 * Unit tests for api-keys scope schema (TR API).
 */

import { describe, it, expect } from 'vitest';
import { CreateApiKeySchema, ApiKeyScopeSchema } from '../schemas';

describe('ApiKeyScopeSchema', () => {
  it('accepts TR scopes', () => {
    expect(ApiKeyScopeSchema.parse('tr:validate:write')).toBe('tr:validate:write');
    expect(ApiKeyScopeSchema.parse('tr:invoice:write')).toBe('tr:invoice:write');
  });

  it('defaults create scopes to tr:validate:write', () => {
    const parsed = CreateApiKeySchema.parse({ name: 'Prod' });
    expect(parsed.scopes).toEqual(['tr:validate:write']);
  });
});

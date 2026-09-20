/**
 * Unit tests for api-keys scope schema (TR API).
 */

import { describe, it, expect } from 'vitest';
import { CreateApiKeySchema, ApiKeyScopeSchema } from '../schemas';

describe('ApiKeyScopeSchema', () => {
  it('accepts TR scopes and granular API scopes', () => {
    expect(ApiKeyScopeSchema.parse('tr:validate:write')).toBe('tr:validate:write');
    expect(ApiKeyScopeSchema.parse('tr:invoice:write')).toBe('tr:invoice:write');
    expect(ApiKeyScopeSchema.parse('api:validate:iban')).toBe('api:validate:iban');
    expect(ApiKeyScopeSchema.parse('api:finance:kdv')).toBe('api:finance:kdv');
    expect(ApiKeyScopeSchema.parse('api:calendar:business-days')).toBe('api:calendar:business-days');
  });

  it('defaults create scopes to tr:validate:write', () => {
    const parsed = CreateApiKeySchema.parse({ name: 'Prod' });
    expect(parsed.scopes).toEqual(['tr:validate:write']);
  });

  it('accepts custom granular scopes in CreateApiKeySchema', () => {
    const parsed = CreateApiKeySchema.parse({
      name: 'Mobile App',
      scopes: ['api:validate:identity', 'api:validate:iban'],
    });
    expect(parsed.scopes).toEqual(['api:validate:identity', 'api:validate:iban']);
  });
});

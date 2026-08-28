/**
 * GraphQL schema unit tests
 *
 * Verifies the SDL parses cleanly and that the key query fields are present.
 * Resolver execution is tested via integration tests against a real DB.
 */

import { describe, it, expect } from 'vitest';
import { parse, print } from 'graphql';
import { typeDefs } from '../schema';

function extractStringContent(): string {
  // graphql-tag returns a DocumentNode — use print() to serialize it back to SDL
  return print(typeDefs as unknown as Parameters<typeof print>[0]);
}

describe('GraphQL Schema', () => {
  it('exports a parseable schema definition', () => {
    const source = extractStringContent();
    expect(() => parse(source)).not.toThrow();
  });

  it('declares the Blog type with expected fields', () => {
    const source = extractStringContent();
    expect(source).toMatch(/type Blog[\s\S]+slug: String!/);
    expect(source).toMatch(/type Blog[\s\S]+title: String!/);
    expect(source).toMatch(/type Blog[\s\S]+date: String!/);
  });

  it('declares the BlogConnection with filtering', () => {
    const source = extractStringContent();
    expect(source).toMatch(/type BlogConnection/);
    expect(source).toMatch(/nodes: \[Blog!\]!/);
    expect(source).toMatch(/totalCount: Int!/);
    expect(source).toMatch(/input BlogFilter/);
    expect(source).toMatch(/blogsConnection\(filter: BlogFilter/);
  });

  it('declares the Query root with all expected fields', () => {
    const source = extractStringContent();
    const expected = [
      'blogs(',
      'blog(slug:',
      'projects(',
      'project(slug:',
      'products(',
      'product(slug:',
      'plans:',
      'plan(slug:',
      'monitors(',
      'blogsConnection(',
    ];
    for (const field of expected) {
      expect(source).toContain(field);
    }
  });
});
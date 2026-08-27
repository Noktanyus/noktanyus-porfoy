import { describe, it, expect } from 'vitest';
import { BlogCreateSchema, TagsSchema } from '../blog';

describe('Blog Schema', () => {
  describe('TagsSchema', () => {
    it('valid tags array', () => {
      expect(TagsSchema.safeParse(['react', 'typescript']).success).toBe(true);
    });
    it('max 10 tags', () => {
      const tags = Array(11).fill('tag');
      expect(TagsSchema.safeParse(tags).success).toBe(false);
    });
    it('empty array ok (default)', () => {
      expect(TagsSchema.parse([])).toEqual([]);
    });
    it('rejects empty string tag', () => {
      expect(TagsSchema.safeParse(['']).success).toBe(false);
    });
  });

  describe('BlogCreateSchema', () => {
    const valid = {
      slug: 'test-post',
      title: 'Test Post',
      description: 'A test description',
      author: 'Yunus',
      category: 'Tech',
      content: 'This is a long enough content for the schema validation to pass.',
      tags: ['test'],
    };

    it('valid blog post', () => {
      expect(BlogCreateSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects invalid slug', () => {
      expect(BlogCreateSchema.safeParse({ ...valid, slug: 'Invalid Slug!' }).success).toBe(false);
    });

    it('requires minimum content length', () => {
      expect(BlogCreateSchema.safeParse({ ...valid, content: 'short' }).success).toBe(false);
    });
  });
});
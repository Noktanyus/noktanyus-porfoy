import { describe, it, expect } from 'vitest';
import { ProjectCreateSchema, TechnologiesSchema } from '../project';

describe('Project Schema', () => {
  describe('TechnologiesSchema', () => {
    it('valid technologies', () => {
      expect(TechnologiesSchema.safeParse(['React', 'TypeScript']).success).toBe(true);
    });
    it('requires at least 1 technology', () => {
      expect(TechnologiesSchema.safeParse([]).success).toBe(false);
    });
    it('max 20 technologies', () => {
      const techs = Array(21).fill('tech');
      expect(TechnologiesSchema.safeParse(techs).success).toBe(false);
    });
  });

  describe('ProjectCreateSchema', () => {
    const valid = {
      slug: 'my-project',
      title: 'My Project',
      description: 'A great project',
      technologies: ['React'],
      content: 'This is a long enough content for the schema validation to pass.',
    };

    it('valid project', () => {
      expect(ProjectCreateSchema.safeParse(valid).success).toBe(true);
    });

    it('optional fields default correctly', () => {
      const parsed = ProjectCreateSchema.parse(valid);
      expect(parsed.order).toBe(0);
      expect(parsed.featured).toBe(false);
      expect(parsed.isLive).toBe(false);
    });
  });
});